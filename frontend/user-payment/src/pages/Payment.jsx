import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAccount, useConnect, useDisconnect, useSwitchChain } from 'wagmi';
import { ethers } from 'ethers';
import api from '../utils/api';
import { API_ENDPOINTS } from '../config';
import { CONTRACT_ADDRESS, MONAD_CHAIN } from '../config';
import { PAYMENT_CONTRACT_ABI } from '../contracts/abi';
import toast from 'react-hot-toast';
import { Wallet, CheckCircle, XCircle, Loader2 } from 'lucide-react';

export default function Payment() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { address, isConnected, connector } = useAccount();
  const { connect, connectors, isPending: isConnecting } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChain } = useSwitchChain();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState(null); // 'success', 'failed', null
  const [isClient, setIsClient] = useState(false);
  const hasTriedAutoConnect = useRef(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    fetchOrder();
  }, [orderId]);

  // 自动连接钱包（仅在首次加载时尝试一次）
  useEffect(() => {
    if (isClient && !hasTriedAutoConnect.current && !isConnected && !isConnecting) {
      // 检查是否有可用的注入钱包（如 MetaMask）
      if (typeof window !== 'undefined' && window.ethereum) {
        // 查找 injected connector
        const injectedConnector = connectors.find((connector) => 
          connector.type === 'injected'
        );
        if (injectedConnector) {
          hasTriedAutoConnect.current = true;
          connect({ connector: injectedConnector });
        }
      }
    }
  }, [isClient, isConnected, isConnecting, connect, connectors]);

  const fetchOrder = async () => {
    try {
      const response = await api.get(API_ENDPOINTS.ORDER_BY_ID(orderId));
      if (response.success) {
        setOrder(response.data);
        
        // 检查订单状态
        if (response.data.status === 'completed') {
          setPaymentStatus('success');
        } else if (response.data.status === 'cancelled') {
          setPaymentStatus('failed');
        }
      } else {
        toast.error('订单不存在');
        navigate('/');
      }
    } catch (error) {
      console.error('获取订单失败:', error);
      toast.error('订单不存在');
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async (connector) => {
    try {
      await connect({ connector });
      toast.success('钱包连接成功');
    } catch (error) {
      console.error('连接钱包失败:', error);
      toast.error('连接钱包失败');
    }
  };

  const handlePay = async () => {
    if (!isConnected || !address) {
      toast.error('请先连接钱包');
      return;
    }

    if (order.status !== 'pending') {
      toast.error('订单状态异常');
      return;
    }

    setPaying(true);

    try {
      // 获取 provider 和 signer
      const provider = await connector.getProvider();
      const ethersProvider = new ethers.BrowserProvider(provider);
      const signer = await ethersProvider.getSigner();

      // 检查网络
      const network = await ethersProvider.getNetwork();
      if (Number(network.chainId) !== MONAD_CHAIN.id) {
        toast.error('请切换到 Monad 网络');
        if (switchChain) {
          switchChain({ chainId: MONAD_CHAIN.id });
        }
        setPaying(false);
        return;
      }

      // 支付合约
      const paymentContract = new ethers.Contract(CONTRACT_ADDRESS, PAYMENT_CONTRACT_ABI, signer);

      // 支付金额（MON，18位小数）
      const amount = ethers.parseEther(order.amount.toString());

      // 检查 MON 余额
      const balance = await ethersProvider.getBalance(address);
      if (balance < amount) {
        toast.error('MON 余额不足');
        setPaying(false);
        return;
      }

      // 将 orderId（UUID 字符串）转换为 uint256
      // 方法：移除连字符，转换为十六进制数字
      const orderIdHex = '0x' + orderId.replace(/-/g, '');
      const orderIdUint256 = BigInt(orderIdHex);

      toast.loading('正在支付...', { id: 'pay' });

      // 调用支付函数：pay(uint256 orderId, address token, uint256 amount)
      // token 使用 address(0) 表示 ETH/MON
      const payTx = await paymentContract.pay(
        orderIdUint256,
        ethers.ZeroAddress, // address(0) 表示使用原生代币（MON）
        amount,
        {
          value: amount, // 发送 MON 作为交易的 value
        }
      );
      
      toast.loading('等待交易确认...', { id: 'pay' });
      
      await payTx.wait();

      toast.success('支付成功！', { id: 'pay' });
      setPaymentStatus('success');

      // 刷新订单状态
      setTimeout(() => {
        fetchOrder();
      }, 2000);

    } catch (error) {
      console.error('支付失败:', error);
      
      if (error.code === 'ACTION_REJECTED') {
        toast.error('用户取消支付');
      } else {
        toast.error('支付失败: ' + (error.message || '未知错误'));
      }
      
      setPaying(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800">订单不存在</h2>
        </div>
      </div>
    );
  }

  if (paymentStatus === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-6">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">支付成功！</h2>
          <p className="text-gray-600 mb-6">您的订单已完成支付</p>
          
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="flex justify-between mb-2">
              <span className="text-gray-600">商品名称</span>
              <span className="font-semibold">{order.product_name}</span>
            </div>
            <div className="flex justify-between mb-2">
              <span className="text-gray-600">支付金额</span>
              <span className="font-semibold text-green-600">{order.amount} MON</span>
            </div>
            {order.tx_hash && (
              <div className="flex justify-between">
                <span className="text-gray-600">交易哈希</span>
                <span className="font-mono text-xs">{order.tx_hash.slice(0, 10)}...</span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (paymentStatus === 'failed' || order.status === 'cancelled') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-red-100 rounded-full mb-6">
            <XCircle className="w-12 h-12 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">订单已取消</h2>
          <p className="text-gray-600">该订单已被取消，无法继续支付</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">订单支付</h1>
          <p className="text-gray-600">{order.store_name}</p>
        </div>

        {/* 订单信息 */}
        <div className="bg-gray-50 rounded-xl p-6 mb-6">
          <div className="mb-4">
            <p className="text-gray-600 text-sm mb-1">商品名称</p>
            <p className="text-lg font-semibold text-gray-800">{order.product_name}</p>
          </div>
          <div className="mb-4">
            <p className="text-gray-600 text-sm mb-1">订单号</p>
            <p className="text-sm font-mono text-gray-800">{order.order_id}</p>
          </div>
          <div className="pt-4 border-t border-gray-200">
            <div className="flex justify-between items-center">
              <p className="text-gray-600">支付金额</p>
              <div className="text-right">
                <p className="text-3xl font-bold text-blue-600">{order.amount}</p>
                <p className="text-sm text-gray-500">MON</p>
              </div>
            </div>
          </div>
        </div>

        {/* 钱包连接 */}
        {!isConnected ? (
          <div className="space-y-3">
            <p className="text-center text-gray-600 text-sm mb-4">
              请连接钱包完成支付
            </p>
            {connectors.map((connector) => (
              <button
                key={connector.id}
                onClick={() => handleConnect(connector)}
                disabled={isConnecting}
                className="w-full bg-blue-500 text-white py-3 rounded-lg font-medium hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
              >
                <Wallet className="w-5 h-5" />
                <span>{connector.name}</span>
              </button>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-sm text-green-800 mb-1">已连接钱包</p>
              <p className="text-xs font-mono text-green-600">
                {address?.slice(0, 6)}...{address?.slice(-4)}
              </p>
            </div>

            <button
              onClick={handlePay}
              disabled={paying || order.status !== 'pending'}
              className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white py-4 rounded-lg font-bold hover:from-green-600 hover:to-green-700 disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed transition-all flex items-center justify-center space-x-2"
            >
              {paying ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>支付中...</span>
                </>
              ) : (
                <>
                  <span>立即支付 {order.amount} MON</span>
                </>
              )}
            </button>

            <button
              onClick={() => disconnect()}
              className="w-full text-gray-600 py-2 text-sm hover:text-gray-800"
            >
              断开钱包
            </button>
          </div>
        )}

        {/* 提示信息 */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <p className="text-xs text-blue-800">
            💡 支付将使用 Monad 原生代币 MON，通过智能合约托管，确保交易安全
          </p>
        </div>
      </div>
    </div>
  );
}
