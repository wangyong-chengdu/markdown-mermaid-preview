#!/bin/bash

# Markdown + Mermaid 预览服务启动脚本

echo "🚀 正在启动 Markdown + Mermaid 预览服务..."
echo ""

# 检查Node.js是否安装
if ! command -v node &> /dev/null; then
    echo "❌ 错误: 未找到Node.js，请先安装Node.js"
    echo "   下载地址: https://nodejs.org/"
    exit 1
fi

# 检查npm是否安装
if ! command -v npm &> /dev/null; then
    echo "❌ 错误: 未找到npm，请先安装npm"
    exit 1
fi

# 获取脚本所在目录
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
cd "$SCRIPT_DIR"

echo "📁 工作目录: $SCRIPT_DIR"
echo ""

# 检查package.json是否存在
if [ ! -f "package.json" ]; then
    echo "❌ 错误: 未找到package.json文件"
    exit 1
fi

# 检查node_modules是否存在，如果不存在则安装依赖
if [ ! -d "node_modules" ]; then
    echo "📦 正在安装依赖包..."
    npm install
    if [ $? -ne 0 ]; then
        echo "❌ 依赖安装失败"
        exit 1
    fi
    echo "✅ 依赖安装完成"
    echo ""
fi

# 创建uploads目录（如果不存在）
if [ ! -d "uploads" ]; then
    mkdir -p uploads
    echo "📁 创建uploads目录"
fi

# 显示启动信息
echo "🎯 启动信息:"
echo "   - 服务名称: Markdown + Mermaid 预览服务"
echo "   - 访问地址: http://localhost:3003"
echo "   - 停止服务: 按 Ctrl+C"
echo ""
echo "💡 功能特性:"
echo "   ✅ 本地目录扫描"
echo "   ✅ 手动文件上传"
echo "   ✅ Mermaid图表渲染"
echo "   ✅ 实时预览"
echo ""
echo "🔥 正在启动服务器..."
echo "="*50

# 启动服务
npm start