#!/bin/bash

# 获取本机 IP 地址
echo "🔍 正在检测本机 IP 地址..."
echo ""

# macOS
if [[ "$OSTYPE" == "darwin"* ]]; then
    IP=$(ipconfig getifaddr en0)
    if [ -z "$IP" ]; then
        IP=$(ipconfig getifaddr en1)
    fi
# Linux
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    IP=$(hostname -I | awk '{print $1}')
# Windows (Git Bash)
else
    IP=$(ipconfig | grep -i "IPv4" | head -1 | awk '{print $NF}')
fi

if [ -z "$IP" ]; then
    echo "❌ 无法自动检测 IP 地址"
    echo "请手动查找您的 IP 地址："
    echo "  macOS: 系统偏好设置 > 网络"
    echo "  Windows: 运行 ipconfig"
    echo "  Linux: 运行 hostname -I"
    exit 1
fi

echo "✅ 检测到本机 IP: $IP"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📱 手机访问地址："
echo ""
echo "  商家手机端: http://$IP:5173"
echo "  商家电脑端: http://$IP:5174"
echo "  用户支付端: http://$IP:5175"
echo "  后端 API:   http://$IP:3000"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🔧 配置步骤："
echo ""
echo "1. 更新前端配置文件："
echo ""
echo "   📝 frontend/merchant-mobile/.env"
echo "   VITE_API_URL=http://$IP:3000/api"
echo "   VITE_SOCKET_URL=http://$IP:3000"
echo ""
echo "   📝 frontend/merchant-desktop/.env"
echo "   VITE_API_URL=http://$IP:3000/api"
echo "   VITE_SOCKET_URL=http://$IP:3000"
echo "   VITE_PAYMENT_URL=http://$IP:5175"
echo ""
echo "   📝 frontend/user-payment/.env"
echo "   VITE_API_URL=http://$IP:3000/api"
echo ""
echo "2. 更新后端配置文件："
echo ""
echo "   📝 backend/.env"
echo "   MOBILE_URL=http://$IP:5173"
echo "   DESKTOP_URL=http://$IP:5174"
echo "   PAYMENT_URL=http://$IP:5175"
echo ""
echo "3. 重启所有服务"
echo ""
echo "4. 确保手机和电脑在同一 WiFi 网络"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🔥 快速配置（自动生成配置文件）："
echo ""
echo "   ./scripts/setup-mobile-access.sh"
echo ""
