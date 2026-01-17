import express from 'express';
import { body, param } from 'express-validator';
import {
  createOrder,
  getOrderByOrderId,
  getOrders,
  getPendingOrders,
  cancelOrder,
  getTodayStats,
} from '../controllers/orderController.js';
import { authMiddleware } from '../middleware/index.js';

const router = express.Router();

// 创建订单（需要认证）
router.post('/',
  authMiddleware,
  [
    body('productId').trim().notEmpty().withMessage('商品ID不能为空'),
  ],
  (req, res) => createOrder(
    req, 
    res, 
    req.app.get('io'),
    req.app.get('blockchainService')
  )
);

// 获取订单详情（无需认证，用于用户支付页面）
router.get('/:orderId', getOrderByOrderId);

// 获取商家订单列表（需要认证）
router.get('/merchant/list', authMiddleware, getOrders);

// 获取待支付订单（需要认证）
router.get('/merchant/pending', authMiddleware, getPendingOrders);

// 取消订单（需要认证）
router.put('/:orderId/cancel',
  authMiddleware,
  [
    param('orderId').notEmpty().withMessage('订单ID不能为空'),
  ],
  (req, res) => cancelOrder(
    req, 
    res, 
    req.app.get('io'),
    req.app.get('blockchainService')
  )
);

// 获取今日统计（需要认证）
router.get('/merchant/stats/today', authMiddleware, getTodayStats);

export default router;
