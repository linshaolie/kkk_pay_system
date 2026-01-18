# 前端访问问题诊断

## 当前状态
- 前端服务器: 运行在 https://localhost:5175
- 后端服务器: 运行在 http://localhost:3000

## 如果页面空白，请按以下步骤检查：

### 1. 打开浏览器开发者工具
- 按 `F12` 或 `Cmd+Option+I` (Mac) / `Ctrl+Shift+I` (Windows)
- 查看 **Console（控制台）** 标签页
- 查看是否有红色错误信息

### 2. 检查常见错误

#### 错误 1: HTTPS 证书警告
**现象**: 浏览器显示"您的连接不是私密连接"
**解决**: 点击"高级" -> "继续访问 localhost（不安全）"

#### 错误 2: CORS 错误
**现象**: 控制台显示 `CORS policy` 相关错误
**解决**: 检查后端 CORS 配置

#### 错误 3: 模块加载错误
**现象**: 控制台显示 `Failed to fetch dynamically imported module`
**解决**: 清除浏览器缓存，硬刷新 (Cmd+Shift+R / Ctrl+Shift+R)

#### 错误 4: Wagmi 配置错误
**现象**: 控制台显示 wagmi 相关错误
**解决**: 检查网络连接和 RPC URL 配置

### 3. 测试页面
访问以下 URL 进行测试：
- 首页: https://localhost:5175/
- 测试页: https://localhost:5175/test
- 支付页: https://localhost:5175/pay/测试订单ID

### 4. 网络检查
```bash
# 检查端口是否监听
lsof -ti:5175

# 测试 HTTPS 连接
curl -k https://localhost:5175
```

### 5. 清除缓存
- 浏览器: 清除缓存和 Cookie
- Vite: 删除 `node_modules/.vite` 目录
- 重新安装: `rm -rf node_modules && npm install`

## 如果仍然无法访问

请提供以下信息：
1. 浏览器控制台的完整错误信息
2. 网络标签页中的失败请求
3. 访问的具体 URL
4. 浏览器类型和版本
