# KKK POS - Web3 线下支付系统

基于 Monad 区块链的线下商品支付系统，支持商家扫码收款和用户钱包支付。

## 🏗️ 项目架构

```
kkk_pos/
├── backend/                 # Node.js 后端服务
│   ├── src/
│   │   ├── config/         # 配置文件
│   │   ├── controllers/    # 控制器
│   │   ├── models/         # 数据模型（JSON 存储）
│   │   ├── routes/         # 路由
│   │   ├── services/       # 业务逻辑
│   │   └── utils/          # 工具函数
│   └── data/               # JSON 数据文件
├── frontend/
│   ├── merchant-mobile/    # 商家手机扫码端
│   ├── merchant-desktop/   # 商家电脑收银端
│   └── user-payment/       # 用户支付页面
├── contracts/              # 智能合约 ABI
└── docs/                   # 文档
```

## ✨ 核心功能

### 商家端
- 📱 **手机扫码**：扫描商品条码创建订单
- 💻 **电脑收银**：显示订单详情和支付二维码
- 🔊 **语音播报**：支付完成后自动播报
- 📦 **商品管理**：录入和管理商品信息
- 📊 **订单查询**：查看订单状态和历史

### 用户端
- 👛 **钱包连接**：通过 WalletConnect 连接钱包
- 💰 **USDT支付**：使用智能合约托管支付
- 📱 **扫码支付**：扫描商家二维码完成支付

## 🚀 技术栈

- **前端**：React 18 + Vite + TailwindCSS
- **后端**：Node.js + Express + JSON 文件存储
- **区块链**：Monad + ethers.js + WalletConnect
- **实时通信**：Socket.IO
- **支付代币**：USDT（通过智能合约）

## 📋 前置要求

- Node.js >= 18
- npm 或 yarn

## 🛠️ 安装和启动

### 1. 安装依赖

```bash
# 安装后端依赖
cd backend
npm install

# 安装商家手机端依赖
cd ../frontend/merchant-mobile
npm install

# 安装商家电脑端依赖
cd ../merchant-desktop
npm install

# 安装用户支付端依赖
cd ../user-payment
npm install
```

### 2. 配置环境变量

#### 后端配置

在 `backend` 目录下创建 `.env` 文件：

```bash
cd backend
cp env.example .env
```

编辑 `.env`：

```env
# 服务器配置
PORT=3000
NODE_ENV=development

# JWT 密钥
JWT_SECRET=your_jwt_secret_key_change_this_in_production

# Monad 配置（可选，测试阶段可留空）
MONAD_RPC_URL=https://testnet-rpc.monad.xyz
CONTRACT_ADDRESS=0xYourContractAddress
USDT_CONTRACT_ADDRESS=0xYourUSDTAddress

# 前端地址
MOBILE_URL=http://localhost:5173
DESKTOP_URL=http://localhost:5174
PAYMENT_URL=http://localhost:5175
```

#### 用户支付端配置（如需钱包支付）

在 `frontend/user-payment` 目录下创建 `.env` 文件：

```bash
cd frontend/user-payment
cp .env.example .env
```

编辑 `.env`：

```env
VITE_API_URL=http://localhost:3000/api
VITE_MONAD_RPC_URL=https://testnet-rpc.monad.xyz
VITE_CONTRACT_ADDRESS=0xYourContractAddress
VITE_USDT_ADDRESS=0xYourUSDTAddress
VITE_WALLET_CONNECT_PROJECT_ID=your_walletconnect_project_id
```

> 💡 **获取 WalletConnect Project ID**：访问 https://cloud.walletconnect.com/ 注册并创建项目

### 3. 初始化数据文件

```bash
cd backend
npm run init
```

### 4. 启动服务

```bash
# 启动后端（终端1）
cd backend
npm run dev

# 启动商家手机端（终端2）
cd frontend/merchant-mobile
npm run dev

# 启动商家电脑端（终端3）
cd frontend/merchant-desktop
npm run dev

# 启动用户支付端（终端4）
cd frontend/user-payment
npm run dev
```

## 📱 访问地址

- 商家手机端：http://localhost:5173
- 商家电脑端：http://localhost:5174
- 用户支付端：http://localhost:5175
- 后端 API：http://localhost:3000

## 🔄 业务流程

1. 商家在系统中录入商品信息（名称、进货价、售价、描述）
2. 商家在手机端登录，扫描商品条码
3. 系统根据商品ID查询价格，创建订单
4. 订单信息实时同步到商家电脑端
5. 电脑端生成支付二维码（包含订单ID的HTTP链接）
6. 用户扫码打开支付页面
7. 用户通过 WalletConnect 连接钱包
8. 页面显示订单详情，用户确认支付
9. 智能合约处理 USDT 托管支付
10. 后端监听合约事件，确认支付完成
11. 电脑端收到通知，语音播报"收款到账 XXX"
12. 订单状态更新为"已完成"

## 💡 两种使用模式

### 模式 A：完整 Web3 支付（需要配置）

**需要配置：**
- ✅ WalletConnect Project ID
- ✅ Monad RPC URL
- ✅ 智能合约地址
- ✅ USDT 合约地址

**功能：**
- ✅ 真实的钱包连接
- ✅ 链上 USDT 支付
- ✅ 智能合约托管
- ✅ 自动确认支付

### 模式 B：测试模式（无需配置）

**特点：**
- ✅ 无需任何区块链配置
- ✅ 可以测试完整的收银流程
- ✅ 可以测试订单创建和显示
- ⚠️ 支付功能为模拟状态

**适用场景：**
- 开发阶段测试 UI 和流程
- 演示系统功能
- 不需要真实支付的场景

## 📚 文档

### 快速上手
- **[快速开始](./QUICK_START.md)** - 最简单的启动指南
- **[钱包配置](./docs/WALLET_CONFIG.md)** - Web3 钱包支付配置
- **[移动访问](./docs/MOBILE_ACCESS.md)** - 手机访问本地服务

### 部署文档
- **[Zeabur 部署](./docs/ZEABUR_DEPLOY.md)** - ⭐️ 推荐：前后端一站式部署
- **[Vercel 部署](./docs/VERCEL_DEPLOY_QUICK.md)** - 仅前端部署
- **[通用部署](./docs/DEPLOYMENT.md)** - 其他平台参考

### 开发文档
- **[API 文档](./docs/API.md)** - 完整的 API 参考

## 🎯 快速测试

### 1. 注册商家账号
访问 http://localhost:5173，点击"立即注册"

### 2. 添加测试商品
登录后进入"商品管理"，添加商品

### 3. 测试收款流程
- 手机端：扫码收款（或手动输入商品ID）
- 电脑端：查看订单和二维码
- 用户端：扫码进入支付页面

## 📦 数据存储

系统使用 JSON 文件存储数据，位于 `backend/data/`：

```
backend/data/
├── merchants.json    # 商家信息
├── products.json     # 商品信息
└── orders.json       # 订单信息
```

**优点：**
- ✅ 无需安装数据库
- ✅ 数据直观可见
- ✅ 易于备份（复制目录）
- ✅ 适合开发测试

## 🔐 智能合约接口

需要合约支持以下功能：

```solidity
// 创建支付订单
function createPayment(bytes32 orderId, uint256 amount, address merchant) external

// 用户支付
function pay(bytes32 orderId) external

// 确认支付事件
event PaymentCompleted(bytes32 orderId, address user, address merchant, uint256 amount)
```

## 🐛 故障排除

### 后端无法启动
- 检查端口 3000 是否被占用：`lsof -i :3000`
- 检查 `.env` 文件是否存在
- 查看终端错误信息

### 前端无法连接后端
- 确认后端已启动
- 检查 API 地址配置
- 查看浏览器控制台（F12）

### 钱包无法连接
- 确认已配置 WalletConnect Project ID
- 检查网络连接
- 尝试刷新页面
- 查看 `docs/WALLET_CONFIG.md` 详细配置

### 语音播报不工作
- 确保浏览器支持 Web Speech API
- 检查浏览器是否允许自动播放音频
- 允许网站播放声音

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT License
