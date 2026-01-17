import Order from '../models/Order.js';
import Product from '../models/Product.js';
import config from '../config/index.js';

// 生成数字订单号（时间戳 + 随机数）
const generateNumericOrderId = () => {
  const timestamp = Date.now(); // 13位时间戳
  const random = Math.floor(Math.random() * 100000); // 5位随机数
  return `${timestamp}${random}`; // 18位数字
};

// 创建订单
export const createOrder = async (req, res, io) => {
  try {
    const { productId } = req.body;
    const merchantId = req.user.id;

    // 查找商品
    const product = await Product.findByProductId(productId, merchantId);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: '商品不存在',
      });
    }

    // 生成数字订单ID
    const orderId = generateNumericOrderId();

    // 创建订单
    await Order.create({
      orderId,
      merchantId,
      productId: product.product_id,
      productName: product.name,
      amount: product.sale_price,
      status: 'pending',
    });

    // 获取订单详情
    const order = await Order.findByOrderId(orderId);

    // 生成支付链接
    const paymentUrl = `${config.frontend.paymentUrl}/pay/${orderId}`;

    // 通过 Socket.IO 通知商家电脑端
    if (io) {
      io.to(`merchant_${merchantId}`).emit('new_order', {
        order,
        paymentUrl,
      });
    }

    return res.status(201).json({
      success: true,
      message: '订单创建成功',
      data: {
        order,
        paymentUrl,
      },
    });
  } catch (error) {
    console.error('Create order error:', error);
    return res.status(500).json({
      success: false,
      message: '创建订单失败',
      error: error.message,
    });
  }
};

// 获取订单详情（无需认证，用户支付页面调用）
export const getOrderByOrderId = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findByOrderId(orderId);
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: '订单不存在',
      });
    }

    return res.json({
      success: true,
      data: order,
    });
  } catch (error) {
    console.error('Get order error:', error);
    return res.status(500).json({
      success: false,
      message: '获取订单详情失败',
      error: error.message,
    });
  }
};

// 获取商家订单列表
export const getOrders = async (req, res) => {
  try {
    const merchantId = req.user.id;
    const status = req.query.status;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    const orders = await Order.findByMerchantId(merchantId, status, page, limit);
    const total = await Order.countByMerchant(merchantId, status);

    return res.json({
      success: true,
      data: {
        orders,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error('Get orders error:', error);
    return res.status(500).json({
      success: false,
      message: '获取订单列表失败',
      error: error.message,
    });
  }
};

// 获取待支付订单
export const getPendingOrders = async (req, res) => {
  try {
    const merchantId = req.user.id;
    const orders = await Order.getPendingOrders(merchantId);

    return res.json({
      success: true,
      data: orders,
    });
  } catch (error) {
    console.error('Get pending orders error:', error);
    return res.status(500).json({
      success: false,
      message: '获取待支付订单失败',
      error: error.message,
    });
  }
};

// 取消订单
export const cancelOrder = async (req, res, io) => {
  try {
    const { orderId } = req.params;
    const merchantId = req.user.id;

    const order = await Order.findByOrderId(orderId);
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: '订单不存在',
      });
    }

    // 验证权限
    if (order.merchant_id !== merchantId) {
      return res.status(403).json({
        success: false,
        message: '无权限操作此订单',
      });
    }

    // 只能取消待支付订单
    if (order.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: '只能取消待支付订单',
      });
    }

    await Order.updateStatus(orderId, 'cancelled');

    // 通知商家电脑端
    if (io) {
      io.to(`merchant_${merchantId}`).emit('order_cancelled', {
        orderId,
      });
    }

    return res.json({
      success: true,
      message: '订单已取消',
    });
  } catch (error) {
    console.error('Cancel order error:', error);
    return res.status(500).json({
      success: false,
      message: '取消订单失败',
      error: error.message,
    });
  }
};

// 获取今日统计
export const getTodayStats = async (req, res) => {
  try {
    const merchantId = req.user.id;
    const stats = await Order.getTodayStats(merchantId);

    return res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('Get today stats error:', error);
    return res.status(500).json({
      success: false,
      message: '获取统计数据失败',
      error: error.message,
    });
  }
};
