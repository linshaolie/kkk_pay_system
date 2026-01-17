# 🔗 自动切换网络功能说明

## ✨ 功能概述

支付页面现在支持**自动检测并切换到 Monad 网络**，提供更好的用户体验。

---

## 🎯 功能特性

### 1. 自动检测网络
- 连接钱包后自动检测当前网络
- 如果不是 Monad 网络，自动提示用户切换

### 2. 一键切换网络
- 点击按钮即可切换到 Monad 网络
- 支持自动添加 Monad 网络（如果钱包中不存在）

### 3. 网络状态显示
- ✅ 正确网络：绿色提示 "✓ Monad 网络"
- ⚠️ 错误网络：黄色警告 + 切换按钮
- 🚫 错误网络时禁用支付按钮

---

## 🔧 工作流程

### 场景 1: 钱包已有 Monad 网络

```
用户连接钱包
    ↓
检测到非 Monad 网络
    ↓
自动尝试切换（调用 switchChain）
    ↓
切换成功 ✅
    ↓
显示 "✓ Monad 网络"
    ↓
启用支付按钮
```

### 场景 2: 钱包未配置 Monad 网络

```
用户连接钱包
    ↓
检测到非 Monad 网络
    ↓
自动尝试切换（失败：网络不存在）
    ↓
提示 "请先在钱包中添加 Monad 网络"
    ↓
自动调用 wallet_addEthereumChain
    ↓
用户确认添加网络
    ↓
自动切换到 Monad 网络 ✅
```

### 场景 3: 用户拒绝切换

```
自动尝试切换
    ↓
用户点击 "拒绝"
    ↓
显示黄色警告框
    ↓
提供 "切换到 Monad 网络" 按钮
    ↓
用户手动点击切换
```

---

## 📋 UI 状态

### 连接前
```
┌─────────────────────────┐
│  请连接钱包完成支付      │
│  [连接钱包按钮]          │
└─────────────────────────┘
```

### 连接后 - 错误网络
```
┌─────────────────────────┐
│  ⚠️ 网络不匹配          │
│  当前: 1 | 需要: 41454   │
│  [切换到 Monad 网络]     │
└─────────────────────────┘
┌─────────────────────────┐
│  ✓ 已连接钱包            │
│  0x1234...5678           │
└─────────────────────────┘
[支付] (禁用)
```

### 连接后 - 正确网络
```
┌─────────────────────────┐
│  ✓ 已连接钱包            │
│  0x1234...5678           │
│  ✓ Monad 网络            │
└─────────────────────────┘
[支付] (启用)
```

---

## 🔑 核心代码

### 1. 自动切换网络

```javascript
useEffect(() => {
  if (isConnected && chainId && chainId !== MONAD_CHAIN.id) {
    const autoSwitchNetwork = async () => {
      try {
        await switchChain({ chainId: MONAD_CHAIN.id });
        toast.success('已切换到 Monad 网络');
      } catch (error) {
        if (error.code === 4902) {
          // 网络不存在，尝试添加
          await addMonadNetwork();
        }
      }
    };
    autoSwitchNetwork();
  }
}, [isConnected, chainId, switchChain]);
```

### 2. 添加 Monad 网络

```javascript
const addMonadNetwork = async () => {
  await window.ethereum.request({
    method: 'wallet_addEthereumChain',
    params: [{
      chainId: `0x${MONAD_CHAIN.id.toString(16)}`,
      chainName: MONAD_CHAIN.name,
      nativeCurrency: MONAD_CHAIN.nativeCurrency,
      rpcUrls: MONAD_CHAIN.rpcUrls?.default?.http || ['https://testnet-rpc.monad.xyz'],
      blockExplorerUrls: [MONAD_CHAIN.blockExplorers?.default?.url],
    }],
  });
};
```

### 3. 网络状态 UI

```jsx
{chainId !== MONAD_CHAIN.id && (
  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
    <p className="text-sm text-yellow-800 mb-2 font-medium">⚠️ 网络不匹配</p>
    <button onClick={() => switchChain({ chainId: MONAD_CHAIN.id })}>
      切换到 Monad 网络
    </button>
  </div>
)}
```

---

## ⚙️ 配置说明

### Monad 链配置

在 `src/config/index.js` 中配置 Monad 链信息：

```javascript
export const MONAD_CHAIN = defineChain({
  id: 41454,
  name: 'Monad Testnet',
  network: 'monad-testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'Monad',
    symbol: 'MON',
  },
  // 如果设置了环境变量，使用指定的 RPC
  // 否则让钱包使用它自己配置的 RPC
  blockExplorers: {
    default: { name: 'MonadScan', url: 'https://testnet.monad.xyz' },
  },
  testnet: true,
});
```

### RPC 配置策略

**不设置 rpcUrls**（推荐）:
- 让钱包使用它自己配置的 Monad RPC
- 用户可以在钱包中自由选择 RPC 节点
- 更灵活，适合不同用户

**设置 rpcUrls**（可选）:
```javascript
rpcUrls: {
  default: { http: ['https://your-rpc-url'] },
  public: { http: ['https://your-rpc-url'] },
}
```

---

## 🐛 错误处理

### 错误码说明

| 错误码 | 说明 | 处理方式 |
|--------|------|----------|
| 4001 | 用户拒绝 | 显示手动切换按钮 |
| 4902 | 网络不存在 | 自动添加网络 |
| ACTION_REJECTED | 用户取消 | 友好提示 |

### Toast 提示

```javascript
// 成功
toast.success('已切换到 Monad 网络');

// 警告
toast.error('请手动切换到 Monad 网络');

// 需要添加网络
toast.error('请先在钱包中添加 Monad 网络', { duration: 5000 });
```

---

## 🧪 测试步骤

### 1. 测试自动切换

1. 确保钱包在以太坊主网
2. 访问支付页面
3. 连接钱包
4. 应该自动提示切换网络

### 2. 测试手动切换

1. 拒绝自动切换
2. 查看黄色警告框
3. 点击"切换到 Monad 网络"按钮
4. 验证切换成功

### 3. 测试添加网络

1. 删除钱包中的 Monad 网络配置
2. 连接钱包
3. 应该提示添加网络
4. 确认添加并切换

### 4. 测试支付按钮状态

1. 错误网络时，支付按钮应该是禁用状态
2. 切换到 Monad 后，支付按钮应该启用
3. 显示 "✓ Monad 网络" 绿色提示

---

## 📱 用户体验优化

### 自动化

✅ 连接钱包后自动检测网络  
✅ 自动尝试切换到 Monad  
✅ 网络不存在时自动添加  

### 提示清晰

✅ 明确显示当前网络和目标网络  
✅ 状态用颜色区分（绿色/黄色）  
✅ Toast 消息友好且有帮助  

### 用户控制

✅ 可以拒绝自动切换  
✅ 提供手动切换按钮  
✅ 错误网络时无法支付（防止错误）  

---

## 🚀 部署注意事项

### 环境变量

```bash
# 如果想指定 RPC（可选）
VITE_MONAD_RPC_URL=https://mainnet-rpc.monad.xyz

# 如果不设置，让钱包使用自己的 RPC
# VITE_MONAD_RPC_URL=
```

### 链 ID 确认

确保 `MONAD_CHAIN.id` 设置正确：
- **测试网**: 41454（请确认实际值）
- **主网**: 待确认

### 区块浏览器

确保 `blockExplorers` URL 正确，用于显示交易详情。

---

## ✅ 功能检查清单

部署前确认：

- [ ] Monad 链 ID 正确
- [ ] 链名称正确（Monad Testnet / Monad Mainnet）
- [ ] 原生代币配置正确（MON, 18 decimals）
- [ ] 区块浏览器 URL 正确
- [ ] 自动切换网络功能测试通过
- [ ] 手动切换网络功能测试通过
- [ ] 添加网络功能测试通过
- [ ] UI 状态显示正确
- [ ] Toast 提示清晰友好

---

## 📞 常见问题

### Q: 为什么要自动切换网络？
**A**: 避免用户在错误网络上尝试支付，提升用户体验。

### Q: 用户可以拒绝切换吗？
**A**: 可以。拒绝后会显示手动切换按钮，支付按钮保持禁用。

### Q: 如果钱包不支持 Monad 怎么办？
**A**: 会自动调用 `wallet_addEthereumChain` 添加网络配置。

### Q: 切换网络失败怎么办？
**A**: 显示友好的错误提示，引导用户手动操作。

---

**现在用户连接钱包后，会自动切换到 Monad 网络，体验更流畅！** 🎉
