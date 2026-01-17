import { ethers } from 'ethers';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import config from '../config/index.js';
import Order from '../models/Order.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 读取合约 ABI
const CONTRACT_ABI = JSON.parse(
  readFileSync(join(__dirname, '../../../contracts/PaymentContract.abi.json'), 'utf8')
);

class BlockchainService {
  constructor(io) {
    this.io = io;
    this.provider = null;
    this.contract = null;
    this.isListening = false;
    this.eventListenerSupported = true; // 标记 RPC 是否支持事件监听
    this.pollingOrders = new Map(); // 存储正在轮询的订单 { orderId: intervalId }
  }

  // 初始化
  async initialize() {
    try {
      if (!config.blockchain.rpcUrl || !config.blockchain.contractAddress) {
        console.warn('区块链配置不完整，跳过初始化');
        return;
      }

      this.provider = new ethers.JsonRpcProvider(config.blockchain.rpcUrl);
      this.contract = new ethers.Contract(
        config.blockchain.contractAddress,
        CONTRACT_ABI,
        this.provider
      );

      console.log('区块链服务初始化成功');
      console.log('支付代币：MON (Monad 原生代币)');
      await this.startListening();
    } catch (error) {
      console.error('区块链服务初始化失败:', error);
    }
  }

  // 开始监听合约事件
  async startListening() {
    if (this.isListening || !this.contract) {
      return;
    }

    try {
      console.log('开始监听支付完成事件...');

      // 测试 RPC 是否支持 eth_newFilter
      try {
        await this.provider.send('eth_newFilter', [{
          address: this.contract.target,
          topics: []
        }]);
      } catch (testError) {
        if (testError.code === 'UNKNOWN_ERROR' && testError.error?.code === -32601) {
          console.warn('⚠️  当前 RPC 节点不支持 eth_newFilter 方法');
          console.warn('💡 影响：');
          console.warn('   ✅ 基本功能正常（创建订单、生成二维码）');
          console.warn('   ❌ 无法自动监听链上支付完成事件');
          console.warn('   ❌ 商家端不会自动收到支付语音播报');
          console.warn('');
          console.warn('🔧 解决方案：');
          console.warn('   1. 使用支持完整 JSON-RPC 的 Monad 节点');
          console.warn('   2. 或在生产环境部署后联系 Monad 团队获取节点信息');
          console.warn('   3. 临时方案：用户支付后商家手动刷新订单列表');
          this.eventListenerSupported = false;
          return;
        }
      }

      // 设置事件监听器 - 监听 PaymentMade 事件
      this.contract.on('PaymentMade', async (orderId, payer, token, amount, timestamp, event) => {
        try {
          console.log('收到支付完成事件:', {
            orderId: orderId.toString(),
            payer,
            token,
            amount: ethers.formatEther(amount) + ' MON',
            timestamp: timestamp.toString(),
            txHash: event.log.transactionHash,
          });

          // orderId 是 uint256，直接转换为字符串（数字订单号）
          const orderIdStr = orderId.toString();
          
          console.log('订单ID:', orderIdStr);
          
          // 更新订单状态
          await Order.updateStatus(
            orderIdStr,
            'completed',
            event.log.transactionHash,
            payer
          );

          // 获取订单详情
          const order = await Order.findByOrderId(orderIdStr);

          if (order) {
            // 通知商家电脑端
            this.io.to(`merchant_${order.merchant_id}`).emit('payment_completed', {
              orderId: orderIdStr,
              amount: order.amount,
              txHash: event.log.transactionHash,
              userWallet: payer,
            });

            console.log(`✅ 订单 ${orderIdStr} 支付成功，已通知商家`);
          } else {
            console.warn(`⚠️  订单 ${orderIdStr} 不存在，可能已被删除`);
          }
        } catch (error) {
          console.error('❌ 处理支付完成事件失败:', error);
        }
      });

      this.isListening = true;
      console.log('✅ 合约事件监听已启动');
      console.log('📡 等待链上支付事件...');
    } catch (error) {
      console.error('⚠️  启动事件监听失败:', error.message);
      this.isListening = false;
      this.eventListenerSupported = false;
    }
  }

  // 停止监听
  stopListening() {
    if (this.contract && this.isListening) {
      this.contract.removeAllListeners('PaymentMade');
      this.isListening = false;
      console.log('合约事件监听已停止');
    }
  }

  // UUID 转 uint256 (将 UUID 转换为数字)
  uuidToUint256(uuid) {
    // 移除连字符，得到32个十六进制字符
    const hex = uuid.replace(/-/g, '');
    // 转换为 BigInt
    return BigInt('0x' + hex);
  }

  // uint256 转 UUID (如果需要的话，但实际上订单ID就是 uint256 字符串)
  uint256ToUUID(uint256Str) {
    // 如果订单ID本来就是数字字符串，直接返回
    // 如果需要转回 UUID 格式，可以补零并格式化
    return uint256Str.toString();
  }

  // 获取交易详情
  async getTransaction(txHash) {
    if (!this.provider) {
      throw new Error('Provider not initialized');
    }
    return await this.provider.getTransaction(txHash);
  }

  // 获取交易回执
  async getTransactionReceipt(txHash) {
    if (!this.provider) {
      throw new Error('Provider not initialized');
    }
    return await this.provider.getTransactionReceipt(txHash);
  }

  // 开始轮询订单支付状态
  async startPollingOrder(orderId) {
    // 如果事件监听正常工作，则不需要轮询
    if (this.eventListenerSupported && this.isListening) {
      console.log(`📡 事件监听已启用，订单 ${orderId} 无需轮询`);
      return;
    }

    // 如果已经在轮询，跳过
    if (this.pollingOrders.has(orderId)) {
      console.log(`⏱️  订单 ${orderId} 已在轮询中`);
      return;
    }

    if (!this.contract) {
      console.warn('⚠️  合约未初始化，无法开始轮询');
      return;
    }

    console.log(`🔄 开始轮询订单 ${orderId} 的链上支付状态...`);

    // 每5秒查询一次
    const intervalId = setInterval(async () => {
      try {
        await this.checkOrderPaymentStatus(orderId);
      } catch (error) {
        console.error(`❌ 轮询订单 ${orderId} 状态失败:`, error.message);
      }
    }, 5000);

    // 保存 intervalId
    this.pollingOrders.set(orderId, intervalId);

    // 设置最长轮询时间：30分钟（支付超时时间）
    setTimeout(() => {
      this.stopPollingOrder(orderId);
      console.log(`⏰ 订单 ${orderId} 轮询超时（30分钟），已停止轮询`);
    }, 30 * 60 * 1000);
  }

  // 停止轮询订单
  stopPollingOrder(orderId) {
    const intervalId = this.pollingOrders.get(orderId);
    if (intervalId) {
      clearInterval(intervalId);
      this.pollingOrders.delete(orderId);
      console.log(`⏹️  已停止轮询订单 ${orderId}`);
    }
  }

  // 检查订单支付状态
  async checkOrderPaymentStatus(orderId) {
    try {
      // 先查询后端订单状态
      const order = await Order.findByOrderId(orderId);
      
      if (!order) {
        console.warn(`⚠️  订单 ${orderId} 不存在`);
        this.stopPollingOrder(orderId);
        return;
      }

      // 如果订单已经完成或取消，停止轮询
      if (order.status === 'completed' || order.status === 'cancelled') {
        console.log(`✅ 订单 ${orderId} 状态已更新为 ${order.status}，停止轮询`);
        this.stopPollingOrder(orderId);
        return;
      }

      // 查询合约：订单是否已支付
      const orderIdBigInt = BigInt(orderId);
      const isPaid = await this.contract.isOrderPaid(orderIdBigInt);

      if (isPaid) {
        console.log(`💰 检测到订单 ${orderId} 已在链上支付！`);

        // 获取支付详情
        const paymentInfo = await this.contract.getPayment(orderIdBigInt);
        
        console.log('链上支付信息:', {
          orderId: paymentInfo.orderId.toString(),
          payer: paymentInfo.payer,
          token: paymentInfo.token,
          amount: ethers.formatEther(paymentInfo.amount) + ' MON',
          timestamp: new Date(Number(paymentInfo.timestamp) * 1000).toLocaleString(),
        });

        // 更新后端订单状态
        await Order.updateStatus(
          orderId,
          'completed',
          null, // txHash 通过轮询无法直接获取，可以为空
          paymentInfo.payer
        );

        // 重新获取订单详情
        const updatedOrder = await Order.findByOrderId(orderId);

        if (updatedOrder) {
          // 通知商家电脑端
          this.io.to(`merchant_${updatedOrder.merchant_id}`).emit('payment_completed', {
            orderId,
            amount: updatedOrder.amount,
            txHash: null,
            userWallet: paymentInfo.payer,
          });

          console.log(`✅ 订单 ${orderId} 支付成功，已通知商家（通过轮询）`);
        }

        // 停止轮询
        this.stopPollingOrder(orderId);
      } else {
        // 未支付，继续轮询（不输出日志避免刷屏）
      }
    } catch (error) {
      console.error(`❌ 检查订单 ${orderId} 支付状态失败:`, error.message);
      // 继续轮询，不停止
    }
  }

  // 停止所有轮询
  stopAllPolling() {
    console.log('🛑 停止所有订单轮询...');
    for (const [orderId, intervalId] of this.pollingOrders.entries()) {
      clearInterval(intervalId);
      console.log(`⏹️  已停止轮询订单 ${orderId}`);
    }
    this.pollingOrders.clear();
  }
}

export default BlockchainService;
