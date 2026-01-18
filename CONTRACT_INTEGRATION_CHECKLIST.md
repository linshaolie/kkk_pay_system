# 🚀 合约对接快速清单

## ✅ 已完成的工作

### 1. 代码调整 ✅
- [x] 更新合约 ABI（支持新的 Payment 合约）
- [x] 修改后端事件监听（PaymentMade 而不是 PaymentCompleted）
- [x] 调整订单ID类型（uint256 而不是 bytes32）
- [x] 更新前端支付逻辑（新的 pay 函数签名）
- [x] 优化错误处理（RPC 节点兼容性）

### 2. 文档创建 ✅
- [x] 合约对接配置指南（`docs/CONTRACT_INTEGRATION.md`）
- [x] Zeabur 部署指南（`docs/ZEABUR_DEPLOY_STEP_BY_STEP.md`）
- [x] 环境变量配置模板（`zeabur-env-config.txt`）

### 3. 代码已提交 ✅
- [x] 所有更改已推送到 GitHub
- [x] 版本: `79dab13`

---

## 📋 您需要配置的内容

### 必需信息

请提供以下信息以完成配置：

#### 1. 合约地址 🔴 必需
```bash
CONTRACT_ADDRESS=0x________________  # 您部署的合约地址
```

#### 2. Monad RPC URL 🔴 必需
```bash
MONAD_RPC_URL=https://____________  # Monad RPC 节点地址
```

#### 3. Monad 链 ID 🟡 可选（需确认）
```bash
# 在 frontend/user-payment/src/config/wagmi.js 中
id: 41454  # Monad 链 ID（请确认实际值）
```

#### 4. 网络类型 🟡 可选
- [ ] 测试网 (Testnet)
- [ ] 主网 (Mainnet)

---

## 🔧 配置步骤

### 步骤 1: 更新后端配置

编辑 `backend/.env`：

```bash
# 复制示例配置
cp backend/env.example backend/.env

# 然后编辑，填入实际值：
CONTRACT_ADDRESS=0xYourContractAddress
MONAD_RPC_URL=https://your-monad-rpc-url
```

### 步骤 2: 更新前端配置

编辑 `frontend/user-payment/.env`：

```bash
VITE_API_BASE_URL=http://localhost:3000
VITE_CONTRACT_ADDRESS=0xYourContractAddress
VITE_MONAD_RPC_URL=https://your-monad-rpc-url
VITE_WALLETCONNECT_PROJECT_ID=1fba176f84da8ad01ca69caa0074f292
```

### 步骤 3: 验证链配置

检查 `frontend/user-payment/src/config/wagmi.js` 中的 Monad 链配置：

```javascript
export const monadTestnet = {
  id: 41454,  // ⚠️ 确认这是正确的链 ID
  name: 'Monad Testnet',
  // ...
};
```

### 步骤 4: 测试本地环境

```bash
# 1. 启动后端（已在运行）
cd backend && npm start

# 2. 启动前端
cd frontend/user-payment && npm run dev

# 3. 测试支付流程
```

---

## 🧪 测试清单

### 本地测试

- [ ] 后端启动成功，没有致命错误
- [ ] 访问 `http://localhost:5175/pay/{orderId}` 能看到支付页面
- [ ] 能够连接钱包（WalletConnect）
- [ ] 钱包显示正确的网络（Monad）
- [ ] 能够查看订单详情
- [ ] 点击支付能够调起钱包签名
- [ ] 交易提交成功
- [ ] 后端日志显示收到 `PaymentMade` 事件（如果 RPC 支持）
- [ ] 订单状态更新为 'completed'
- [ ] 商家端收到支付通知

### 合约验证

在区块链浏览器或通过代码验证：

```javascript
// 1. 检查 ETH/MON 是否在白名单
const isAllowed = await contract.isTokenAllowed('0x0000000000000000000000000000000000000000');
console.log('ETH/MON allowed:', isAllowed);

// 2. 测试支付后查询
const payment = await contract.getPayment(orderIdUint256);
console.log('Payment info:', payment);

// 3. 检查订单是否已支付
const isPaid = await contract.isOrderPaid(orderIdUint256);
console.log('Is paid:', isPaid);
```

---

## 🚀 Zeabur 部署前

部署到 Zeabur 之前，确保：

### 环境变量准备

- [ ] 主网合约地址（如果部署到主网）
- [ ] 稳定的 Monad RPC URL
- [ ] WalletConnect Project ID 有效
- [ ] 所有前端和后端的环境变量已准备好

### 数据准备

- [ ] 至少有一个测试商家账号
- [ ] 至少有几个测试商品
- [ ] 钱包中有足够的 MON 用于测试

---

## 🆘 需要帮助？

### 常见问题

1. **"Token not allowed" 错误**
   - 确认合约中 `address(0)` 已在白名单
   - 调用 `contract.addAllowedToken(ethers.ZeroAddress)` (需要 owner)

2. **"余额不足" 错误**
   - 确认钱包在正确的网络
   - 确认有足够的 MON
   - 检查金额计算（18位小数）

3. **"Invalid orderId" 错误**
   - 确认 UUID 格式正确
   - 检查 UUID -> uint256 转换逻辑

4. **事件监听不工作**
   - 这是已知问题（RPC 节点限制）
   - 不影响基本支付功能
   - 商家可以手动刷新订单

### 查看文档

- 📖 详细说明: `docs/CONTRACT_INTEGRATION.md`
- 🚀 部署指南: `docs/ZEABUR_DEPLOY_STEP_BY_STEP.md`
- ⚙️ 环境变量: `zeabur-env-config.txt`

---

## 🎯 下一步行动

请告诉我：

1. **您的合约地址是什么？**
2. **您使用的 Monad RPC URL 是什么？**
3. **您想先本地测试还是直接部署？**

我会帮您完成配置！✨
