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
- 💰 **MON支付**：使用 Monad 原生代币支付
- 📱 **扫码支付**：扫描商家二维码完成支付
- 🔄 **自动切换网络**：钱包自动切换到 Monad 网络

## 🚀 技术栈

- **前端**：React 18 + Vite + TailwindCSS
- **后端**：Node.js + Express + JSON 文件存储
- **区块链**：Monad Devnet + ethers.js + WalletConnect
- **实时通信**：Socket.IO
- **支付代币**：MON（Monad 原生代币）
- **支付确认**：事件监听 + 状态轮询（双重保障）

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

# 前端地址
MOBILE_URL=http://localhost:5173
DESKTOP_URL=http://localhost:5174
PAYMENT_URL=http://localhost:5176
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
VITE_MONAD_RPC_URL=https://testnet-rpc.monad.xyz  # 可选，使用钱包默认 RPC
VITE_CONTRACT_ADDRESS=0xba53E893Ba76B8971E913d2fB83970aC7CC7a25E
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
- 用户支付端：http://localhost:5176
- 后端 API：http://localhost:3000

## 🔄 业务流程

1. 商家在系统中录入商品信息（名称、进货价、售价、描述）
2. 商家在手机端登录，扫描商品条码
3. 系统根据商品ID查询价格，创建订单
4. 订单信息实时同步到商家电脑端
5. 电脑端生成支付二维码（包含订单ID的HTTP链接）
6. 用户扫码打开支付页面
7. 用户通过 WalletConnect 连接钱包（自动切换到 Monad 网络）
8. 页面显示订单详情，用户确认支付
9. 智能合约处理 MON 支付（原生代币转账）
10. 后端通过双重机制确认支付：
    - **事件监听**：实时监听合约 `PaymentMade` 事件（优先）
    - **状态轮询**：每5秒查询合约 `isOrderPaid` 函数（备用）
11. 电脑端收到通知，语音播报"收款到账 XXX"
12. 订单状态更新为"已完成"

## 💡 使用模式

### 🎬 DEMO 演示模式（推荐新手）

**特点：**
- ✅ **零配置**：无需任何区块链配置
- ⚡ **快速演示**：订单创建 5 秒后自动完成
- 🔊 **完整体验**：语音播报、订单通知全部正常
- 🎯 **适用场景**：系统演示、功能测试、培训教学

**工作流程：**
```
创建订单 → 等待 5 秒 → 自动完成 → 语音播报"收款到账"
```

📖 **详细说明**：[DEMO 模式文档](./docs/DEMO_MODE.md)

---

### 💰 真实支付模式

**需要配置：**
- ✅ WalletConnect Project ID
- ✅ 智能合约地址
- 🔧 Monad RPC URL（可选，使用钱包默认 RPC）

**功能：**
- ✅ 真实的钱包连接
- ✅ 链上 MON 支付（Monad 原生代币）
- ✅ 智能合约托管
- ✅ 自动切换到 Monad 网络
- ✅ 双重支付确认（事件监听 + 状态轮询）

📖 **详细说明**：[钱包配置文档](./docs/WALLET_CONFIG.md)

---

### 模式对比

| 特性 | DEMO 模式 | 真实支付模式 |
|------|----------|-------------|
| **配置难度** | 🟢 零配置 | 🟡 需配置钱包 |
| **演示速度** | ⚡ 5秒完成 | 🐌 用户实际支付 |
| **区块链交互** | ❌ 无 | ✅ 有 |
| **语音播报** | ✅ 正常 | ✅ 正常 |
| **适用场景** | 演示、测试 | 生产环境 |

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
- **[DEMO 模式](./docs/DEMO_MODE.md)** - 🎬 5秒自动完成订单演示
- **[合约集成](./docs/CONTRACT_INTEGRATION.md)** - 智能合约集成指南
- **[订单轮询](./docs/ORDER_POLLING.md)** - 支付状态轮询机制
- **[自动切换网络](./docs/AUTO_SWITCH_NETWORK.md)** - 钱包自动切换 Monad 网络

## 🎯 快速演示

### 🎬 DEMO 模式（推荐）

**最快速的演示方式（5秒完成一笔订单）：**

1. **启动系统**
   ```bash
   cd backend && npm start
   cd frontend/merchant-mobile && npm run dev
   cd frontend/merchant-desktop && npm run dev
   ```

2. **注册并登录**
   - 手机端：http://localhost:5173
   - 电脑端：http://localhost:5174

3. **添加商品**
   - 登录后进入"商品管理"
   - 添加一个测试商品（如：可口可乐，¥0.01）

4. **创建订单并观察**
   ```
   手机端：扫码/输入商品ID
   ↓
   电脑端：显示订单和二维码
   ↓ (等待 5 秒)
   电脑端：🎉 支付成功！🔊 "收款到账 0.01 元"
   ```

**完整演示脚本**：查看 [DEMO 模式文档](./docs/DEMO_MODE.md)

---

### 💰 真实支付测试

如需测试真实的链上支付：
访问 http://localhost:5173，点击"立即注册"

#### 2. 配置 Web3 钱包

按照 [钱包配置文档](./docs/WALLET_CONFIG.md) 配置 WalletConnect

#### 3. 添加测试商品
登录后进入"商品管理"，添加商品

#### 4. 测试真实支付流程
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

系统使用的智能合约支持以下核心功能：

### 支付函数
```solidity
// 用户支付（MON 原生代币）
function pay(uint256 orderId, address token, uint256 amount) external payable
```

### 查询函数（用于状态轮询）
```solidity
// 检查订单是否已支付
function isOrderPaid(uint256 orderId) public view returns (bool)

// 获取支付详情
function getPayment(uint256 orderId) public view returns (PaymentInfo memory)
```

### 支付事件（用于实时监听）
```solidity
event PaymentMade(
  uint256 indexed orderId,
  address indexed payer,
  address indexed token,
  uint256 amount,
  uint256 timestamp
)
```

**支付确认双重机制：**
1. **事件监听（优先）**：实时监听 `PaymentMade` 事件，1-2秒内确认
2. **状态轮询（备用）**：每5秒调用 `isOrderPaid` 查询，确保可靠性

详细信息请参阅 [订单轮询文档](./docs/ORDER_POLLING.md) 和 [合约集成文档](./docs/CONTRACT_INTEGRATION.md)。

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
