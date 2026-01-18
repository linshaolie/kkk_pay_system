# KKK POS 快速开始指南

一个基于 Web3 的线下支付 POS 系统，**无需数据库，使用 JSON 文件存储**，开箱即用！

## ⚡ 超简单部署（3步启动）

### 第 1 步：安装依赖

```bash
# 安装后端依赖
cd backend
npm install

# 安装前端依赖
cd ../frontend/merchant-mobile && npm install
cd ../merchant-desktop && npm install
cd ../user-payment && npm install
```

### 第 2 步：初始化数据

```bash
cd backend

# 复制环境变量配置
cp env.example .env

# 初始化 JSON 数据文件
npm run init
```

### 第 3 步：启动服务

打开 4 个终端窗口：

```bash
# 终端 1: 启动后端
cd backend
npm run dev

# 终端 2: 启动商家手机端
cd frontend/merchant-mobile
npm run dev

# 终端 3: 启动商家电脑端
cd frontend/merchant-desktop
npm run dev

# 终端 4: 启动用户支付端
cd frontend/user-payment
npm run dev
```

✅ **完成！** 现在访问：
- 商家手机端: http://localhost:5173
- 商家电脑端: http://localhost:5174
- 用户支付端: http://localhost:5175

## 🎯 首次使用

### 1. 注册商家账号

1. 打开 http://localhost:5173
2. 点击"立即注册"
3. 填写用户名、密码、店铺名称
4. 注册成功自动登录

### 2. 添加商品

1. 登录后点击"商品管理"
2. 添加商品（商品ID可以随便填，如：P001、P002）
3. 填写商品名称和价格

### 3. 测试收款流程

1. **手机端**：点击"扫码收款"，手动输入商品ID（如 P001）
2. **电脑端**：自动显示订单和支付二维码
3. **用户端**：手机扫码或直接访问支付链接
4. **完成**：连接钱包支付，电脑端自动播报

## 📁 数据存储说明

所有数据存储在 `backend/data/` 目录下的 JSON 文件中：

```
backend/data/
├── merchants.json    # 商家信息
├── products.json     # 商品信息
└── orders.json       # 订单信息
```

- ✅ 无需安装数据库
- ✅ 数据文件自动创建
- ✅ 可以直接编辑 JSON 文件
- ✅ 方便备份（复制整个 data 目录）

## 🔧 环境变量配置（可选）

编辑 `backend/.env` 文件：

```env
# 服务器端口
PORT=3000

# JWT 密钥（建议修改）
JWT_SECRET=your_random_secret_key

# 区块链配置（如果要使用支付功能）
MONAD_RPC_URL=https://your-monad-rpc-url
CONTRACT_ADDRESS=0xba53E893Ba76B8971E913d2fB83970aC7CC7a25E
USDT_CONTRACT_ADDRESS=0xDA658fD4Bb122ff322eDb3E8fEA343Ba5f3049E2
```

如果只是测试基本功能，可以不配置区块链相关内容。

## 📱 测试场景（无区块链）

即使不配置区块链，您也可以测试：

1. ✅ 商家注册/登录
2. ✅ 添加/管理商品
3. ✅ 手机端扫码创建订单
4. ✅ 电脑端实时显示订单
5. ✅ 生成支付二维码
6. ✅ 查看订单统计

## 🌐 配置区块链支付（可选）

如需完整的支付功能：

### 1. 获取 WalletConnect Project ID

访问 https://cloud.walletconnect.com/ 注册并创建项目

### 2. 配置后端

编辑 `backend/.env`：
```env
MONAD_RPC_URL=你的Monad节点URL
CONTRACT_ADDRESS=支付合约地址
USDT_CONTRACT_ADDRESS=USDT合约地址
```

### 3. 配置用户支付端

创建 `frontend/user-payment/.env`：
```env
VITE_API_URL=http://localhost:3000/api
VITE_MONAD_RPC_URL=你的Monad节点URL
VITE_CONTRACT_ADDRESS=支付合约地址
VITE_USDT_ADDRESS=USDT合约地址
VITE_WALLET_CONNECT_PROJECT_ID=你的WalletConnect项目ID
```

## 🎨 项目特点

- 🚀 **零配置启动**：无需安装配置数据库
- 💾 **JSON 存储**：数据直观可见，易于备份
- 📱 **三端分离**：手机扫码、电脑收银、用户支付
- 🔊 **语音播报**：支付完成自动播报金额
- ⚡ **实时同步**：Socket.IO 实现订单实时推送
- 🎯 **轻量简单**：适合快速测试和演示

## 🛠 常见问题

### Q: 数据会丢失吗？
A: 不会，数据保存在 `backend/data/` 目录的 JSON 文件中，服务器重启后数据依然存在。

### Q: 如何备份数据？
A: 直接复制 `backend/data/` 目录即可。

### Q: 如何清空数据重新开始？
A: 删除 `backend/data/` 目录，重新运行 `npm run init`。

### Q: 可以用于生产环境吗？
A: JSON 存储适合小规模使用和测试。如需生产环境，建议升级到 MySQL 或 PostgreSQL。

### Q: 端口被占用怎么办？
A: 修改对应的配置文件中的端口号：
- 后端: `backend/.env` 中的 `PORT`
- 前端: 各前端项目的 `vite.config.js`

## 📞 需要帮助？

- 查看完整文档：[README.md](./README.md)
- API 文档：[docs/API.md](./docs/API.md)
- 部署指南：[docs/DEPLOYMENT.md](./docs/DEPLOYMENT.md)

## 🎉 开始使用

现在您已经了解了基本使用方法，开始体验吧！

```bash
# 快速启动命令
cd backend && npm run dev
```

祝您使用愉快！ 🚀
