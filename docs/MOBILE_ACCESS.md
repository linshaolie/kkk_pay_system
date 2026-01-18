# 📱 手机访问本地服务指南

本文档说明如何让手机访问部署在本地电脑上的 KKK POS 服务。

## 🎯 前提条件

- 手机和电脑在**同一个 WiFi 网络**下
- 电脑防火墙允许相关端口访问

## 🚀 快速配置

### 方法一：自动配置（推荐）

运行自动配置脚本：

```bash
# 给脚本执行权限
chmod +x scripts/*.sh

# 查看 IP 和配置说明
./scripts/get-ip.sh

# 自动生成所有配置文件
./scripts/setup-mobile-access.sh
```

### 方法二：手动配置

#### 1. 获取电脑 IP 地址

**macOS:**
```bash
ipconfig getifaddr en0
# 或者
ifconfig | grep "inet " | grep -v 127.0.0.1
```

**Windows:**
```bash
ipconfig
# 查找 "IPv4 Address"
```

**Linux:**
```bash
hostname -I
```

假设您的 IP 是：`192.168.1.100`

#### 2. 配置前端项目

**商家手机端** (`frontend/merchant-mobile/.env`):
```env
VITE_API_URL=http://192.168.1.100:3000/api
VITE_SOCKET_URL=http://192.168.1.100:3000
```

**商家电脑端** (`frontend/merchant-desktop/.env`):
```env
VITE_API_URL=http://192.168.1.100:3000/api
VITE_SOCKET_URL=http://192.168.1.100:3000
VITE_PAYMENT_URL=http://192.168.1.100:5175
```

**用户支付端** (`frontend/user-payment/.env`):
```env
VITE_API_URL=http://192.168.1.100:3000/api
VITE_MONAD_RPC_URL=https://testnet-rpc.monad.xyz
VITE_CONTRACT_ADDRESS=0xYourPaymentContractAddress
VITE_WALLET_CONNECT_PROJECT_ID=1fba176f84da8ad01ca69caa0074f292
```

#### 3. 配置后端

**后端** (`backend/.env`):
```env
PORT=3000
NODE_ENV=development
JWT_SECRET=your_secret_key

MONAD_RPC_URL=https://testnet-rpc.monad.xyz
CONTRACT_ADDRESS=

MOBILE_URL=http://192.168.1.100:5173
DESKTOP_URL=http://192.168.1.100:5174
PAYMENT_URL=http://192.168.1.100:5175
```

#### 4. 修改 Vite 配置

所有前端项目的 `vite.config.js` 都需要添加 `host: '0.0.0.0'`：

**frontend/merchant-mobile/vite.config.js:**
```javascript
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',  // 添加这行
    port: 5173,
  },
})
```

**frontend/merchant-desktop/vite.config.js:**
```javascript
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',  // 添加这行
    port: 5174,
  },
})
```

**frontend/user-payment/vite.config.js:**
```javascript
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',  // 添加这行
    port: 5175,
  },
})
```

## 🔥 启动服务

配置完成后，按顺序启动：

```bash
# 终端 1: 后端
cd backend
npm run dev

# 终端 2: 商家手机端
cd frontend/merchant-mobile
npm run dev -- --host 0.0.0.0

# 终端 3: 商家电脑端
cd frontend/merchant-desktop
npm run dev -- --host 0.0.0.0

# 终端 4: 用户支付端
cd frontend/user-payment
npm run dev -- --host 0.0.0.0
```

## 📱 手机访问

配置完成后，在手机浏览器中访问：

- **商家手机端**: `http://192.168.1.100:5173`
- **用户支付端**: `http://192.168.1.100:5175`

## 🛡️ 防火墙配置

### macOS

如果无法访问，需要允许端口：

```bash
# 查看防火墙状态
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --getglobalstate

# 允许 Node 通过防火墙
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --add /usr/local/bin/node
```

或者在系统偏好设置中：
1. 打开 "安全性与隐私"
2. 点击 "防火墙" 标签
3. 点击锁图标解锁
4. 点击 "防火墙选项"
5. 允许 Node.js 和 Terminal 的连接

### Windows

1. 打开 "Windows Defender 防火墙"
2. 点击 "高级设置"
3. 点击 "入站规则" > "新建规则"
4. 选择 "端口"
5. 添加端口：3000, 5173, 5174, 5175
6. 允许连接

### Linux

```bash
# UFW 防火墙
sudo ufw allow 3000
sudo ufw allow 5173
sudo ufw allow 5174
sudo ufw allow 5175

# iptables
sudo iptables -A INPUT -p tcp --dport 3000 -j ACCEPT
sudo iptables -A INPUT -p tcp --dport 5173 -j ACCEPT
sudo iptables -A INPUT -p tcp --dport 5174 -j ACCEPT
sudo iptables -A INPUT -p tcp --dport 5175 -j ACCEPT
```

## 🐛 故障排除

### 1. 无法访问服务

**检查清单：**
- [ ] 手机和电脑在同一 WiFi
- [ ] IP 地址正确（不要用 localhost 或 127.0.0.1）
- [ ] 服务已启动（检查终端输出）
- [ ] 防火墙已配置
- [ ] 端口没有被占用

**测试连接：**
```bash
# 在手机浏览器访问
http://你的IP:3000/health

# 应该看到：
{"status":"ok","timestamp":"..."}
```

### 2. 手机能访问后端，但前端无法连接后端

检查前端 `.env` 文件中的 API 地址是否正确。

### 3. CORS 错误

后端已配置 CORS，如果还有问题，检查 `backend/src/index.js` 中的 CORS 配置。

### 4. WebSocket 连接失败

确保 Socket.IO 的 URL 配置正确：
```env
VITE_SOCKET_URL=http://你的IP:3000
```

## 📲 测试完整流程

1. **电脑端打开收银台**
   - 访问：`http://192.168.1.100:5174`
   - 登录账号

2. **手机端扫码**
   - 访问：`http://192.168.1.100:5173`
   - 登录同一账号
   - 扫码创建订单

3. **查看同步**
   - 电脑端应该实时显示订单

4. **手机扫码支付**
   - 扫描电脑端的二维码
   - 访问支付页面
   - 连接钱包支付

## 🌐 方法二：使用 ngrok（公网访问）

如果手机不在同一网络，可以使用 ngrok：

```bash
# 安装 ngrok
brew install ngrok  # macOS
# 或访问 https://ngrok.com/download

# 启动后端隧道
ngrok http 3000

# 启动前端隧道（需要多个终端）
ngrok http 5173
ngrok http 5174
ngrok http 5175
```

然后使用 ngrok 提供的公网 URL 更新配置。

## 💡 开发建议

1. **局域网测试** - 使用本地 IP，速度快，免费
2. **远程测试** - 使用 ngrok，可以让任何人访问
3. **生产环境** - 部署到云服务器

## 📞 需要帮助？

如果遇到问题：
1. 检查上面的故障排除清单
2. 查看终端错误信息
3. 检查浏览器控制台（F12）
4. 确认网络配置
