# KKK POS API 文档

## 基础信息

- **Base URL**: `http://localhost:3000/api`
- **认证方式**: JWT Bearer Token
- **数据格式**: JSON

## 响应格式

### 成功响应
```json
{
  "success": true,
  "message": "操作成功",
  "data": { ... }
}
```

### 错误响应
```json
{
  "success": false,
  "message": "错误信息",
  "error": "详细错误（仅开发环境）"
}
```

## 认证相关 API

### 1. 商家注册

**POST** `/auth/register`

注册新的商家账号。

#### 请求参数

```json
{
  "username": "merchant01",
  "password": "password123",
  "storeName": "我的店铺",
  "phone": "13800138000",
  "walletAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"
}
```

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| username | string | 是 | 用户名，至少3个字符 |
| password | string | 是 | 密码，至少6个字符 |
| storeName | string | 是 | 店铺名称 |
| phone | string | 否 | 手机号 |
| walletAddress | string | 否 | 钱包地址 |

#### 响应示例

```json
{
  "success": true,
  "message": "注册成功",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "merchant": {
      "id": 1,
      "username": "merchant01",
      "storeName": "我的店铺",
      "phone": "13800138000",
      "walletAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"
    }
  }
}
```

---

### 2. 商家登录

**POST** `/auth/login`

商家账号登录。

#### 请求参数

```json
{
  "username": "merchant01",
  "password": "password123"
}
```

#### 响应示例

```json
{
  "success": true,
  "message": "登录成功",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "merchant": {
      "id": 1,
      "username": "merchant01",
      "storeName": "我的店铺",
      "phone": "13800138000",
      "walletAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"
    }
  }
}
```

---

### 3. 获取个人信息

**GET** `/auth/profile`

获取当前登录商家的信息（需要认证）。

#### 请求头

```
Authorization: Bearer {token}
```

#### 响应示例

```json
{
  "success": true,
  "data": {
    "id": 1,
    "username": "merchant01",
    "storeName": "我的店铺",
    "phone": "13800138000",
    "walletAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

---

### 4. 更新个人信息

**PUT** `/auth/profile`

更新商家信息（需要认证）。

#### 请求头

```
Authorization: Bearer {token}
```

#### 请求参数

```json
{
  "storeName": "新店铺名称",
  "phone": "13900139000",
  "walletAddress": "0xNewWalletAddress"
}
```

---

## 商品管理 API

### 5. 创建商品

**POST** `/products`

添加新商品（需要认证）。

#### 请求头

```
Authorization: Bearer {token}
```

#### 请求参数

```json
{
  "productId": "P001",
  "name": "可口可乐",
  "costPrice": 2.5,
  "salePrice": 3.5,
  "description": "330ml 经典可乐"
}
```

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| productId | string | 是 | 商品ID/条码 |
| name | string | 是 | 商品名称 |
| costPrice | number | 是 | 进货价 |
| salePrice | number | 是 | 售价 |
| description | string | 否 | 商品描述 |

#### 响应示例

```json
{
  "success": true,
  "message": "商品创建成功",
  "data": {
    "id": 1
  }
}
```

---

### 6. 获取商品列表

**GET** `/products`

获取商家的商品列表（需要认证）。

#### 请求头

```
Authorization: Bearer {token}
```

#### 查询参数

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| page | number | 1 | 页码 |
| limit | number | 20 | 每页数量 |

#### 响应示例

```json
{
  "success": true,
  "data": {
    "products": [
      {
        "id": 1,
        "merchant_id": 1,
        "product_id": "P001",
        "name": "可口可乐",
        "cost_price": "2.50",
        "sale_price": "3.50",
        "description": "330ml 经典可乐",
        "created_at": "2024-01-01T00:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 1,
      "totalPages": 1
    }
  }
}
```

---

### 7. 根据商品ID获取商品

**GET** `/products/product-id/:productId`

根据商品ID获取商品详情（需要认证）。

#### 请求头

```
Authorization: Bearer {token}
```

#### 响应示例

```json
{
  "success": true,
  "data": {
    "id": 1,
    "merchant_id": 1,
    "product_id": "P001",
    "name": "可口可乐",
    "cost_price": "2.50",
    "sale_price": "3.50",
    "description": "330ml 经典可乐",
    "created_at": "2024-01-01T00:00:00.000Z"
  }
}
```

---

### 8. 更新商品

**PUT** `/products/:id`

更新商品信息（需要认证）。

#### 请求头

```
Authorization: Bearer {token}
```

#### 请求参数

```json
{
  "name": "可口可乐（更新）",
  "costPrice": 2.8,
  "salePrice": 4.0,
  "description": "330ml 经典可乐 新包装"
}
```

---

### 9. 删除商品

**DELETE** `/products/:id`

删除商品（需要认证）。

#### 请求头

```
Authorization: Bearer {token}
```

---

## 订单管理 API

### 10. 创建订单

**POST** `/orders`

扫码创建订单（需要认证）。

#### 请求头

```
Authorization: Bearer {token}
```

#### 请求参数

```json
{
  "productId": "P001"
}
```

#### 响应示例

```json
{
  "success": true,
  "message": "订单创建成功",
  "data": {
    "order": {
      "id": 1,
      "order_id": "550e8400-e29b-41d4-a716-446655440000",
      "merchant_id": 1,
      "product_id": "P001",
      "product_name": "可口可乐",
      "amount": "3.50",
      "status": "pending",
      "store_name": "我的店铺",
      "merchant_wallet": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
      "created_at": "2024-01-01T00:00:00.000Z"
    },
    "paymentUrl": "http://localhost:5175/pay/550e8400-e29b-41d4-a716-446655440000"
  }
}
```

---

### 11. 获取订单详情

**GET** `/orders/:orderId`

根据订单ID获取订单详情（无需认证，用于支付页面）。

#### 响应示例

```json
{
  "success": true,
  "data": {
    "id": 1,
    "order_id": "550e8400-e29b-41d4-a716-446655440000",
    "merchant_id": 1,
    "product_id": "P001",
    "product_name": "可口可乐",
    "amount": "3.50",
    "status": "pending",
    "tx_hash": null,
    "user_wallet": null,
    "paid_at": null,
    "store_name": "我的店铺",
    "merchant_wallet": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
    "created_at": "2024-01-01T00:00:00.000Z"
  }
}
```

---

### 12. 获取订单列表

**GET** `/orders/merchant/list`

获取商家的订单列表（需要认证）。

#### 请求头

```
Authorization: Bearer {token}
```

#### 查询参数

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| status | string | - | 订单状态：pending/completed/cancelled |
| page | number | 1 | 页码 |
| limit | number | 20 | 每页数量 |

#### 响应示例

```json
{
  "success": true,
  "data": {
    "orders": [
      {
        "id": 1,
        "order_id": "550e8400-e29b-41d4-a716-446655440000",
        "product_name": "可口可乐",
        "amount": "3.50",
        "status": "completed",
        "tx_hash": "0xabc123...",
        "user_wallet": "0xuser...",
        "paid_at": "2024-01-01T00:05:00.000Z",
        "created_at": "2024-01-01T00:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 1,
      "totalPages": 1
    }
  }
}
```

---

### 13. 获取待支付订单

**GET** `/orders/merchant/pending`

获取所有待支付订单（需要认证）。

#### 请求头

```
Authorization: Bearer {token}
```

---

### 14. 取消订单

**PUT** `/orders/:orderId/cancel`

取消订单（需要认证）。

#### 请求头

```
Authorization: Bearer {token}
```

---

### 15. 获取今日统计

**GET** `/orders/merchant/stats/today`

获取今日销售统计（需要认证）。

#### 请求头

```
Authorization: Bearer {token}
```

#### 响应示例

```json
{
  "success": true,
  "data": {
    "total_orders": 10,
    "completed_orders": 8,
    "total_amount": "150.00"
  }
}
```

---

## Socket.IO 事件

### 客户端事件

#### join_merchant
加入商家房间以接收实时通知。

```javascript
socket.emit('join_merchant', merchantId);
```

#### leave_merchant
离开商家房间。

```javascript
socket.emit('leave_merchant', merchantId);
```

### 服务端事件

#### new_order
新订单创建通知（发送给商家电脑端）。

```javascript
socket.on('new_order', (data) => {
  console.log(data.order);
  console.log(data.paymentUrl);
});
```

#### payment_completed
支付完成通知（发送给商家电脑端）。

```javascript
socket.on('payment_completed', (data) => {
  console.log(data.orderId);
  console.log(data.amount);
  console.log(data.txHash);
  console.log(data.userWallet);
});
```

#### order_cancelled
订单取消通知（发送给商家电脑端）。

```javascript
socket.on('order_cancelled', (data) => {
  console.log(data.orderId);
});
```

---

## 错误码

| HTTP 状态码 | 说明 |
|------------|------|
| 200 | 请求成功 |
| 201 | 创建成功 |
| 400 | 请求参数错误 |
| 401 | 未授权/token 无效 |
| 403 | 无权限访问 |
| 404 | 资源不存在 |
| 500 | 服务器内部错误 |

---

## 使用示例

### JavaScript (Axios)

```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000/api',
});

// 登录
const login = async () => {
  const response = await api.post('/auth/login', {
    username: 'merchant01',
    password: 'password123',
  });
  
  const token = response.data.data.token;
  
  // 设置认证头
  api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  
  return response.data;
};

// 创建订单
const createOrder = async (productId) => {
  const response = await api.post('/orders', {
    productId,
  });
  
  return response.data;
};
```

### cURL

```bash
# 登录
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"merchant01","password":"password123"}'

# 创建订单（需要替换 TOKEN）
curl -X POST http://localhost:3000/api/orders \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"productId":"P001"}'
```
