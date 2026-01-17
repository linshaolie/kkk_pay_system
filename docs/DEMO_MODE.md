# 🎬 DEMO 演示模式

## 📋 概述

为了方便快速演示和测试系统功能，系统现在支持 **DEMO 模式**，无需真实的区块链支付，订单会在创建 5 秒后自动完成。

---

## ✨ 特性

### 自动完成订单

- ⏱️ **5秒延迟**：订单创建后 5 秒自动变为 `completed` 状态
- 📡 **实时通知**：商家电脑端通过 Socket.IO 收到 `payment_completed` 事件
- 🔊 **语音播报**：自动触发"收款到账 XXX"语音播报
- 📝 **清晰日志**：所有 DEMO 相关日志都带 `[DEMO]` 前缀

### 适用场景

✅ **快速演示**：向客户展示完整的收银流程  
✅ **功能测试**：测试订单创建、通知、语音播报等功能  
✅ **UI 开发**：前端开发时快速验证交互效果  
✅ **培训教学**：培训商家使用系统，无需真实支付  

❌ **不适用**：生产环境、真实收款场景

---

## 🚀 使用方法

### 1. 启动系统

```bash
# 后端
cd backend
npm start

# 商家手机端
cd frontend/merchant-mobile
npm run dev

# 商家电脑端
cd frontend/merchant-desktop
npm run dev

# 用户支付端（可选）
cd frontend/user-payment
npm run dev
```

### 2. 创建订单

#### 方式 A：手机端扫码

1. 商家手机端登录
2. 扫描商品条码（或手动输入商品ID）
3. 系统创建订单

#### 方式 B：API 调用

```bash
curl -X POST http://localhost:3000/api/orders \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"productId": "P001"}'
```

### 3. 观察演示效果

**时间线：**

```
t=0s    订单创建
        ├─ 商家手机端：显示"订单创建成功"
        └─ 商家电脑端：显示订单详情和二维码

t=5s    订单自动完成
        ├─ 后端日志：[DEMO] 订单自动完成
        ├─ 商家电脑端：收到支付完成通知
        ├─ 语音播报："收款到账 0.01 元"
        └─ 订单状态更新为"已完成"
```

---

## 🖥️ 后端日志示例

### 订单创建

```bash
✅ 订单 1737097654321234 创建成功
🎬 [DEMO] 订单 1737097654321234 将在 5 秒后自动完成...
```

### 5秒后自动完成

```bash
🎬 [DEMO] 订单 1737097654321234 5秒后自动完成...
✅ [DEMO] 订单 1737097654321234 已自动完成，已通知商家
```

### Socket.IO 事件

```javascript
// 商家电脑端收到的事件
{
  event: 'payment_completed',
  data: {
    orderId: '1737097654321234',
    amount: 0.01,
    txHash: null,
    userWallet: 'demo_user'
  }
}
```

---

## 📱 前端效果

### 商家手机端

```
┌────────────────────────────┐
│  扫码收款                   │
├────────────────────────────┤
│  商品：可口可乐              │
│  金额：¥0.01                │
│                            │
│  [订单创建成功]             │
│  订单号：1737097654321234   │
│                            │
│  ✅ 已同步到电脑端           │
└────────────────────────────┘
```

### 商家电脑端

**创建时（0秒）：**

```
┌─────────────────────────────────┐
│  等待支付                        │
├─────────────────────────────────┤
│  订单号：1737097654321234        │
│  商品：可口可乐                   │
│  金额：¥0.01                     │
│                                 │
│  [二维码]                        │
│  请用户扫码支付                   │
│                                 │
│  ⏳ 等待支付中...                │
└─────────────────────────────────┘
```

**5秒后：**

```
┌─────────────────────────────────┐
│  支付成功！                      │
├─────────────────────────────────┤
│  订单号：1737097654321234        │
│  商品：可口可乐                   │
│  金额：¥0.01                     │
│                                 │
│  付款人：demo_user               │
│  状态：✅ 已完成                  │
│                                 │
│  🔊 "收款到账 0.01 元"           │
└─────────────────────────────────┘
```

---

## 🔧 技术实现

### 后端实现

```javascript
// backend/src/controllers/orderController.js

export const createOrder = async (req, res, io, blockchainService) => {
  // ... 创建订单逻辑 ...

  // 🎬 DEMO 模式：5秒后自动完成订单
  setTimeout(async () => {
    try {
      console.log(`🎬 [DEMO] 订单 ${orderId} 5秒后自动完成...`);
      
      // 更新订单状态
      await Order.updateStatus(orderId, 'completed', null, 'demo_user');
      
      // 获取更新后的订单
      const completedOrder = await Order.findByOrderId(orderId);
      
      if (completedOrder && io) {
        // 通过 Socket.IO 通知商家
        io.to(`merchant_${merchantId}`).emit('payment_completed', {
          orderId,
          amount: completedOrder.amount,
          txHash: null,
          userWallet: 'demo_user',
        });
        
        console.log(`✅ [DEMO] 订单 ${orderId} 已自动完成，已通知商家`);
      }
    } catch (error) {
      console.error(`❌ [DEMO] 订单 ${orderId} 自动完成失败:`, error);
    }
  }, 5000); // 5秒
  
  // ...
};
```

### 前端监听

```javascript
// frontend/merchant-desktop/src/pages/Dashboard.jsx

useEffect(() => {
  // 监听支付完成事件
  socket.on('payment_completed', (data) => {
    console.log('收到支付完成通知:', data);
    
    // 更新订单状态
    setCurrentOrder(prev => ({
      ...prev,
      status: 'completed',
      user_wallet: data.userWallet,
      tx_hash: data.txHash,
    }));
    
    // 播放语音
    speak(`收款到账 ${data.amount} 元`);
    
    // 显示成功提示
    toast.success('支付成功！');
  });
  
  return () => socket.off('payment_completed');
}, []);
```

---

## 🎯 演示脚本

### 完整演示流程（约 10 秒）

**准备（1分钟）：**
1. 启动后端、商家手机端、商家电脑端
2. 商家手机端登录
3. 商家电脑端登录并显示仪表盘

**演示（10秒）：**
```
[0s] 演示人：
     "现在我在手机端扫描一个商品..."
     (手动输入商品ID: P001)

[1s] 手机端：
     显示"订单创建成功"

[1s] 电脑端：
     显示订单详情和二维码
     "请用户扫码支付"

[5s] 演示人：
     "系统会自动检测支付完成..."

[6s] 电脑端：
     🎉 支付成功动画
     🔊 "收款到账 0.01 元"
     
[7s] 演示人：
     "交易完成！整个流程非常简单快捷。"
```

---

## 🔄 与真实支付对比

| 特性 | DEMO 模式 | 真实支付模式 |
|------|----------|-------------|
| **支付方式** | 自动完成（5秒） | 用户扫码钱包支付 |
| **支付确认** | setTimeout | 合约事件监听 + 状态轮询 |
| **付款人** | `demo_user` | 真实钱包地址 |
| **交易哈希** | `null` | 真实 txHash |
| **区块链交互** | ❌ 无 | ✅ 有 |
| **配置需求** | ❌ 无需任何配置 | ✅ 需要 RPC、合约地址等 |
| **适用场景** | 演示、测试 | 生产环境 |
| **语音播报** | ✅ 正常工作 | ✅ 正常工作 |
| **Socket.IO** | ✅ 正常工作 | ✅ 正常工作 |
| **订单状态** | ✅ 正常更新 | ✅ 正常更新 |

---

## ⚙️ 配置选项（未来扩展）

如果需要，可以通过环境变量控制 DEMO 模式：

```env
# backend/.env

# 是否启用 DEMO 模式（未来可配置）
DEMO_MODE=true

# DEMO 模式下订单自动完成的延迟（秒）
DEMO_ORDER_DELAY=5
```

**实现示例：**

```javascript
// backend/src/config/index.js
export default {
  // ...
  demo: {
    enabled: process.env.DEMO_MODE === 'true',
    orderDelay: parseInt(process.env.DEMO_ORDER_DELAY) || 5,
  },
};

// backend/src/controllers/orderController.js
if (config.demo.enabled) {
  setTimeout(async () => {
    // 自动完成订单
  }, config.demo.orderDelay * 1000);
}
```

---

## 🚨 注意事项

### 1. 仅供演示

⚠️ **DEMO 模式不应在生产环境使用**

- 订单会自动完成，无法验证真实支付
- 无法获取真实的交易哈希
- 付款人固定为 `demo_user`

### 2. 与轮询机制兼容

DEMO 模式下，后端轮询机制仍然启用（如果配置了区块链服务），这是为了：

- ✅ 测试轮询功能是否正常
- ✅ 验证双重确认机制
- ✅ 保持代码一致性

### 3. 前端轮询

商家电脑端的前端轮询仍会工作，但会更快检测到订单状态变化（3秒轮询 vs 5秒自动完成）。

---

## 🎓 教学建议

### 向客户演示

1. **强调速度**：
   - "看，从扫码到收款只需 5 秒！"
   
2. **展示语音播报**：
   - "系统会自动播报收款金额，您不用一直盯着屏幕"
   
3. **演示多订单**：
   - 连续创建 2-3 个订单，展示并发处理能力

### 培训商家

1. **完整流程**：
   - 注册 → 登录 → 添加商品 → 扫码收款 → 订单管理
   
2. **异常处理**：
   - 取消订单
   - 查看历史订单
   - 今日统计

---

## 🔮 未来优化

### 1. 可配置 DEMO 模式

```env
DEMO_MODE=true
DEMO_ORDER_DELAY=5
```

### 2. 模拟不同场景

```javascript
// 90% 成功，10% 失败
if (Math.random() < 0.9) {
  // 自动完成
} else {
  // 模拟支付失败
}
```

### 3. 模拟真实延迟

```javascript
// 随机 3-8 秒，模拟真实用户支付时间
const delay = 3000 + Math.random() * 5000;
setTimeout(/* ... */, delay);
```

### 4. 批量演示模式

```javascript
// 一次创建多个订单，依次完成
POST /api/orders/demo/batch
{
  "productIds": ["P001", "P002", "P003"],
  "interval": 3 // 每 3 秒完成一个
}
```

---

## 📚 相关文档

- [快速开始](../QUICK_START.md)
- [订单轮询机制](./ORDER_POLLING.md)
- [API 文档](./API.md)
- [合约集成](./CONTRACT_INTEGRATION.md)

---

## 🆘 常见问题

### Q: DEMO 模式可以关闭吗？

A: 目前 DEMO 模式是默认启用的。如果需要关闭，可以：
1. 注释掉 `orderController.js` 中的 `setTimeout` 代码
2. 或者通过环境变量控制（需要先实现配置功能）

### Q: 为什么选择 5 秒？

A: 5 秒的延迟是为了：
- ✅ 足够长：让用户看到"等待支付"的状态
- ✅ 足够短：不会让演示拖沓
- ✅ 模拟真实：真实用户扫码支付大约需要 3-10 秒

### Q: DEMO 模式下能测试取消订单吗？

A: 可以！但要在 5 秒内操作：
1. 创建订单
2. 立即点击"取消订单"按钮
3. 如果在 5 秒内取消，订单状态为 `cancelled`
4. 如果超过 5 秒，订单已变为 `completed`，无法取消

### Q: 能否延长到 10 秒或更长？

A: 当然可以！修改 `orderController.js`：

```javascript
setTimeout(async () => {
  // ...
}, 10000); // 改为 10 秒
```

---

## 🎉 开始演示！

现在就试试 DEMO 模式，体验丝滑的收银流程吧！

```bash
# 启动系统
cd backend && npm start

# 创建订单，然后...等 5 秒 ⏰
# 🔊 "收款到账！"
```

Happy Demo! 🚀
