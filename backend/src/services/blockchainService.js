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
}

export default BlockchainService;
