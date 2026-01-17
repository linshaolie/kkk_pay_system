# 🚀 Zeabur 部署实战指南

## 📱 第一步：访问 Zeabur 并创建项目

### 1.1 登录 Zeabur

1. 打开浏览器，访问：**https://zeabur.com**
2. 点击右上角 **"Sign In"**（登录）
3. 选择 **"Continue with GitHub"**（使用 GitHub 登录）
4. 授权 Zeabur 访问您的 GitHub 账号

### 1.2 创建新项目

1. 登录后，点击 **"New Project"**（新建项目）
2. 输入项目名称：`web3-pos-system`（或您喜欢的名称）
3. 选择地区：**Hong Kong** 或 **Tokyo**（推荐，国内访问快）
4. 点击 **"Create"**（创建）

---

## 🖥️ 第二步：部署后端服务

### 2.1 添加后端服务

1. 在项目页面，点击 **"Add Service"**（添加服务）
2. 选择 **"GitHub"**
3. 找到并选择您的仓库：`linshaolie/kkk_pay_system`
4. Zeabur 会自动扫描仓库

### 2.2 配置后端服务

**重要：指定服务根目录**

由于这是一个 monorepo（多项目仓库），需要告诉 Zeabur 后端代码的位置：

1. 在服务设置中找到 **"Root Directory"**（根目录）
2. 输入：`backend`
3. Zeabur 会自动检测到 Node.js 项目

### 2.3 配置环境变量

点击服务页面的 **"Variables"**（环境变量）标签，添加以下变量：

```bash
NODE_ENV=production
PORT=3000
JWT_SECRET=your-generated-secret-key-here
MONAD_RPC_URL=https://testnet.monad.xyz
CONTRACT_ADDRESS=0xba53e893ba76b8971e913d2fb83970ac7cc7a25e
```

**注意事项：**
- `CORS_ORIGINS` 和 `PAYMENT_URL` 现在先不填（部署前端后再更新）
- 请替换实际的 Monad RPC URL 和合约地址

### 2.4 配置持久化存储（重要！）

这是最关键的一步，确保数据不会丢失：

1. 在后端服务页面，找到 **"Volumes"**（存储卷）或 **"Storage"**
2. 点击 **"Add Volume"** 或 **"Create Volume"**
3. 配置：
   - **Mount Path**: `/app/backend/data`
   - **Size**: `1 GB`
4. 保存配置

### 2.5 部署并获取域名

1. 点击 **"Deploy"**（部署）
2. 等待构建完成（通常 2-5 分钟）
3. 部署成功后，找到 **"Domains"**（域名）标签
4. 点击 **"Generate Domain"**（生成域名）
5. 复制生成的域名，例如：`backend-abc123.zeabur.app`

**测试后端是否正常：**
```bash
curl https://backend-abc123.zeabur.app/health
```

应该返回：`{"status":"ok","timestamp":"..."}`

---

## 📱 第三步：部署前端服务

### 3.1 部署商家移动端

1. 在同一项目中，点击 **"Add Service"**
2. 选择 **"GitHub"** → `linshaolie/kkk_pay_system`
3. 配置：
   - **Service Name**: `merchant-mobile`
   - **Root Directory**: `frontend/merchant-mobile`
4. 环境变量：
   ```bash
   VITE_API_BASE_URL=https://backend-abc123.zeabur.app
   ```
   （替换为您的后端域名）
5. 部署并生成域名，记录下来：`merchant-mobile-xyz.zeabur.app`

### 3.2 部署商家桌面端

1. 再次点击 **"Add Service"**
2. 选择同一仓库
3. 配置：
   - **Service Name**: `merchant-desktop`
   - **Root Directory**: `frontend/merchant-desktop`
4. 环境变量：
   ```bash
   VITE_API_BASE_URL=https://backend-abc123.zeabur.app
   ```
5. 部署并生成域名，记录下来：`merchant-desktop-xyz.zeabur.app`

### 3.3 部署用户支付页

1. 再次点击 **"Add Service"**
2. 选择同一仓库
3. 配置：
   - **Service Name**: `user-payment`
   - **Root Directory**: `frontend/user-payment`
4. 环境变量：
   ```bash
   VITE_API_BASE_URL=https://backend-abc123.zeabur.app
   VITE_WALLETCONNECT_PROJECT_ID=1fba176f84da8ad01ca69caa0074f292
   VITE_MONAD_RPC_URL=https://testnet.monad.xyz
   VITE_CONTRACT_ADDRESS=0xba53e893ba76b8971e913d2fb83970ac7cc7a25e
   ```
5. 部署并生成域名，记录下来：`payment-xyz.zeabur.app`

---

## 🔄 第四步：更新后端环境变量

现在所有服务都部署完成，需要更新后端的 CORS 配置：

### 4.1 返回后端服务

1. 在 Zeabur 项目页面，点击 **后端服务**
2. 进入 **"Variables"**（环境变量）

### 4.2 添加/更新变量

添加以下两个环境变量（使用您实际获得的域名）：

```bash
CORS_ORIGINS=https://merchant-mobile-xyz.zeabur.app,https://merchant-desktop-xyz.zeabur.app,https://payment-xyz.zeabur.app

PAYMENT_URL=https://payment-xyz.zeabur.app/pay
```

**注意：**
- 域名之间用逗号分隔，**不要有空格**
- 必须使用 `https://` 协议
- PAYMENT_URL 末尾要加 `/pay`

### 4.3 重启服务

保存环境变量后，后端服务会自动重启（约 1-2 分钟）

---

## ✅ 第五步：测试部署

### 5.1 测试后端 API

```bash
curl https://backend-abc123.zeabur.app/health
```

### 5.2 测试商家移动端

1. 浏览器访问：`https://merchant-mobile-xyz.zeabur.app`
2. 点击 **"立即注册"**
3. 注册一个商家账号

### 5.3 测试商家桌面端

1. 浏览器访问：`https://merchant-desktop-xyz.zeabur.app`
2. 使用刚注册的账号登录
3. 尝试添加商品

### 5.4 测试完整支付流程

1. **商家移动端**：扫描商品（或手动输入商品 ID）
2. **商家桌面端**：查看订单和二维码
3. **用户支付页**：
   - 扫描二维码或访问链接
   - 查看订单详情
   - 连接钱包（需要支持 Monad 的钱包）

---

## 🎯 第六步：创建管理员账号

### 方法 1：通过注册页面

直接在商家移动端注册账号（最简单）

### 方法 2：通过 Zeabur 控制台

1. 进入后端服务页面
2. 点击 **"Console"**（控制台）或 **"Logs"**（日志）
3. 如果有 **"Terminal"** 选项，可以直接执行命令
4. 运行：
   ```bash
   cd /app/backend
   node -e "
   const bcrypt = require('bcryptjs');
   const fs = require('fs');
   const merchants = JSON.parse(fs.readFileSync('/app/backend/data/merchants.json'));
   merchants.push({
     id: 1,
     username: 'admin',
     password: bcrypt.hashSync('admin123', 10),
     phone: '13800138000',
     created_at: new Date().toISOString()
   });
   fs.writeFileSync('/app/backend/data/merchants.json', JSON.stringify(merchants, null, 2));
   console.log('Admin created!');
   "
   ```

---

## 📊 部署完成检查清单

- [ ] 后端服务运行正常（health check 返回 ok）
- [ ] 后端配置了 Volume 持久化存储
- [ ] 三个前端服务都部署成功
- [ ] 后端 CORS_ORIGINS 包含所有前端域名
- [ ] 后端 PAYMENT_URL 指向正确的支付页面
- [ ] 能够注册/登录商家账号
- [ ] 能够添加商品
- [ ] 能够创建订单并生成二维码
- [ ] 支付页面能够连接钱包

---

## 🎉 成功！

您的 Web3 离线购物系统已成功部署到 Zeabur！

### 访问地址

| 服务 | 地址 |
|------|------|
| 商家移动端 | https://merchant-mobile-xyz.zeabur.app |
| 商家桌面端 | https://merchant-desktop-xyz.zeabur.app |
| 用户支付页 | https://payment-xyz.zeabur.app |
| 后端 API | https://backend-abc123.zeabur.app |

---

## 🔧 常见问题

### 问题 1：前端无法连接后端

**检查：**
1. 前端的 `VITE_API_BASE_URL` 是否正确
2. 后端的 `CORS_ORIGINS` 是否包含前端域名
3. 后端服务是否正在运行

### 问题 2：数据重启后丢失

**检查：**
- 后端是否配置了 Volume
- Mount Path 是否为 `/app/backend/data`

### 问题 3：无法连接钱包

**检查：**
1. `VITE_WALLETCONNECT_PROJECT_ID` 是否正确
2. `VITE_MONAD_RPC_URL` 是否可访问
3. 浏览器控制台是否有错误信息

### 问题 4：语音播报不工作

**解决：**
- 浏览器需要允许自动播放音频
- 用户需要先与页面有过交互

---

## 📞 需要帮助？

如果遇到问题，请检查：
1. Zeabur 服务日志（Logs 标签）
2. 浏览器开发者工具控制台
3. 网络请求是否成功

祝您使用愉快！🎊
