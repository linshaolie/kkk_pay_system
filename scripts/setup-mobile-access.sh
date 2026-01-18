#!/bin/bash

# 获取本机 IP
if [[ "$OSTYPE" == "darwin"* ]]; then
    IP=$(ipconfig getifaddr en0)
    if [ -z "$IP" ]; then
        IP=$(ipconfig getifaddr en1)
    fi
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    IP=$(hostname -I | awk '{print $1}')
else
    IP=$(ipconfig | grep -i "IPv4" | head -1 | awk '{print $NF}')
fi

if [ -z "$IP" ]; then
    echo "无法检测 IP，请手动配置"
    exit 1
fi

echo "检测到 IP: $IP"
echo "正在生成配置文件..."

# 创建前端配置文件
mkdir -p frontend/merchant-mobile
cat > frontend/merchant-mobile/.env << EOF
VITE_API_URL=http://$IP:3000/api
VITE_SOCKET_URL=http://$IP:3000
EOF

mkdir -p frontend/merchant-desktop
cat > frontend/merchant-desktop/.env << EOF
VITE_API_URL=http://$IP:3000/api
VITE_SOCKET_URL=http://$IP:3000
VITE_PAYMENT_URL=http://$IP:5175
EOF

mkdir -p frontend/user-payment
cat > frontend/user-payment/.env << EOF
VITE_API_URL=http://$IP:3000/api
VITE_MONAD_RPC_URL=https://testnet-rpc.monad.xyz
VITE_CONTRACT_ADDRESS=0xba53E893Ba76B8971E913d2fB83970aC7CC7a25E
VITE_WALLET_CONNECT_PROJECT_ID=1fba176f84da8ad01ca69caa0074f292
EOF

# 更新后端配置
if [ -f backend/.env ]; then
    # 如果文件存在，更新相关行
    sed -i.bak "s|MOBILE_URL=.*|MOBILE_URL=http://$IP:5173|" backend/.env
    sed -i.bak "s|DESKTOP_URL=.*|DESKTOP_URL=http://$IP:5174|" backend/.env
    sed -i.bak "s|PAYMENT_URL=.*|PAYMENT_URL=http://$IP:5175|" backend/.env
    rm backend/.env.bak
else
    # 如果文件不存在，创建新文件
    cat > backend/.env << EOF
PORT=3000
NODE_ENV=development
JWT_SECRET=kkk_pos_secret_key_2026
MONAD_RPC_URL=https://testnet-rpc.monad.xyz
CONTRACT_ADDRESS=
MOBILE_URL=http://$IP:5173
DESKTOP_URL=http://$IP:5174
PAYMENT_URL=http://$IP:5175
EOF
fi

echo ""
echo "✅ 配置文件已生成！"
echo ""
echo "📱 手机访问地址："
echo "   商家手机端: http://$IP:5173"
echo "   用户支付端: http://$IP:5175"
echo ""
echo "💻 电脑访问地址："
echo "   商家电脑端: http://$IP:5174"
echo ""
echo "⚠️  重要提示："
echo "   1. 确保手机和电脑在同一 WiFi"
echo "   2. 重启所有服务使配置生效"
echo "   3. 关闭防火墙或允许端口访问"
echo ""
