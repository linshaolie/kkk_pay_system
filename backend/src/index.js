import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import config from './config/index.js';
import { initializeData } from './config/database.js';
import { errorHandler } from './middleware/index.js';
import authRoutes from './routes/auth.js';
import productRoutes from './routes/products.js';
import orderRoutes from './routes/orders.js';
import BlockchainService from './services/blockchainService.js';

const app = express();

// 创建 HTTP 服务器
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: true, // 开发环境允许所有来源
    credentials: true,
  },
});

// 中间件
app.use(cors({
  origin: true, // 开发环境允许所有来源
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 将 io 实例存储到 app 中，供路由使用
app.set('io', io);

// 初始化区块链服务并存储到 app 中
const blockchainService = new BlockchainService(io);
await blockchainService.initialize();
app.set('blockchainService', blockchainService);

// 路由
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);

// 健康检查
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 错误处理
app.use(errorHandler);

// Socket.IO 连接处理
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  // 商家加入房间
  socket.on('join_merchant', (merchantId) => {
    socket.join(`merchant_${merchantId}`);
    console.log(`Merchant ${merchantId} joined room`);
  });

  // 商家离开房间
  socket.on('leave_merchant', (merchantId) => {
    socket.leave(`merchant_${merchantId}`);
    console.log(`Merchant ${merchantId} left room`);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// 初始化数据文件
await initializeData();

// 启动服务器
const PORT = config.port;
httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`
╔═══════════════════════════════════════╗
║   KKK POS Backend Server Started     ║
╠═══════════════════════════════════════╣
║  Protocol: HTTP                       
║  Port: ${PORT}                        
║  Environment: ${config.env}           
║  Storage: JSON Files                  
║  Network: Accessible from LAN         
╚═══════════════════════════════════════╝
  `);
});

// 优雅关闭
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  const blockchainService = app.get('blockchainService');
  if (blockchainService) {
    blockchainService.stopListening();
    blockchainService.stopAllPolling();
  }
  httpServer.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP server');
  const blockchainService = app.get('blockchainService');
  if (blockchainService) {
    blockchainService.stopListening();
    blockchainService.stopAllPolling();
  }
  httpServer.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});

export default app;
