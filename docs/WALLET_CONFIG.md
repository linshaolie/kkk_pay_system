# 🔗 钱包支付配置指南

本文档将指导您如何配置 Web3 钱包支付功能。

## 📋 配置步骤

### 1. 获取 WalletConnect Project ID

WalletConnect 是连接各种钱包（MetaMask、Trust Wallet 等）的标准协议。

**步骤：**

1. 访问 https://cloud.walletconnect.com/
2. 注册账号（如果还没有）
3. 点击 "Create New Project"
4. 填写项目信息：
   - Project Name: `KKK POS`
   - Project Description: `Web3 POS Payment System`
5. 创建后，复制 **Project ID**（类似：`a1b2c3d4e5f6...`）

### 2. 获取 Monad 网络信息

您需要以下信息：

- **RPC URL**：Monad 节点地址
- **Chain ID**：链 ID
- **支付合约地址**：您部署的支付合约
- **USDT 合约地址**：Monad 上的 USDT 代币合约

**示例配置（测试网）：**
```
RPC URL: https://testnet-rpc.monad.xyz
Chain ID: 41454
Contract Address: 0xYourContractAddress
USDT Address: 0xYourUSDTAddress
```

> 注意：请替换为实际的地址

### 3. 创建配置文件

在 `frontend/user-payment/` 目录下创建 `.env` 文件：

```bash
cd frontend/user-payment
cp .env.example .env
```

编辑 `.env` 文件，填入实际配置：

```env
# API 地址（本地开发）
VITE_API_URL=http://localhost:3000/api

# Monad 链配置
VITE_MONAD_RPC_URL=https://testnet-rpc.monad.xyz
VITE_CONTRACT_ADDRESS=0xYourPaymentContractAddress
VITE_USDT_ADDRESS=0xYourUSDTContractAddress

# WalletConnect Project ID
VITE_WALLET_CONNECT_PROJECT_ID=a1b2c3d4e5f6g7h8i9j0
```

### 4. 重启前端服务

配置完成后，重启用户支付端：

```bash
cd frontend/user-payment
npm run dev
```

## ✅ 验证配置

### 测试 1：访问首页

访问 http://localhost:5175

**期望结果：**
- ✅ 看到 "Web3 钱包支付已启用" 提示（绿色）
- ❌ 看到 "测试模式：未配置 Web3 钱包" 提示（黄色）→ 配置未生效

### 测试 2：访问支付页面

访问任意订单支付页面：http://localhost:5175/pay/xxx

**期望结果：**
- ✅ 显示 "连接钱包" 按钮
- ✅ 点击后弹出钱包选择界面

### 测试 3：连接钱包

1. 点击 "连接钱包"
2. 选择钱包（MetaMask/WalletConnect）
3. 确认连接
4. 看到 "已连接钱包" 状态

## 🔄 支付流程

完整配置后的支付流程：

```
1. 用户扫码打开支付页面
   ↓
2. 点击"连接钱包"
   ↓
3. 选择钱包并授权连接
   ↓
4. 系统检查 USDT 余额
   ↓
5. 如果未授权，先授权 USDT
   ↓
6. 点击"立即支付"
   ↓
7. 钱包弹出交易确认
   ↓
8. 用户确认交易
   ↓
9. 等待链上确认
   ↓
10. 支付成功！
```

## 🔧 智能合约要求

您的支付合约需要实现以下功能：

### 合约接口

```solidity
// 支付函数
function pay(bytes32 orderId) external;

// 事件
event PaymentCompleted(
    bytes32 indexed orderId,
    address indexed user,
    address indexed merchant,
    uint256 amount,
    uint256 timestamp
);
```

### USDT 合约

需要标准的 ERC20 接口：
- `balanceOf(address)` - 查询余额
- `approve(address, uint256)` - 授权额度
- `allowance(address, address)` - 查询授权

## 🐛 常见问题

### Q1: 页面显示"测试模式"，配置未生效？

**解决方案：**
1. 检查 `.env` 文件位置（应该在 `frontend/user-payment/` 目录下）
2. 检查文件名（`.env` 不是 `env.txt`）
3. 确保 `VITE_WALLET_CONNECT_PROJECT_ID` 不是示例值
4. 重启开发服务器（npm run dev）

### Q2: 连接钱包失败？

**解决方案：**
1. 检查 WalletConnect Project ID 是否正确
2. 检查网络连接
3. 尝试其他钱包
4. 查看浏览器控制台错误信息

### Q3: 钱包连接成功，但无法支付？

**解决方案：**
1. 检查钱包是否切换到 Monad 网络
2. 检查 USDT 余额是否足够
3. 检查合约地址是否正确
4. 查看钱包中的错误提示

### Q4: 如何添加 Monad 网络到钱包？

**MetaMask 添加网络：**
1. 打开 MetaMask
2. 点击网络下拉菜单
3. 点击"添加网络"
4. 填写信息：
   - 网络名称：Monad Testnet
   - RPC URL：https://testnet-rpc.monad.xyz
   - Chain ID：41454
   - 货币符号：MONAD
   - 区块浏览器：https://testnet.monad.xyz

### Q5: 测试支付但没有测试币？

**获取测试币：**
1. 加入 Monad Discord/Telegram
2. 使用测试网水龙头
3. 或联系项目方获取测试 USDT

## 📝 开发建议

### 测试环境配置

建议先在测试网完整测试：

```env
# 测试网配置
VITE_MONAD_RPC_URL=https://testnet-rpc.monad.xyz
VITE_CONTRACT_ADDRESS=0xTestContractAddress
VITE_USDT_ADDRESS=0xTestUSDTAddress
```

### 生产环境配置

确认无误后切换到主网：

```env
# 主网配置
VITE_MONAD_RPC_URL=https://mainnet-rpc.monad.xyz
VITE_CONTRACT_ADDRESS=0xMainnetContractAddress
VITE_USDT_ADDRESS=0xMainnetUSDTAddress
```

## 🔒 安全提醒

1. **私钥安全**：永远不要在代码中硬编码私钥
2. **合约审计**：生产环境前务必审计智能合约
3. **金额验证**：前后端都要验证支付金额
4. **环境隔离**：测试网和主网严格分离

## 📞 需要帮助？

如果遇到问题：
1. 查看浏览器控制台（F12）
2. 查看后端日志
3. 检查钱包交互日志
4. 参考 Monad 官方文档
