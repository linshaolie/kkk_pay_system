# 🇨🇳 国内平台部署指南

## 🌟 推荐平台对比

| 平台 | 免费额度 | 部署难度 | 推荐度 | 说明 |
|------|---------|---------|--------|------|
| **Zeabur** | $5/月 | ⭐⭐⭐⭐⭐ | 🔥🔥🔥🔥🔥 | 最推荐，类似 Vercel |
| **Laf** | 充足 | ⭐⭐⭐⭐ | 🔥🔥🔥🔥 | 云函数平台，完全免费 |
| **Sealos** | 按量付费 | ⭐⭐⭐ | 🔥🔥🔥 | Kubernetes 云 |
| **腾讯云开发** | 免费套餐 | ⭐⭐⭐⭐ | 🔥🔥🔥 | 腾讯出品，稳定 |
| **阿里云函数计算** | 免费额度 | ⭐⭐ | 🔥🔥 | 需要实名认证 |

## 🚀 方案一：Zeabur 部署（推荐）

### 为什么选择 Zeabur？

- ✅ 国内访问速度快
- ✅ 操作简单，类似 Vercel
- ✅ 支持 Docker、Node.js
- ✅ 自动 HTTPS
- ✅ 中文文档和支持

### 快速开始

#### 1. 注册 Zeabur

访问：https://zeabur.com/
- 使用 GitHub 登录
- 选择区域：Hong Kong（最快）

#### 2. 部署后端

```bash
# 1. 创建项目
点击 "创建项目"

# 2. 添加服务
选择 "从 GitHub 部署"
选择 kkk_pos 仓库

# 3. 配置环境变量
PORT=3000
NODE_ENV=production
JWT_SECRET=your_secret_key
MONAD_RPC_URL=https://testnet-rpc.monad.xyz
CONTRACT_ADDRESS=0xba53E893Ba76B8971E913d2fB83970aC7CC7a25E

# 4. 等待部署完成
获取部署 URL
```

#### 3. 部署前端

前端可以部署到：
- Zeabur（推荐）
- Vercel（国内访问稍慢但更稳定）
- Cloudflare Pages（国内可访问）

### 费用说明

- **免费额度**：$5/月
- **超出后**：按量计费
- **小型项目**：免费额度足够

## 🔥 方案二：Laf 云开发（完全免费）

### 介绍

Laf 是国内开源的云开发平台，完全免费！

- ✅ 云函数 + 云数据库
- ✅ 完全免费（开源项目）
- ✅ 国内访问快
- ✅ WebSocket 支持

### 部署步骤

#### 1. 注册 Laf

访问：https://laf.dev/
- 微信扫码登录
- 创建应用

#### 2. 改造后端为云函数

需要将 Express 改为云函数形式（我可以帮您改造）

#### 3. 部署前端

前端依然部署到 Vercel 或 Zeabur

### 适合场景

- 预算有限
- 不介意改造代码
- 需要完全免费方案

## ☁️ 方案三：腾讯云开发

### 介绍

腾讯云的 Serverless 平台

- ✅ 免费额度充足
- ✅ 稳定可靠
- ✅ 完整的云服务
- ✅ 需要实名认证

### 免费额度

- 云函数：100万次调用/月
- 云数据库：2GB 存储
- CDN：10GB 流量

### 部署步骤

```bash
# 1. 安装 CloudBase CLI
npm install -g @cloudbase/cli

# 2. 登录
tcb login

# 3. 初始化
tcb init

# 4. 部署
tcb deploy
```

## 🐳 方案四：Sealos 云操作系统

### 介绍

基于 Kubernetes 的云平台

- ✅ 按量付费
- ✅ 价格透明
- ✅ 支持 Docker
- ✅ 国内访问快

访问：https://sealos.io/

### 费用

- CPU：¥0.067/核·小时
- 内存：¥0.033/GB·小时
- 估算：约 ¥30-50/月

## 📊 完整对比

### 前端部署

| 平台 | 免费 | 国内访问 | 推荐度 |
|------|------|---------|--------|
| **Zeabur** | $5/月 | ⭐⭐⭐⭐⭐ | 🔥🔥🔥🔥🔥 |
| **Vercel** | ✅ | ⭐⭐⭐⭐ | 🔥🔥🔥🔥 |
| **Cloudflare Pages** | ✅ | ⭐⭐⭐⭐⭐ | 🔥🔥🔥🔥 |
| **Netlify** | ✅ | ⭐⭐⭐ | 🔥🔥🔥 |

### 后端部署

| 平台 | 免费 | WebSocket | 推荐度 |
|------|------|-----------|--------|
| **Zeabur** | $5/月 | ✅ | 🔥🔥🔥🔥🔥 |
| **Laf** | ✅ | ✅ | 🔥🔥🔥🔥 |
| **Railway** | 500h | ✅ | 🔥🔥🔥🔥 |
| **Sealos** | 付费 | ✅ | 🔥🔥🔥 |

## 🎯 我的推荐

### 预算充足（推荐）

```
前端：Zeabur/Vercel
后端：Zeabur
费用：$5-10/月
```

### 完全免费

```
前端：Vercel/Cloudflare Pages
后端：Laf（需要改造）
费用：$0
```

### 最佳性能

```
前端：Zeabur
后端：Zeabur
数据库：MongoDB Atlas
费用：约 $10/月
```

## 🚀 推荐配置：Zeabur

最适合您的项目：

1. **易用性** - 和 Vercel 一样简单
2. **价格** - $5 免费额度足够测试
3. **速度** - 国内访问快
4. **功能** - 支持 WebSocket 和持续运行

### 开始使用

```bash
# 1. 访问 Zeabur
https://zeabur.com/

# 2. GitHub 登录

# 3. 创建项目 → 从 Git 部署

# 4. 配置环境变量

# 5. 部署完成！
```

## 📱 Cloudflare Pages 部署前端

作为补充，Cloudflare Pages 在国内访问也很快：

```bash
# 1. 访问 Cloudflare Pages
https://pages.cloudflare.com/

# 2. 连接 GitHub

# 3. 选择仓库

# 4. 配置构建
Build command: npm run build
Build output: dist

# 5. 环境变量
添加 .env.production 的内容

# 6. 部署
```

## 🔧 部署脚本

我可以为您创建 Zeabur 部署脚本，需要吗？

## 💡 建议

1. **开发阶段**：Vercel（前端）+ Zeabur（后端）
2. **测试阶段**：全部 Zeabur
3. **生产环境**：Zeabur + MongoDB Atlas

## 📞 需要帮助？

选择好平台后告诉我，我会：
1. 创建对应的配置文件
2. 提供详细的部署步骤
3. 帮助解决部署问题

您想用哪个平台？我帮您配置！
