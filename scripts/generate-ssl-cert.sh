#!/bin/bash

# 使用 OpenSSL 快速生成自签名 HTTPS 证书
# 不需要安装额外工具，但浏览器会显示警告

set -e

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

# 获取本地 IP
get_local_ip() {
    if [[ "$OSTYPE" == "darwin"* ]]; then
        ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null || echo "127.0.0.1"
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        hostname -I | awk '{print $1}' 2>/dev/null || echo "127.0.0.1"
    else
        echo "127.0.0.1"
    fi
}

print_info "🔐 生成自签名 HTTPS 证书..."

# 获取 IP
LOCAL_IP=$(get_local_ip)
print_info "检测到本地 IP: $LOCAL_IP"

# 创建证书目录
mkdir -p certs
cd certs

# 清理旧证书
rm -f localhost*.pem localhost*.csr localhost*.ext

# 生成私钥
print_info "生成私钥..."
openssl genrsa -out localhost-key.pem 2048

# 创建配置文件
print_info "创建配置文件..."
cat > localhost.ext << EOF
authorityKeyIdentifier=keyid,issuer
basicConstraints=CA:FALSE
keyUsage = digitalSignature, nonRepudiation, keyEncipherment, dataEncipherment
subjectAltName = @alt_names

[alt_names]
DNS.1 = localhost
IP.1 = 127.0.0.1
IP.2 = $LOCAL_IP
EOF

# 生成证书签名请求
print_info "生成证书签名请求..."
openssl req -new -key localhost-key.pem -out localhost.csr \
  -subj "/C=CN/ST=Beijing/L=Beijing/O=Development/CN=localhost"

# 生成自签名证书
print_info "生成自签名证书..."
openssl x509 -req -in localhost.csr \
  -signkey localhost-key.pem \
  -out localhost.pem \
  -days 365 \
  -extfile localhost.ext

# 清理临时文件
rm -f localhost.csr localhost.ext

cd ..

print_success "证书生成完成！"
echo ""
print_info "证书文件位置: ./certs/"
ls -lh certs/*.pem

echo ""
print_warning "注意事项："
echo "  1. 这是自签名证书，浏览器会显示安全警告"
echo "  2. 访问时需要点击'高级' > '继续前往'"
echo "  3. 如需浏览器信任的证书，请使用 mkcert（运行 ./scripts/setup-https.sh）"
echo ""
print_info "现在可以启动服务并使用 HTTPS 访问："
echo "  后端:   https://$LOCAL_IP:3000"
echo "  前端:   https://$LOCAL_IP:5173/5174/5176"
