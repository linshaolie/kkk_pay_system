# 订单支付状态轮询机制

## 📋 概述

为了确保订单支付状态能够可靠地更新，系统实现了**双重确认机制**：

1. **事件监听（主）**：实时监听合约 `PaymentMade` 事件
2. **状态轮询（备）**：定期查询合约 `isOrderPaid` 函数

当 RPC 节点不支持 `eth_newFilter` 方法时，事件监听可能失败，此时轮询机制确保支付状态仍能被正确更新。

---

## 🔄 工作流程

### 1. 订单创建时

```javascript
// 商家扫描商品，创建订单
POST /api/orders
{
  "productId": "P001"
}

// 后端自动开始轮询
blockchainService.startPollingOrder(orderId);
```

### 2. 轮询机制

```
订单创建
    ↓
开始轮询（每5秒）
    ↓
调用合约: isOrderPaid(orderId)
    ↓
    ├─ 未支付 → 继续轮询
    │
    └─ 已支付 → 
         ├─ 调用合约: getPayment(orderId)
         ├─ 更新后端订单状态为 'completed'
         ├─ 通知商家电脑端（Socket.IO）
         └─ 停止轮询
```

### 3. 停止轮询的条件

- ✅ 订单支付完成
- ⏰ 超时（30分钟）
- ❌ 订单被取消
- 🛑  服务器关闭

---

## 🎯 智能切换

系统会根据 RPC 节点能力自动选择最优方案：

| RPC 能力 | 事件监听 | 状态轮询 | 说明 |
|---------|---------|---------|------|
| 支持 `eth_newFilter` | ✅ 启用 | ⏸️ 跳过 | 优先使用事件监听（实时、高效） |
| 不支持 `eth_newFilter` | ❌ 失败 | ✅ 启用 | 自动降级到轮询（可靠、有延迟） |

**判断逻辑**：

```javascript
// blockchainService.startPollingOrder()
if (this.eventListenerSupported && this.isListening) {
  console.log('📡 事件监听已启用，订单无需轮询');
  return;
}

// 事件监听失败时，自动启用轮询
console.log('🔄 开始轮询订单的链上支付状态...');
```

---

## 📊 性能优化

### 轮询间隔：5秒

```javascript
setInterval(() => {
  checkOrderPaymentStatus(orderId);
}, 5000); // 5秒
```

**权衡考虑**：
- ⏱️ 太快：增加 RPC 负担，可能触发限流
- 🐌 太慢：用户支付后需等待较长时间
- ✅ 5秒：平衡实时性和性能

### 轮询超时：30分钟

```javascript
setTimeout(() => {
  stopPollingOrder(orderId);
}, 30 * 60 * 1000); // 30分钟
```

**原因**：
- 用户扫码后通常在 1-2 分钟内完成支付
- 30 分钟足够长，避免误停止
- 防止长时间轮询浪费资源

### 资源清理

```javascript
// 订单支付完成后立即停止轮询
stopPollingOrder(orderId);

// 服务器关闭时清理所有轮询
process.on('SIGINT', () => {
  blockchainService.stopAllPolling();
});
```

---

## 🔌 合约接口

### `isOrderPaid(uint256 orderId)`

**作用**：检查订单是否已支付

```solidity
function isOrderPaid(uint256 orderId) public view returns (bool)
```

**调用示例**：

```javascript
const orderId = BigInt("1737097654321234");
const isPaid = await contract.isOrderPaid(orderId);
// 返回: true 或 false
```

### `getPayment(uint256 orderId)`

**作用**：获取订单的支付详情

```solidity
function getPayment(uint256 orderId) public view returns (PaymentInfo memory)
```

**返回结构**：

```javascript
{
  orderId: BigInt("1737097654321234"),
  payer: "0xD66D65951272Bbd90b9eDe74998C77ab425FA2C4",
  token: "0x0000000000000000000000000000000000000000", // MON (原生代币)
  amount: BigInt("10000000000000000"), // 0.01 MON (wei)
  timestamp: BigInt("1737097654") // Unix 时间戳
}
```

---

## 🚀 使用示例

### 订单创建（自动开始轮询）

```bash
# 商家扫描商品
curl -X POST http://localhost:3000/api/orders \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"productId": "P001"}'

# 后端日志
✅ 订单 1737097654321234 创建成功
🔄 开始轮询订单 1737097654321234 的链上支付状态...
```

### 用户支付

```bash
# 用户扫码支付（前端调用钱包）
# 合约: pay(orderId, token, amount)
```

### 支付检测

```bash
# 后端轮询日志（每5秒）
💰 检测到订单 1737097654321234 已在链上支付！
链上支付信息: {
  orderId: 1737097654321234,
  payer: 0xD66D65951272Bbd90b9eDe74998C77ab425FA2C4,
  token: 0x0000000000000000000000000000000000000000,
  amount: 0.01 MON,
  timestamp: 2026-01-17 18:20:54
}
✅ 订单 1737097654321234 支付成功，已通知商家（通过轮询）
⏹️  已停止轮询订单 1737097654321234
```

### 商家端收到通知

```javascript
// Socket.IO 事件
socket.on('payment_completed', (data) => {
  console.log('收到支付完成通知:', data);
  // {
  //   orderId: "1737097654321234",
  //   amount: 0.01,
  //   txHash: null, // 轮询模式下无法获取 txHash
  //   userWallet: "0xD66D65951272Bbd90b9eDe74998C77ab425FA2C4"
  // }
  
  // 播放语音
  speak(`收款到账 ${data.amount} 元`);
});
```

---

## 📝 日志说明

### 正常日志（事件监听模式）

```bash
✅ 合约事件监听已启动
📡 等待链上支付事件...
📡 事件监听已启用，订单 1737097654321234 无需轮询
```

### 降级日志（轮询模式）

```bash
⚠️  当前 RPC 节点不支持 eth_newFilter 方法
💡 影响：
   ✅ 基本功能正常（创建订单、生成二维码）
   ❌ 无法自动监听链上支付完成事件
   ❌ 商家端不会自动收到支付语音播报

🔧 解决方案：
   1. 使用支持完整 JSON-RPC 的 Monad 节点
   2. 或在生产环境部署后联系 Monad 团队获取节点信息
   3. 临时方案：系统已自动启用轮询机制

🔄 开始轮询订单 1737097654321234 的链上支付状态...
💰 检测到订单 1737097654321234 已在链上支付！
✅ 订单 1737097654321234 支付成功，已通知商家（通过轮询）
⏹️  已停止轮询订单 1737097654321234
```

---

## 🔧 故障排除

### 1. 轮询未启动

**现象**：订单创建后没有看到 "开始轮询" 日志

**原因**：
- 事件监听正常工作，轮询自动跳过
- `blockchainService` 未初始化

**解决**：
```bash
# 检查后端日志
✅ 合约事件监听已启动  # 说明事件监听正常，无需轮询

# 或
⚠️  区块链服务初始化失败  # 需要检查 .env 配置
```

### 2. 轮询一直无法检测到支付

**现象**：用户已支付，但后端一直显示 "待支付"

**原因**：
- 合约地址配置错误
- RPC 节点不可用
- 用户支付到了错误的合约

**解决**：
```bash
# 1. 检查合约地址
cat backend/.env | grep CONTRACT_ADDRESS
# 应该是: 0xba53E893Ba76B8971E913d2fB83970aC7CC7a25E

# 2. 测试 RPC 连接
curl -X POST https://testnet.monad.xyz \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'

# 3. 在浏览器查询交易
# https://explorer.monad.xyz/address/0xba53E893Ba76B8971E913d2fB83970aC7CC7a25E
```

### 3. 轮询超时停止

**现象**：30分钟后轮询自动停止

**解决**：
- 这是正常的超时保护机制
- 如果订单仍需轮询，可以手动重启服务器
- 或者修改 `blockchainService.js` 中的超时时间

---

## 🎨 前端调整建议

虽然后端已经实现轮询，但**商家端前端的轮询机制仍建议保留**，原因：

1. **双重保险**：前端 + 后端同时轮询，更可靠
2. **用户体验**：前端轮询可以更快更新 UI（3秒 vs 5秒）
3. **网络隔离**：如果 Socket.IO 断开，前端仍能更新状态

**建议配置**：

```javascript
// frontend/merchant-desktop/src/pages/Dashboard.jsx

// 前端轮询：3秒（快速响应 UI）
useEffect(() => {
  const interval = setInterval(() => {
    checkOrderStatus(currentOrder.order_id);
  }, 3000);
  return () => clearInterval(interval);
}, [currentOrder]);

// 后端轮询：5秒（减少 RPC 压力）
// 在 blockchainService.js 中配置
```

---

## 📊 对比：事件监听 vs 轮询

| 特性 | 事件监听 | 状态轮询 |
|------|---------|---------|
| **实时性** | ⚡️ 即时（1-2秒） | 🐌 延迟（最多5秒） |
| **资源消耗** | 💚 低（只在事件时处理） | 💛 中（定期查询） |
| **可靠性** | ⚠️ 依赖 RPC 支持 | ✅ 高（直接查询状态） |
| **RPC 要求** | 需要 `eth_newFilter` | 只需基础 `view` 调用 |
| **网络负担** | 💚 低（WebSocket 长连接） | 💛 中（HTTP 轮询） |
| **适用场景** | 生产环境（完整节点） | 开发/测试环境 |

---

## 🔮 未来优化

### 1. 智能轮询频率

根据订单创建时间动态调整：

```javascript
// 前 2 分钟：每 3 秒
// 2-10 分钟：每 10 秒
// 10-30 分钟：每 30 秒
```

### 2. 批量查询

一次查询多个订单状态，减少 RPC 调用：

```javascript
const orderIds = [orderId1, orderId2, orderId3];
const results = await contract.batchCheckOrders(orderIds);
```

### 3. 事件日志查询

如果 RPC 支持 `eth_getLogs`，可以查询历史事件：

```javascript
const logs = await provider.getLogs({
  address: contractAddress,
  topics: [paymentMadeEventTopic],
  fromBlock: blockNumber - 100,
  toBlock: 'latest'
});
```

---

## 📚 相关文档

- [合约集成文档](./CONTRACT_INTEGRATION.md)
- [自动切换网络](./AUTO_SWITCH_NETWORK.md)
- [Zeabur 部署指南](./ZEABUR_DEPLOY.md)
- [API 文档](./API.md)

---

## 🆘 支持

如遇问题，请检查：

1. 后端日志：是否有 "开始轮询" 或 "检测到支付" 的日志
2. RPC 连接：是否可以正常访问 Monad RPC
3. 合约地址：是否正确配置
4. 订单状态：是否已被其他方式更新

如仍有问题，欢迎提 Issue！🚀
