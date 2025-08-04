# 🚀 Markdown + Mermaid 预览服务

一个独立的本地Markdown文件预览服务，支持Mermaid图表渲染、目录扫描和文件上传功能。

## ✨ 功能特性

- 🔍 **本地目录扫描**: 自动扫描指定目录下的所有Markdown文件
- 📤 **手动文件上传**: 支持直接上传Markdown文件进行预览
- 🎨 **Mermaid图表渲染**: 完美支持各种Mermaid图表类型
- 🌐 **Web界面**: 现代化的响应式Web界面
- ⚡ **实时预览**: 即时预览Markdown内容
- 📱 **移动端适配**: 支持移动设备访问

## 🛠️ 安装和使用

### 1. 安装依赖

```bash
cd /Users/andy/project/markdown-mermaid-preview
npm install
```

### 2. 启动服务

```bash
# 生产模式
npm start

# 开发模式（自动重启）
npm run dev
```

### 3. 访问服务

打开浏览器访问: http://localhost:3003

## 📖 使用说明

### 扫描本地目录

1. 在"扫描本地目录"部分输入要扫描的目录路径
2. 点击"🔍 扫描目录"按钮
3. 系统会自动扫描该目录及子目录下的所有`.md`文件
4. 点击文件列表中的"👁️ 预览"按钮查看文件内容

**示例路径:**
- `/Users/username/Documents/markdown-files`
- `/Users/username/Documents`
- `/Users/username/Desktop`

### 手动指定文件

1. 在"手动指定文件"部分点击"选择文件"
2. 选择一个或多个`.md`文件
3. 点击"📤 上传并预览"按钮
4. 系统会上传文件并提供预览链接

## 🎯 支持的Mermaid图表类型

- 📊 **流程图 (Flowchart)**
- 📈 **时序图 (Sequence Diagram)**
- 🏗️ **类图 (Class Diagram)**
- 📅 **甘特图 (Gantt Chart)**
- 🍰 **饼图 (Pie Chart)**
- 🌳 **Git图 (Git Graph)**
- 🗺️ **用户旅程图 (User Journey)**
- 📋 **状态图 (State Diagram)**
- 🔄 **实体关系图 (ER Diagram)**

## 🔧 技术栈

- **后端**: Node.js + Express
- **Markdown解析**: marked
- **图表渲染**: Mermaid.js
- **文件上传**: multer
- **文件系统**: fs-extra
- **前端**: 原生HTML/CSS/JavaScript

## 📁 项目结构

```
markdown-mermaid-preview/
├── server.js          # 主服务器文件
├── package.json       # 项目配置和依赖
├── README.md         # 项目说明文档
├── uploads/          # 上传文件临时目录
└── node_modules/     # 依赖包目录
```

## ⚙️ 配置选项

### 环境变量

- `PORT`: 服务器端口号（默认: 3003）

### 自定义配置

可以在`server.js`中修改以下配置:

```javascript
// 端口配置
const PORT = process.env.PORT || 3003;

// Mermaid主题配置
mermaid.initialize({
    startOnLoad: true,
    theme: 'default',        // 可选: default, dark, forest, neutral
    securityLevel: 'loose',
    fontFamily: 'Arial, sans-serif'
});
```

## 🚀 部署建议

### 本地开发

```bash
# 克隆或复制项目到本地
cp -r /Users/andy/project/markdown-mermaid-preview ~/my-markdown-preview
cd ~/my-markdown-preview
npm install
npm start
```

### 生产环境

1. 使用PM2进行进程管理:

```bash
npm install -g pm2
pm2 start server.js --name "markdown-preview"
```

2. 使用Nginx反向代理:

```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    location / {
        proxy_pass http://localhost:3003;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## 🔒 安全注意事项

- 本服务主要用于本地开发和预览
- 如需在生产环境使用，请添加适当的身份验证和访问控制
- 上传的文件存储在临时目录，建议定期清理
- 扫描功能仅限于指定目录，避免访问敏感系统文件

## 🐛 故障排除

### 常见问题

1. **端口被占用**
   ```bash
   # 查找占用端口的进程
   lsof -i :3003
   # 杀死进程
   kill -9 <PID>
   ```

2. **Mermaid图表不显示**
   - 检查网络连接（需要加载CDN资源）
   - 确认Mermaid语法正确
   - 查看浏览器控制台错误信息

3. **文件扫描失败**
   - 确认路径存在且有读取权限
   - 检查路径格式是否正确
   - 避免扫描系统保护目录

4. **文件上传失败**
   - 确认文件格式为`.md`或`.markdown`
   - 检查文件大小限制
   - 确认uploads目录存在且有写入权限

## 📝 更新日志

### v1.0.0 (2024-01-XX)
- ✅ 初始版本发布
- ✅ 支持本地目录扫描
- ✅ 支持手动文件上传
- ✅ 完整的Mermaid图表支持
- ✅ 现代化Web界面
- ✅ 移动端适配

## 🤝 贡献

欢迎提交Issue和Pull Request来改进这个项目！

## 📞 联系方式

如果您有任何问题、建议或想要交流技术话题，欢迎通过以下方式联系我：

- 💼 **LinkedIn**: [Yong Wang](https://www.linkedin.com/in/yong-wang-019783359/)
- 📧 **技术交流**: 欢迎在LinkedIn上联系讨论技术问题
- 🐛 **Bug报告**: 请在GitHub Issues中提交
- 💡 **功能建议**: 欢迎通过Issues或LinkedIn分享您的想法

## 📄 许可证

MIT License - 详见LICENSE文件

---

**享受Markdown预览的乐趣！** 🎉