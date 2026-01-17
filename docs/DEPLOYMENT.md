# KKK POS 部署指南

本文档提供详细的部署步骤，帮助您快速搭建和运行 KKK POS 系统。

## 📋 系统要求

- **Node.js**: >= 18.0.0
- **MySQL**: >= 8.0
- **npm** 或 **yarn**
- **操作系统**: macOS, Linux, Windows

## 🚀 快速开始

### 1. 克隆项目（如果从 Git 获取）

```bash
cd kkk_pos
```

### 2. 安装 MySQL

#### macOS (使用 Homebrew)
```bash
brew install mysql
brew services start mysql
```

#### Ubuntu/Debian
```bash
sudo apt update
sudo apt install mysql-server
sudo systemctl start mysql
```

#### Windows
下载并安装 [MySQL Community Server](https://dev.mysql.com/downloads/mysql/)

### 3. 创建数据库

```bash
mysql -u root -p
```

在 MySQL 命令行中执行：

```sql
CREATE DATABASE kkk_pos CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'kkk_user'@'localhost' IDENTIFIED BY 'your_secure_password';
GRANT ALL PRIVILEGES ON kkk_pos.* TO 'kkk_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### 4. 配置后端

```bash
cd backend

# 安装依赖
npm install

# 复制环境变量文件
cp env.example .env

# 编辑 .env 文件，填入您的配置
nano .env
```

#### .env 配置说明

```env
# 服务器配置
PORT=3000
NODE_ENV=development

# 数据库配置
DB_HOST=localhost
DB_PORT=3306
DB_USER=kkk_user
DB_PASSWORD=your_secure_password
DB_NAME=kkk_pos

# JWT 密钥（生成一个强密钥）
JWT_SECRET=生成一个随机的长字符串作为密钥

# Monad 区块链配置
MONAD_RPC_URL=https://your-monad-rpc-url
CONTRACT_ADDRESS=0xba53E893Ba76B8971E913d2fB83970aC7CC7a25E
USDT_CONTRACT_ADDRESS=0xDA658fD4Bb122ff322eDb3E8fEA343Ba5f3049E2

# 前端地址
MOBILE_URL=http://localhost:5173
DESKTOP_URL=http://localhost:5174
PAYMENT_URL=http://localhost:5176
```

#### 初始化数据库表

```bash
npm run migrate
```

成功后会看到：
```
✓ 商家表创建成功
✓ 商品表创建成功
✓ 订单表创建成功
✅ 所有数据库表创建完成！
```

### 5. 配置前端项目

#### 商家手机端

```bash
cd frontend/merchant-mobile
npm install

# 创建 .env 文件
echo "VITE_API_URL=http://localhost:3000/api" > .env
echo "VITE_SOCKET_URL=http://localhost:3000" >> .env
```

#### 商家电脑端

```bash
cd ../merchant-desktop
npm install

# 创建 .env 文件
echo "VITE_API_URL=http://localhost:3000/api" > .env
echo "VITE_SOCKET_URL=http://localhost:3000" >> .env
echo "VITE_PAYMENT_URL=http://localhost:5176" >> .env
```

#### 用户支付端

```bash
cd ../user-payment
npm install

# 创建 .env 文件
cat > .env << EOF
VITE_API_URL=http://localhost:3000/api
VITE_MONAD_RPC_URL=https://your-monad-rpc-url
VITE_CONTRACT_ADDRESS=0xYourPaymentContractAddress
VITE_USDT_ADDRESS=0xYourUSDTContractAddress
VITE_WALLET_CONNECT_PROJECT_ID=your_walletconnect_project_id
EOF
```

> 💡 获取 WalletConnect Project ID: 访问 https://cloud.walletconnect.com/ 注册并创建项目

### 6. 启动服务

建议使用多个终端窗口分别启动各个服务：

#### 终端 1: 启动后端
```bash
cd backend
npm run dev
```

看到以下输出表示成功：
```
╔═══════════════════════════════════════╗
║   KKK POS Backend Server Started     ║
╠═══════════════════════════════════════╣
║  Port: 3000
║  Environment: development
║  Database: kkk_pos
╚═══════════════════════════════════════╝
```

#### 终端 2: 启动商家手机端
```bash
cd frontend/merchant-mobile
npm run dev
```

#### 终端 3: 启动商家电脑端
```bash
cd frontend/merchant-desktop
npm run dev
```

#### 终端 4: 启动用户支付端
```bash
cd frontend/user-payment
npm run dev
```

### 7. 访问应用

- **商家手机端**: http://localhost:5173
- **商家电脑端**: http://localhost:5174
- **用户支付端**: http://localhost:5176
- **后端 API**: http://localhost:3000

## 📱 首次使用

### 1. 注册商家账号

1. 打开商家手机端: http://localhost:5173
2. 点击"立即注册"
3. 填写信息：
   - 用户名（至少3个字符）
   - 密码（至少6个字符）
   - 店铺名称
   - 手机号（可选）
   - 钱包地址（可选，用于接收支付）
4. 点击"注册"

### 2. 添加商品

1. 登录后在手机端首页点击"商品管理"
2. 点击"添加商品"
3. 填写商品信息：
   - 商品ID（条码号）
   - 商品名称
   - 进货价
   - 售价
   - 描述（可选）
4. 保存

### 3. 登录电脑端

1. 打开商家电脑端: http://localhost:5174
2. 使用相同的账号密码登录
3. 系统会显示收银台界面

### 4. 测试支付流程

1. **手机端扫码**：
   - 点击"扫码收款"
   - 扫描商品条码（或手动输入商品ID）
   
2. **电脑端显示**：
   - 订单信息自动同步到电脑端
   - 显示支付二维码
   
3. **用户支付**：
   - 用手机扫描电脑端的二维码
   - 连接 Web3 钱包
   - 确认并支付
   
4. **支付完成**：
   - 电脑端自动播报"收款到账 XXX"
   - 订单状态更新为已完成

## 🔧 生产环境部署

### 使用 PM2 管理后端进程

```bash
# 安装 PM2
npm install -g pm2

# 启动后端
cd backend
pm2 start src/index.js --name "kkk-pos-backend"

# 查看日志
pm2 logs kkk-pos-backend

# 设置开机自启
pm2 startup
pm2 save
```

### 使用 Nginx 作为反向代理

创建 Nginx 配置文件 `/etc/nginx/sites-available/kkk-pos`:

```nginx
# 后端 API
server {
    listen 80;
    server_name api.your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

# 商家手机端
server {
    listen 80;
    server_name mobile.your-domain.com;
    root /path/to/kkk_pos/frontend/merchant-mobile/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}

# 商家电脑端
server {
    listen 80;
    server_name desktop.your-domain.com;
    root /path/to/kkk_pos/frontend/merchant-desktop/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}

# 用户支付端
server {
    listen 80;
    server_name pay.your-domain.com;
    root /path/to/kkk_pos/frontend/user-payment/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

构建前端项目：

```bash
# 商家手机端
cd frontend/merchant-mobile
npm run build

# 商家电脑端
cd ../merchant-desktop
npm run build

# 用户支付端
cd ../user-payment
npm run build
```

启用配置：

```bash
sudo ln -s /etc/nginx/sites-available/kkk-pos /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## 🐛 故障排除

### 后端无法启动

1. 检查 MySQL 是否运行：
   ```bash
   mysql -u root -p -e "SELECT 1"
   ```

2. 检查端口是否被占用：
   ```bash
   lsof -i :3000
   ```

3. 查看日志：
   ```bash
   cd backend
   npm run dev
   ```

### 前端无法连接后端

1. 检查 `.env` 文件中的 API 地址是否正确
2. 检查后端是否正常运行
3. 检查浏览器控制台的网络请求

### 语音播报不工作

1. 确保浏览器支持 Web Speech API
2. 检查浏览器是否允许自动播放音频
3. 在浏览器设置中允许网站播放声音

### 钱包连接失败

1. 确保已配置正确的 WalletConnect Project ID
2. 检查 Monad RPC URL 是否正确
3. 确保钱包已切换到 Monad 网络

## 📞 技术支持

如遇到问题，请检查：
1. Node.js 和 MySQL 版本是否符合要求
2. 所有依赖是否正确安装
3. 环境变量配置是否正确
4. 防火墙是否阻止了端口访问

## 🔐 安全建议

1. **生产环境必须**：
   - 修改所有默认密码
   - 使用强 JWT 密钥
   - 启用 HTTPS
   - 配置数据库访问权限
   - 定期备份数据库

2. **智能合约**：
   - 确保合约已经过审计
   - 测试网充分测试后再部署主网
   - 保管好私钥和助记词

3. **API 安全**：
   - 配置 CORS 仅允许信任的域名
   - 实施 API 速率限制
   - 记录和监控异常请求
