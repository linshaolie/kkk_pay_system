# 🔐 本地 HTTPS 配置指南

本文档说明如何为 KKK POS 本地开发环境配置 HTTPS 支持。

## 📋 目录

- [为什么需要 HTTPS](#为什么需要-https)
- [方法一：使用 mkcert（推荐）](#方法一使用-mkcert推荐)
- [方法二：使用自签名证书](#方法二使用自签名证书)
- [方法三：使用 Caddy 反向代理](#方法三使用-caddy-反向代理)
- [故障排除](#故障排除)

## 🎯 为什么需要 HTTPS

在某些场景下，本地开发也需要 HTTPS：

1. **Web3 钱包连接** - 大多数钱包要求 HTTPS 连接
2. **PWA 功能** - Service Worker 和 PWA 需要 HTTPS
3. **摄像头/麦克风访问** - 现代浏览器要求 HTTPS
4. **Cookie Secure 标志** - 安全 Cookie 需要 HTTPS
5. **混合内容警告** - 避免 HTTP/HTTPS 混合内容问题

## 方法一：使用 mkcert（推荐）

`mkcert` 是一个简单的工具，可以生成本地信任的开发证书。

### 1. 安装 mkcert

**macOS:**
```bash
brew install mkcert
brew install nss  # 如果使用 Firefox
```

**Windows:**
```bash
# 使用 Chocolatey
choco install mkcert

# 或使用 Scoop
scoop bucket add extras
scoop install mkcert
```

**Linux:**
```bash
# Ubuntu/Debian
sudo apt install libnss3-tools
wget https://github.com/FiloSottile/mkcert/releases/download/v1.4.4/mkcert-v1.4.4-linux-amd64
chmod +x mkcert-v1.4.4-linux-amd64
sudo mv mkcert-v1.4.4-linux-amd64 /usr/local/bin/mkcert

# Arch Linux
sudo pacman -S mkcert
```

### 2. 安装本地证书颁发机构

```bash
# 安装本地 CA（只需运行一次）
mkcert -install
```

这会创建一个本地的证书颁发机构并将其添加到系统信任列表中。

### 3. 生成项目证书

在项目根目录运行：

```bash
# 创建证书目录
mkdir -p certs

# 进入证书目录
cd certs

# 获取你的本地 IP（macOS）
LOCAL_IP=$(ipconfig getifaddr en0)

# 生成证书（包括 localhost 和你的 IP）
mkcert localhost 127.0.0.1 $LOCAL_IP ::1

# 重命名文件（可选，使名称更统一）
# mkcert 会生成类似 localhost+3.pem 和 localhost+3-key.pem 的文件
```

生成的文件：
- `localhost+3.pem` - SSL 证书
- `localhost+3-key.pem` - 私钥

**注意：** 如果生成的文件名不同，请更新 `vite.config.js` 中的文件名。

### 4. 配置环境变量

在 `backend/.env` 中添加：

```env
# 启用 HTTPS
USE_HTTPS=true

# 更新所有 URL 为 https
MOBILE_URL=https://192.168.1.100:5173
DESKTOP_URL=https://192.168.1.100:5174
PAYMENT_URL=https://192.168.1.100:5176
```

在前端项目的 `.env` 文件中也更新为 `https`。

### 5. 启动服务

```bash
# 后端会自动使用 HTTPS（如果证书存在且 USE_HTTPS=true）
cd backend
npm run dev

# 前端也会自动检测证书并使用 HTTPS
cd frontend/merchant-mobile
npm run dev

cd frontend/merchant-desktop
npm run dev

cd frontend/user-payment
npm run dev
```

### 6. 访问服务

- Backend API: `https://192.168.1.100:3000`
- 商家手机端: `https://192.168.1.100:5173`
- 商家电脑端: `https://192.168.1.100:5174`
- 用户支付端: `https://192.168.1.100:5176`

### 7. 手机端信任证书

如果需要在手机上访问：

**iOS:**
1. 将 `rootCA.pem` 通过 AirDrop 或邮件发送到 iPhone
2. 打开文件，安装描述文件
3. 设置 > 通用 > 关于本机 > 证书信任设置
4. 启用刚安装的根证书

**Android:**
1. 将 `rootCA.pem` 复制到手机
2. 设置 > 安全 > 加密与凭据 > 从存储设备安装
3. 选择证书文件并安装

根证书位置：
```bash
# macOS/Linux
mkcert -CAROOT

# 显示根证书位置，可以找到 rootCA.pem
```

## 方法二：使用自签名证书

如果不想安装 mkcert，可以使用 OpenSSL 生成自签名证书（浏览器会显示警告）。

### 1. 生成自签名证书

```bash
# 创建证书目录
mkdir -p certs
cd certs

# 生成私钥
openssl genrsa -out localhost-key.pem 2048

# 生成证书签名请求
openssl req -new -key localhost-key.pem -out localhost.csr \
  -subj "/C=CN/ST=Beijing/L=Beijing/O=Dev/CN=localhost"

# 创建配置文件
cat > localhost.ext << EOF
authorityKeyIdentifier=keyid,issuer
basicConstraints=CA:FALSE
keyUsage = digitalSignature, nonRepudiation, keyEncipherment, dataEncipherment
subjectAltName = @alt_names

[alt_names]
DNS.1 = localhost
IP.1 = 127.0.0.1
IP.2 = 192.168.1.100
EOF

# 生成证书（有效期 365 天）
openssl x509 -req -in localhost.csr \
  -signkey localhost-key.pem \
  -out localhost.pem \
  -days 365 \
  -extfile localhost.ext
```

### 2. 更新配置

更新 `vite.config.js` 和后端配置以使用新的证书文件名：

- `localhost.pem` - 证书
- `localhost-key.pem` - 私钥

**注意：** 浏览器会显示不安全警告，需要手动点击"高级">"继续前往"。

## 方法三：使用 Caddy 反向代理

Caddy 可以自动处理 HTTPS 证书，非常适合本地开发。

### 1. 安装 Caddy

**macOS:**
```bash
brew install caddy
```

**Windows:**
```bash
choco install caddy
```

**Linux:**
```bash
sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt update
sudo apt install caddy
```

### 2. 创建 Caddyfile

在项目根目录创建 `Caddyfile`：

```caddy
# Backend API
https://localhost:3443 {
    reverse_proxy localhost:3000
    tls internal
}

# Merchant Mobile
https://localhost:5173 {
    reverse_proxy localhost:5173
    tls internal
}

# Merchant Desktop
https://localhost:5174 {
    reverse_proxy localhost:5174
    tls internal
}

# User Payment
https://localhost:5176 {
    reverse_proxy localhost:5176
    tls internal
}
```

### 3. 启动 Caddy

```bash
caddy run
```

### 4. 访问服务

- Backend API: `https://localhost:3443`
- 其他服务: `https://localhost:5173/5174/5176`

## 🔧 配置检查清单

使用 HTTPS 后，确保所有配置一致：

### Backend `.env`
```env
USE_HTTPS=true
MOBILE_URL=https://192.168.1.100:5173
DESKTOP_URL=https://192.168.1.100:5174
PAYMENT_URL=https://192.168.1.100:5176
```

### Frontend `.env` 文件

**merchant-mobile/.env:**
```env
VITE_API_URL=https://192.168.1.100:3000/api
VITE_SOCKET_URL=https://192.168.1.100:3000
```

**merchant-desktop/.env:**
```env
VITE_API_URL=https://192.168.1.100:3000/api
VITE_SOCKET_URL=https://192.168.1.100:3000
VITE_PAYMENT_URL=https://192.168.1.100:5176
```

**user-payment/.env:**
```env
VITE_API_URL=https://192.168.1.100:3000/api
VITE_MONAD_RPC_URL=https://testnet-rpc.monad.xyz
VITE_CONTRACT_ADDRESS=0xYourContractAddress
VITE_WALLET_CONNECT_PROJECT_ID=1fba176f84da8ad01ca69caa0074f292
```

## 🐛 故障排除

### 1. 证书未被信任

**问题：** 浏览器显示"您的连接不是私密连接"

**解决方案：**
```bash
# 重新安装 mkcert CA
mkcert -uninstall
mkcert -install

# 重新生成证书
cd certs
rm -f *.pem
mkcert localhost 127.0.0.1 $(ipconfig getifaddr en0) ::1
```

### 2. 证书文件名不匹配

**问题：** 启动时提示找不到证书

**解决方案：**
检查实际生成的文件名：
```bash
ls -la certs/
```

更新 `vite.config.js` 和 `backend/src/index.js` 中的文件名。

### 3. 端口被占用

**问题：** HTTPS 端口 443 被占用

**解决方案：**
继续使用非标准端口（如 3000, 5173 等），HTTPS 不一定要用 443 端口。

### 4. Mixed Content 错误

**问题：** HTTPS 页面无法加载 HTTP 资源

**解决方案：**
确保所有资源都使用 HTTPS：
- API 请求
- WebSocket 连接（使用 `wss://` 而不是 `ws://`）
- 图片和其他资源

### 5. Socket.IO 连接失败

**问题：** 使用 HTTPS 后 Socket.IO 无法连接

**解决方案：**
确保 Socket.IO URL 使用 `https://`：
```javascript
const socket = io('https://192.168.1.100:3000');
```

### 6. 手机无法访问

**问题：** 手机访问显示证书错误

**解决方案：**
- 确保证书包含了你的 IP 地址
- 在手机上安装根证书（见上面的说明）
- 或者在浏览器中手动接受证书

## 📱 移动设备配置

### iOS Safari

1. **安装根证书:**
   - 找到根证书：`mkcert -CAROOT`
   - 发送 `rootCA.pem` 到 iPhone
   - 安装描述文件

2. **信任证书:**
   - 设置 > 通用 > 关于本机 > 证书信任设置
   - 启用根证书

### Android Chrome

1. **安装证书:**
   - 设置 > 安全 > 加密与凭据 > 从存储设备安装
   - 选择 `rootCA.pem`

2. **某些设备可能需要设置屏幕锁**

## 🔄 HTTP 和 HTTPS 切换

如果想在 HTTP 和 HTTPS 之间切换：

### 切换到 HTTPS
```bash
# 后端 .env
USE_HTTPS=true

# 更新所有 URL 为 https://
```

### 切换回 HTTP
```bash
# 后端 .env
USE_HTTPS=false

# 更新所有 URL 为 http://
```

前端会自动检测证书是否存在，如果不存在会回退到 HTTP。

## 📚 参考资源

- [mkcert GitHub](https://github.com/FiloSottile/mkcert)
- [Vite HTTPS 配置](https://vitejs.dev/config/server-options.html#server-https)
- [Node.js HTTPS 文档](https://nodejs.org/api/https.html)
- [Caddy 文档](https://caddyserver.com/docs/)

## 💡 最佳实践

1. **开发环境：** 使用 mkcert，简单且浏览器信任
2. **团队共享：** 提交生成脚本，不要提交证书文件
3. **生产环境：** 使用 Let's Encrypt 或云服务商的证书
4. **证书管理：** 添加 `certs/` 到 `.gitignore`

## 🔒 安全提示

1. **永远不要提交私钥到 Git**
2. **证书只用于本地开发**
3. **定期更新证书（mkcert 生成的证书有效期默认 2.5 年）**
4. **生产环境使用正式证书**

## ✅ 验证 HTTPS 配置

```bash
# 测试后端 HTTPS
curl -k https://localhost:3000/health

# 测试前端 HTTPS
curl -k https://localhost:5173

# 查看证书信息
openssl s_client -connect localhost:3000 -showcerts
```

---

如有问题，请查看故障排除部分或提交 Issue。
