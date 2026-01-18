# 合约对接配置指南

本文档说明如何配置系统以对接已部署的 Payment 合约。

## 📋 合约信息

### 合约特点

您的合约与之前的假设有以下关键差异：

1. **订单ID类型**: `uint256` 而不是 `bytes32`
2. **事件名称**: `PaymentMade` 而不是 `PaymentCompleted`
3. **支付函数签名**: `pay(uint256 orderId, address token, uint256 amount)`
4. **代币支持**: 支持 ETH/MON 和 ERC20 代币白名单

### 合约接口

```solidity
// 支付函数
function pay(uint256 orderId, address token, uint256 amount) external payable

// 支付事件
event PaymentMade(
    uint256 indexed orderId,
    address indexed payer,
    address indexed token,
    uint256 amount,
    uint256 timestamp
)

// 查询函数
function getPayment(uint256 orderId) external view returns (PaymentInfo memory)
function isOrderPaid(uint256 orderId) external view returns (bool)
function isTokenAllowed(address token) external view returns (bool)
```

---

## 🔧 已完成的代码调整

### 1. 合约 ABI 更新

✅ **文件**: `contracts/PaymentContract.abi.json`
✅ **文件**: `frontend/user-payment/src/contracts/abi.js`

已更新为完整的合约 ABI，包含所有函数和事件。

### 2. 后端区块链服务

✅ **文件**: `backend/src/services/blockchainService.js`

**关键更改**:

```javascript
// 1. 从文件读取完整 ABI
const CONTRACT_ABI = JSON.parse(
  readFileSync(join(__dirname, '../../../contracts/PaymentContract.abi.json'), 'utf8')
);

// 2. 监听 PaymentMade 事件（而不是 PaymentCompleted）
this.contract.on('PaymentMade', async (orderId, payer, token, amount, timestamp, event) => {
  // orderId 是 uint256 BigInt
  const orderIdStr = orderId.toString();
  // ... 处理支付完成
});

// 3. UUID <-> uint256 转换函数
uuidToUint256(uuid) {
  const hex = uuid.replace(/-/g, '');
  return BigInt('0x' + hex);
}
```

### 3. 前端支付页面

✅ **文件**: `frontend/user-payment/src/pages/Payment.jsx`

**关键更改**:

```javascript
// 1. 使用新的 ABI
import { PAYMENT_CONTRACT_ABI } from '../contracts/abi';

// 2. 将 UUID 转换为 uint256
const orderIdHex = '0x' + orderId.replace(/-/g, '');
const orderIdUint256 = BigInt(orderIdHex);

// 3. 调用新的支付函数
const payTx = await paymentContract.pay(
  orderIdUint256,              // uint256 orderId
  ethers.ZeroAddress,          // address token (address(0) = ETH/MON)
  amount,                      // uint256 amount
  { value: amount }            // 发送原生代币
);
```

---

## ⚙️ 配置步骤

### 步骤 1: 更新环境变量

在 `backend/.env` 中配置：

```bash
# 合约地址（您部署的地址）
CONTRACT_ADDRESS=0xYourContractAddressHere

# Monad RPC URL
MONAD_RPC_URL=https://testnet-rpc.monad.xyz

# 前端 URL
PAYMENT_URL=http://localhost:5175/pay
```

### 步骤 2: 更新前端配置

在 `frontend/user-payment/.env` 中配置：

```bash
# 后端 API
VITE_API_BASE_URL=http://localhost:3000

# 合约地址
VITE_CONTRACT_ADDRESS=0xYourContractAddressHere

# Monad RPC URL
VITE_MONAD_RPC_URL=https://testnet-rpc.monad.xyz

# WalletConnect Project ID
VITE_WALLETCONNECT_PROJECT_ID=1fba176f84da8ad01ca69caa0074f292
```

### 步骤 3: 更新 Monad 链配置

在 `frontend/user-payment/src/config/wagmi.js` 中，确认 Monad 链配置正确：

```javascript
export const monadTestnet = {
  id: 41454, // Monad Testnet Chain ID（请确认实际值）
  name: 'Monad Testnet',
  network: 'monad-testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'Monad',
    symbol: 'MON',
  },
  rpcUrls: {
    default: { http: ['https://testnet-rpc.monad.xyz'] },
    public: { http: ['https://testnet-rpc.monad.xyz'] },
  },
  blockExplorers: {
    default: { name: 'MonadScan', url: 'https://testnet.monad.xyz' },
  },
  testnet: true,
};
```

---

## 🧪 测试流程

### 1. 测试后端连接

```bash
# 启动后端
cd backend
npm start

# 检查日志，应该看到：
✅ 合约事件监听已启动
📡 等待链上支付事件...
```

### 2. 测试前端支付

```bash
# 启动用户支付页
cd frontend/user-payment
npm run dev

# 访问支付页面
http://localhost:5175/pay/{orderId}
```

**测试步骤**:
1. 连接钱包（支持 WalletConnect）
2. 确认在 Monad 网络
3. 点击支付
4. 查看交易是否成功
5. 检查后端日志是否收到 `PaymentMade` 事件

### 3. 检查链上状态

使用合约的查询函数验证：

```javascript
// 在浏览器控制台或前端代码中
const contract = new ethers.Contract(contractAddress, abi, provider);

// 检查订单是否已支付
const isPaid = await contract.isOrderPaid(orderIdUint256);
console.log('订单已支付:', isPaid);

// 获取支付信息
const payment = await contract.getPayment(orderIdUint256);
console.log('支付信息:', payment);
```

---

## 🔍 常见问题

### 问题 1: UUID 转 uint256 失败

**症状**: 前端调用合约时报错 "invalid BigNumber string"

**原因**: UUID 格式不正确或转换逻辑错误

**解决**:
```javascript
// 确保 UUID 格式正确（36个字符，包含4个连字符）
const isValidUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(orderId);

// 转换
const orderIdHex = '0x' + orderId.replace(/-/g, '');
const orderIdUint256 = BigInt(orderIdHex);
```

### 问题 2: 事件监听不工作

**症状**: 支付成功但后端没有收到事件

**可能原因**:
1. RPC 节点不支持 `eth_newFilter`
2. 合约地址配置错误
3. 网络不匹配

**解决**:
```bash
# 1. 检查后端日志
⚠️  当前 RPC 节点不支持 eth_newFilter 方法

# 2. 使用支持完整功能的 RPC 节点

# 3. 手动测试事件过滤
const filter = contract.filters.PaymentMade();
const events = await contract.queryFilter(filter, -1000);
```

### 问题 3: 支付时显示"余额不足"

**症状**: 明明有余额但提示不足

**原因**: 
1. 连接的是错误的网络
2. 金额计算错误（小数位数）

**解决**:
```javascript
// 检查网络
const network = await provider.getNetwork();
console.log('当前网络:', network.chainId);

// 检查余额
const balance = await provider.getBalance(address);
console.log('余额:', ethers.formatEther(balance), 'MON');
console.log('需要:', ethers.formatEther(amount), 'MON');
```

### 问题 4: 合约调用失败 "Token not allowed"

**症状**: 调用 `pay()` 函数时 revert

**原因**: 使用的代币没有在白名单中

**解决**:
```javascript
// 检查代币是否允许
const isAllowed = await contract.isTokenAllowed(ethers.ZeroAddress);
console.log('ETH/MON 是否允许:', isAllowed);

// 如果不允许，需要合约 owner 添加
// await contract.addAllowedToken(ethers.ZeroAddress);
```

---

## 📊 支付流程图

```
用户扫码
  ↓
前端获取订单信息 (GET /api/orders/:orderId)
  ↓
用户连接钱包 (WalletConnect)
  ↓
前端调用合约 pay(orderId, token, amount)
  ↓
交易提交到 Monad 链
  ↓
合约触发 PaymentMade 事件
  ↓
后端监听到事件
  ↓
更新订单状态为 'completed'
  ↓
通过 Socket.IO 通知商家端
  ↓
商家端显示支付成功 + 语音播报
```

---

## 🎯 部署到 Zeabur 的额外配置

部署时需要确保：

### 后端环境变量

```bash
CONTRACT_ADDRESS=0xYourDeployedContractAddress
MONAD_RPC_URL=https://mainnet-rpc.monad.xyz  # 主网
# 或
MONAD_RPC_URL=https://testnet-rpc.monad.xyz  # 测试网
```

### 前端环境变量

所有三个前端（merchant-mobile, merchant-desktop, user-payment）都需要配置相应的合约地址和 RPC URL。

---

## ✅ 检查清单

部署前请确认：

- [ ] 合约已正确部署到 Monad 网络
- [ ] 合约中 ETH/MON (address(0)) 已在白名单
- [ ] 后端 `CONTRACT_ADDRESS` 配置正确
- [ ] 后端 `MONAD_RPC_URL` 可访问
- [ ] 前端 `VITE_CONTRACT_ADDRESS` 配置正确
- [ ] 前端 `VITE_MONAD_RPC_URL` 可访问
- [ ] WalletConnect Project ID 有效
- [ ] Wagmi 配置的链 ID 与实际 Monad 链匹配
- [ ] 测试钱包有足够的 MON 用于测试
- [ ] 本地测试支付流程成功
- [ ] 事件监听正常工作

---

## 🚀 下一步

现在您可以：

1. **本地测试**: 完整测试支付流程
2. **部署到 Zeabur**: 按照 `docs/ZEABUR_DEPLOY_STEP_BY_STEP.md` 部署
3. **生产配置**: 使用主网合约地址和 RPC

祝您部署顺利！🎉
