import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { QRCodeSVG } from 'qrcode.react';
import { useAuth } from '../contexts/AuthContext';
import { SOCKET_URL, PAYMENT_URL, API_ENDPOINTS } from '../config/api';
import { speakPayment } from '../utils/speech';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { LogOut, CheckCircle, XCircle, Clock, DollarSign } from 'lucide-react';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [socket, setSocket] = useState(null);
  const [currentOrder, setCurrentOrder] = useState(null);
  const [stats, setStats] = useState({
    total_orders: 0,
    completed_orders: 0,
    total_amount: 0,
  });
  const [isPolling, setIsPolling] = useState(false); // 是否正在轮询

  // 轮询订单状态
  useEffect(() => {
    // 只有 pending 状态才需要轮询
    if (!currentOrder || currentOrder.order.status !== 'pending') {
      setIsPolling(false);
      return;
    }

    setIsPolling(true);
    console.log('开始轮询订单状态:', currentOrder.order.order_id);

    // 立即检查一次
    checkOrderStatus(currentOrder.order.order_id);

    // 每3秒轮询一次
    const pollInterval = setInterval(() => {
      checkOrderStatus(currentOrder.order.order_id);
    }, 3000);

    return () => {
      clearInterval(pollInterval);
      setIsPolling(false);
      console.log('停止轮询订单状态');
    };
  }, [currentOrder?.order.order_id, currentOrder?.order.status]); // 添加 status 到依赖

  const checkOrderStatus = async (orderId) => {
    try {
      const response = await api.get(API_ENDPOINTS.ORDER_BY_ID(orderId));
      if (response.success) {
        const order = response.data;
        
        // 如果订单状态变为已完成
        if (order.status === 'completed' && currentOrder.order.status === 'pending') {
          console.log('检测到订单已支付:', orderId);
          toast.success('支付成功！');
          
          // 语音播报
          speakPayment(order.amount);
          
          // 更新订单状态为已完成（不清除订单，让用户看到完成状态）
          setCurrentOrder({
            ...currentOrder,
            order: order
          });
          
          // 刷新统计数据
          fetchStats();
        }
        
        // 如果订单被取消
        if (order.status === 'cancelled' && currentOrder.order.status === 'pending') {
          console.log('检测到订单已取消:', orderId);
          toast('订单已取消', { icon: '❌' });
          
          // 更新订单状态为已取消
          setCurrentOrder({
            ...currentOrder,
            order: order
          });
        }
      }
    } catch (error) {
      console.error('轮询订单状态失败:', error);
      // 轮询失败不显示错误提示，避免干扰用户
    }
  };

  useEffect(() => {
    // 连接 Socket.IO
    const socketInstance = io(SOCKET_URL);
    setSocket(socketInstance);

    socketInstance.on('connect', () => {
      console.log('Socket connected');
      // 加入商家房间
      socketInstance.emit('join_merchant', user.id);
    });

    // 监听新订单
    socketInstance.on('new_order', (data) => {
      console.log('New order:', data);
      setCurrentOrder(data);
      toast.success('新订单已创建');
    });

    // 监听支付完成
    socketInstance.on('payment_completed', (data) => {
      console.log('Payment completed:', data);
      toast.success('支付成功！');
      
      // 语音播报
      speakPayment(data.amount);
      
      // 更新当前订单状态为已完成（不清除，让用户看到完成状态）
      if (currentOrder && currentOrder.order.order_id === data.orderId) {
        setCurrentOrder({
          ...currentOrder,
          order: {
            ...currentOrder.order,
            status: 'completed',
            user_wallet: data.userWallet,
            tx_hash: data.txHash,
          }
        });
      }
      
      // 刷新统计数据
      fetchStats();
    });

    // 监听订单取消
    socketInstance.on('order_cancelled', (data) => {
      console.log('Order cancelled:', data);
      if (currentOrder && currentOrder.order.order_id === data.orderId) {
        toast('订单已取消', { icon: '❌' });
        
        // 更新订单状态为已取消
        setCurrentOrder({
          ...currentOrder,
          order: {
            ...currentOrder.order,
            status: 'cancelled'
          }
        });
      }
    });

    return () => {
      socketInstance.disconnect();
    };
  }, [user.id]);

  useEffect(() => {
    fetchStats();
    // 每30秒刷新一次统计
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchStats = async () => {
    try {
      const response = await api.get(API_ENDPOINTS.TODAY_STATS);
      if (response.success) {
        setStats(response.data);
      }
    } catch (error) {
      console.error('获取统计数据失败:', error);
    }
  };

  const handleCancelOrder = async () => {
    if (!currentOrder) return;
    
    if (!confirm('确定要取消当前订单吗？')) return;

    try {
      const response = await api.put(API_ENDPOINTS.CANCEL_ORDER(currentOrder.order.order_id));
      if (response.success) {
        setCurrentOrder(null);
        toast.success('订单已取消');
      }
    } catch (error) {
      console.error('取消订单失败:', error);
    }
  };

  // 处理完成订单后的"继续收款"按钮
  const handleContinue = () => {
    setCurrentOrder(null);
    toast('准备接收下一笔订单', { icon: '✅' });
  };


  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">{user?.storeName}</h1>
              <p className="text-gray-600 text-sm mt-1">收银台系统</p>
            </div>
            <button
              onClick={logout}
              className="flex items-center space-x-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span>退出登录</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 左侧：统计数据 */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-lg p-6 text-white">
              <h2 className="text-lg font-semibold mb-4">今日销售统计</h2>
              <div className="space-y-4">
                <div className="bg-white/10 rounded-lg p-4">
                  <p className="text-blue-100 text-sm">订单总数</p>
                  <p className="text-3xl font-bold mt-1">{stats.total_orders}</p>
                </div>
                <div className="bg-white/10 rounded-lg p-4">
                  <p className="text-blue-100 text-sm">已完成</p>
                  <p className="text-3xl font-bold mt-1">{stats.completed_orders}</p>
                </div>
                <div className="bg-white/10 rounded-lg p-4">
                  <p className="text-blue-100 text-sm">销售额</p>
                  <p className="text-3xl font-bold mt-1">¥{stats.total_amount || 0}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow p-6">
              <h3 className="font-semibold text-gray-800 mb-3">系统状态</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 text-sm">连接状态</span>
                  <span className="flex items-center text-green-600 text-sm">
                    <div className="w-2 h-2 bg-green-600 rounded-full mr-2"></div>
                    已连接
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 text-sm">语音播报</span>
                  <span className="text-green-600 text-sm">已启用</span>
                </div>
              </div>
            </div>
          </div>

          {/* 右侧：订单显示区 */}
          <div className="lg:col-span-2">
            {currentOrder ? (
              <>
                {/* 待支付状态 */}
                {currentOrder.order.status === 'pending' && (
                  <div className="bg-white rounded-2xl shadow-lg p-8">
                    <div className="text-center mb-8">
                      <div className="inline-flex items-center justify-center w-16 h-16 bg-yellow-100 rounded-full mb-4">
                        <Clock className="w-8 h-8 text-yellow-600" />
                      </div>
                      <h2 className="text-2xl font-bold text-gray-800">待支付订单</h2>
                      <p className="text-gray-600 mt-2">请顾客扫描二维码完成支付</p>
                      
                      {/* 轮询状态指示器 */}
                      {isPolling && (
                        <div className="mt-4 inline-flex items-center space-x-2 text-sm text-blue-600">
                          <div className="w-2 h-2 bg-blue-600 rounded-full animate-ping"></div>
                          <span>正在监听支付状态...</span>
                        </div>
                      )}
                    </div>

                    {/* 订单信息 */}
                    <div className="bg-gray-50 rounded-xl p-6 mb-6">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-gray-600 text-sm">商品名称</p>
                          <p className="text-lg font-semibold text-gray-800 mt-1">
                            {currentOrder.order.product_name}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-600 text-sm">订单号</p>
                          <p className="text-sm font-mono text-gray-800 mt-1">
                            {currentOrder.order.order_id}
                          </p>
                        </div>
                        <div className="col-span-2">
                          <p className="text-gray-600 text-sm">支付金额</p>
                          <p className="text-4xl font-bold text-blue-600 mt-2">
                            ¥{currentOrder.order.amount}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* 二维码 */}
                    <div className="flex flex-col items-center mb-6">
                      <div className="bg-white p-6 rounded-2xl shadow-lg">
                        <QRCodeSVG
                          value={currentOrder.paymentUrl}
                          size={280}
                          level="H"
                          includeMargin={true}
                        />
                        <a href={currentOrder.paymentUrl} target="_blank" rel="noopener noreferrer">
                          goto Pay
                        </a>
                      </div>
                      <p className="text-gray-600 text-sm mt-4">
                        请使用钱包扫描二维码支付
                      </p>
                    </div>

                    {/* 操作按钮 */}
                    <button
                      onClick={handleCancelOrder}
                      className="w-full bg-red-500 text-white py-3 rounded-lg font-medium hover:bg-red-600 transition-colors"
                    >
                      取消订单
                    </button>
                  </div>
                )}

                {/* 支付完成状态 */}
                {currentOrder.order.status === 'completed' && (
                  <div className="bg-white rounded-2xl shadow-lg p-8">
                    <div className="text-center mb-8">
                      <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
                        <CheckCircle className="w-12 h-12 text-green-600" />
                      </div>
                      <h2 className="text-3xl font-bold text-green-600 mb-2">支付成功！</h2>
                      <p className="text-gray-600 text-lg">订单已完成</p>
                    </div>

                    {/* 订单信息 */}
                    <div className="bg-green-50 rounded-xl p-6 mb-6">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-gray-600 text-sm">商品名称</p>
                          <p className="text-lg font-semibold text-gray-800 mt-1">
                            {currentOrder.order.product_name}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-600 text-sm">订单号</p>
                          <p className="text-sm font-mono text-gray-800 mt-1">
                            {currentOrder.order.order_id}
                          </p>
                        </div>
                        <div className="col-span-2">
                          <p className="text-gray-600 text-sm">收款金额</p>
                          <p className="text-5xl font-bold text-green-600 mt-2">
                            ¥{currentOrder.order.amount}
                          </p>
                        </div>
                        {currentOrder.order.user_wallet && (
                          <div className="col-span-2">
                            <p className="text-gray-600 text-sm">付款人</p>
                            <p className="text-sm font-mono text-gray-800 mt-1">
                              {currentOrder.order.user_wallet}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* 成功动画效果 */}
                    <div className="mb-6 p-6 bg-gradient-to-r from-green-50 to-blue-50 rounded-xl text-center">
                      <p className="text-2xl font-bold text-gray-800">
                        🎉 收款成功 🎉
                      </p>
                      <p className="text-gray-600 mt-2">
                        感谢惠顾，欢迎下次光临
                      </p>
                    </div>

                    {/* 继续收款按钮 */}
                    <button
                      onClick={handleContinue}
                      className="w-full bg-blue-500 text-white py-4 rounded-lg font-bold text-lg hover:bg-blue-600 transition-colors shadow-lg"
                    >
                      继续收款
                    </button>
                  </div>
                )}

                {/* 已取消状态 */}
                {currentOrder.order.status === 'cancelled' && (
                  <div className="bg-white rounded-2xl shadow-lg p-8">
                    <div className="text-center mb-8">
                      <div className="inline-flex items-center justify-center w-20 h-20 bg-red-100 rounded-full mb-4">
                        <XCircle className="w-12 h-12 text-red-600" />
                      </div>
                      <h2 className="text-3xl font-bold text-red-600 mb-2">订单已取消</h2>
                      <p className="text-gray-600 text-lg">此订单已被取消</p>
                    </div>

                    {/* 订单信息 */}
                    <div className="bg-red-50 rounded-xl p-6 mb-6">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-gray-600 text-sm">商品名称</p>
                          <p className="text-lg font-semibold text-gray-800 mt-1">
                            {currentOrder.order.product_name}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-600 text-sm">订单号</p>
                          <p className="text-sm font-mono text-gray-800 mt-1">
                            {currentOrder.order.order_id}
                          </p>
                        </div>
                        <div className="col-span-2">
                          <p className="text-gray-600 text-sm">订单金额</p>
                          <p className="text-4xl font-bold text-gray-400 mt-2">
                            ¥{currentOrder.order.amount}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* 继续收款按钮 */}
                    <button
                      onClick={handleContinue}
                      className="w-full bg-blue-500 text-white py-4 rounded-lg font-bold text-lg hover:bg-blue-600 transition-colors"
                    >
                      继续收款
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
                <div className="inline-flex items-center justify-center w-24 h-24 bg-gray-100 rounded-full mb-6">
                  <DollarSign className="w-12 h-12 text-gray-400" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">等待订单</h2>
                <p className="text-gray-600">
                  请在手机端扫描商品条码创建订单
                </p>
                <div className="mt-8 p-6 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800">
                    💡 提示：扫码后订单会自动显示在此处
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
