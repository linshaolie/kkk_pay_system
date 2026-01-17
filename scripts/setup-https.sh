#!/bin/bash

# HTTPS 证书配置脚本
# 用于为 KKK POS 本地开发环境生成 HTTPS 证书

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 打印带颜色的消息
print_info() {
    echo -e "${BLUE}ℹ ${NC}$1"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_header() {
    echo -e "\n${BLUE}═══════════════════════════════════════${NC}"
    echo -e "${BLUE}  $1${NC}"
    echo -e "${BLUE}═══════════════════════════════════════${NC}\n"
}

# 检测操作系统
detect_os() {
    if [[ "$OSTYPE" == "darwin"* ]]; then
        echo "macos"
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        echo "linux"
    elif [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "cygwin" ]]; then
        echo "windows"
    else
        echo "unknown"
    fi
}

# 获取本地 IP
get_local_ip() {
    OS=$(detect_os)
    
    if [ "$OS" == "macos" ]; then
        # macOS
        ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null || echo "127.0.0.1"
    elif [ "$OS" == "linux" ]; then
        # Linux
        hostname -I | awk '{print $1}' 2>/dev/null || echo "127.0.0.1"
    elif [ "$OS" == "windows" ]; then
        # Windows (Git Bash)
        ipconfig | grep -im1 'IPv4' | cut -d ':' -f2 | tr -d ' ' || echo "127.0.0.1"
    else
        echo "127.0.0.1"
    fi
}

# 检查 mkcert 是否安装
check_mkcert() {
    if command -v mkcert &> /dev/null; then
        print_success "mkcert 已安装"
        return 0
    else
        print_warning "mkcert 未安装"
        return 1
    fi
}

# 安装 mkcert
install_mkcert() {
    OS=$(detect_os)
    
    print_header "安装 mkcert"
    
    if [ "$OS" == "macos" ]; then
        if command -v brew &> /dev/null; then
            print_info "使用 Homebrew 安装 mkcert..."
            brew install mkcert
            brew install nss  # Firefox 支持
        else
            print_error "请先安装 Homebrew: https://brew.sh"
            return 1
        fi
    elif [ "$OS" == "linux" ]; then
        print_info "检测 Linux 发行版..."
        if [ -f /etc/debian_version ]; then
            print_info "检测到 Debian/Ubuntu，使用 apt 安装..."
            sudo apt update
            sudo apt install -y libnss3-tools wget
            wget https://github.com/FiloSottile/mkcert/releases/download/v1.4.4/mkcert-v1.4.4-linux-amd64
            chmod +x mkcert-v1.4.4-linux-amd64
            sudo mv mkcert-v1.4.4-linux-amd64 /usr/local/bin/mkcert
        elif [ -f /etc/arch-release ]; then
            print_info "检测到 Arch Linux，使用 pacman 安装..."
            sudo pacman -S mkcert
        else
            print_warning "未识别的 Linux 发行版，请手动安装 mkcert"
            print_info "访问: https://github.com/FiloSottile/mkcert"
            return 1
        fi
    elif [ "$OS" == "windows" ]; then
        print_warning "Windows 用户请手动安装 mkcert："
        print_info "使用 Chocolatey: choco install mkcert"
        print_info "或使用 Scoop: scoop bucket add extras && scoop install mkcert"
        print_info "或下载: https://github.com/FiloSottile/mkcert/releases"
        return 1
    else
        print_error "未知操作系统"
        return 1
    fi
    
    print_success "mkcert 安装完成"
}

# 初始化 mkcert
init_mkcert() {
    print_header "初始化 mkcert"
    
    print_info "安装本地证书颁发机构..."
    mkcert -install
    
    print_success "mkcert 初始化完成"
    print_info "根证书位置: $(mkcert -CAROOT)"
}

# 生成证书
generate_certs() {
    print_header "生成 HTTPS 证书"
    
    # 获取 IP
    LOCAL_IP=$(get_local_ip)
    print_info "检测到本地 IP: $LOCAL_IP"
    
    # 创建证书目录
    CERT_DIR="./certs"
    if [ ! -d "$CERT_DIR" ]; then
        mkdir -p "$CERT_DIR"
        print_success "创建证书目录: $CERT_DIR"
    fi
    
    cd "$CERT_DIR"
    
    # 删除旧证书
    if ls *.pem 1> /dev/null 2>&1; then
        print_info "删除旧证书..."
        rm -f *.pem
    fi
    
    # 生成新证书
    print_info "生成证书（包括 localhost 和 $LOCAL_IP）..."
    mkcert localhost 127.0.0.1 "$LOCAL_IP" ::1
    
    print_success "证书生成完成！"
    print_info "证书文件:"
    ls -lh *.pem
    
    cd ..
}

# 更新环境配置
update_env_config() {
    print_header "更新环境配置"
    
    LOCAL_IP=$(get_local_ip)
    
    # 更新后端配置
    BACKEND_ENV="./backend/.env"
    if [ -f "$BACKEND_ENV" ]; then
        print_info "更新后端配置..."
        
        # 备份原配置
        cp "$BACKEND_ENV" "${BACKEND_ENV}.backup"
        
        # 更新配置
        if grep -q "USE_HTTPS=" "$BACKEND_ENV"; then
            sed -i.bak "s|USE_HTTPS=.*|USE_HTTPS=true|g" "$BACKEND_ENV"
        else
            echo -e "\n# HTTPS 配置" >> "$BACKEND_ENV"
            echo "USE_HTTPS=true" >> "$BACKEND_ENV"
        fi
        
        # 更新 URL
        sed -i.bak "s|http://|https://|g" "$BACKEND_ENV"
        sed -i.bak "s|https://localhost|https://$LOCAL_IP|g" "$BACKEND_ENV"
        
        rm -f "${BACKEND_ENV}.bak"
        
        print_success "后端配置已更新"
    else
        print_warning "未找到后端配置文件，请手动配置"
    fi
    
    # 提示更新前端配置
    print_info "请手动更新前端 .env 文件："
    echo ""
    echo "  frontend/merchant-mobile/.env:"
    echo "  VITE_API_URL=https://$LOCAL_IP:3000/api"
    echo "  VITE_SOCKET_URL=https://$LOCAL_IP:3000"
    echo ""
    echo "  frontend/merchant-desktop/.env:"
    echo "  VITE_API_URL=https://$LOCAL_IP:3000/api"
    echo "  VITE_SOCKET_URL=https://$LOCAL_IP:3000"
    echo "  VITE_PAYMENT_URL=https://$LOCAL_IP:5175"
    echo ""
    echo "  frontend/user-payment/.env:"
    echo "  VITE_API_URL=https://$LOCAL_IP:3000/api"
    echo ""
}

# 显示手机配置说明
show_mobile_instructions() {
    print_header "手机访问配置"
    
    LOCAL_IP=$(get_local_ip)
    CA_ROOT=$(mkcert -CAROOT)
    
    print_info "要在手机上访问 HTTPS 服务，需要安装根证书："
    echo ""
    print_info "1. 根证书位置: $CA_ROOT/rootCA.pem"
    echo ""
    print_info "2. iOS 设备:"
    echo "   - 将 rootCA.pem 通过 AirDrop 发送到 iPhone"
    echo "   - 打开文件并安装描述文件"
    echo "   - 设置 > 通用 > 关于本机 > 证书信任设置"
    echo "   - 启用刚安装的根证书"
    echo ""
    print_info "3. Android 设备:"
    echo "   - 将 rootCA.pem 复制到手机"
    echo "   - 设置 > 安全 > 加密与凭据 > 从存储设备安装"
    echo "   - 选择证书文件并安装"
    echo ""
}

# 验证配置
verify_setup() {
    print_header "验证配置"
    
    # 检查证书文件
    if [ -f "./certs/localhost+3.pem" ] && [ -f "./certs/localhost+3-key.pem" ]; then
        print_success "证书文件存在"
    else
        # 检查其他可能的文件名
        if ls ./certs/*.pem 1> /dev/null 2>&1; then
            print_success "证书文件存在（文件名可能不同）"
        else
            print_error "未找到证书文件"
        fi
    fi
    
    # 检查配置文件
    if [ -f "./backend/.env" ]; then
        if grep -q "USE_HTTPS=true" "./backend/.env"; then
            print_success "后端配置已启用 HTTPS"
        else
            print_warning "后端配置未启用 HTTPS"
        fi
    fi
    
    print_info "配置验证完成"
}

# 显示下一步操作
show_next_steps() {
    print_header "下一步操作"
    
    LOCAL_IP=$(get_local_ip)
    
    echo "1. 启动服务:"
    echo "   cd backend && npm run dev"
    echo "   cd frontend/merchant-mobile && npm run dev"
    echo "   cd frontend/merchant-desktop && npm run dev"
    echo "   cd frontend/user-payment && npm run dev"
    echo ""
    echo "2. 访问服务:"
    echo "   Backend:         https://$LOCAL_IP:3000"
    echo "   商家手机端:      https://$LOCAL_IP:5173"
    echo "   商家电脑端:      https://$LOCAL_IP:5174"
    echo "   用户支付端:      https://$LOCAL_IP:5175"
    echo ""
    echo "3. 如需在手机访问，请参考上面的手机配置说明"
    echo ""
    print_success "HTTPS 配置完成！"
}

# 主函数
main() {
    clear
    
    print_header "KKK POS HTTPS 配置工具"
    
    # 检查是否在项目根目录
    if [ ! -f "package.json" ] && [ ! -f "README.md" ]; then
        print_error "请在项目根目录运行此脚本"
        exit 1
    fi
    
    # 检查并安装 mkcert
    if ! check_mkcert; then
        print_warning "需要安装 mkcert"
        read -p "是否现在安装? (y/n) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            install_mkcert || exit 1
        else
            print_error "mkcert 是必需的，请手动安装后重新运行此脚本"
            exit 1
        fi
    fi
    
    # 初始化 mkcert
    if [ ! -d "$(mkcert -CAROOT)" ]; then
        init_mkcert
    else
        print_success "mkcert 已初始化"
    fi
    
    # 生成证书
    generate_certs
    
    # 更新环境配置
    read -p "是否自动更新后端配置? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        update_env_config
    fi
    
    # 验证配置
    verify_setup
    
    # 显示手机配置说明
    show_mobile_instructions
    
    # 显示下一步操作
    show_next_steps
}

# 运行主函数
main
