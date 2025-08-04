const express = require('express');
const fs = require('fs-extra');
const path = require('path');
const { marked } = require('marked');
const multer = require('multer');

const app = express();
const PORT = process.env.PORT || 3003;

// 配置multer用于文件上传
const upload = multer({ dest: 'uploads/' });

// 静态文件服务
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 配置marked以支持Mermaid
marked.setOptions({
  highlight: function(code, lang) {
    if (lang === 'mermaid') {
      return `<div class="mermaid">${code}</div>`;
    }
    return code;
  },
  breaks: true,
  gfm: true
});

// 自定义渲染器处理Mermaid代码块
const renderer = new marked.Renderer();
const originalCode = renderer.code;

renderer.code = function(code, language, escaped) {
  if (language === 'mermaid') {
    return `<div class="mermaid">${code}</div>`;
  }
  return originalCode.call(this, code, language, escaped);
};

// 扫描指定目录下的Markdown文件
function scanMarkdownFiles(dirPath) {
  const files = [];
  
  function scanDir(currentPath) {
    try {
      const items = fs.readdirSync(currentPath);
      
      for (const item of items) {
        const fullPath = path.join(currentPath, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          // 跳过隐藏目录和node_modules
          if (!item.startsWith('.') && item !== 'node_modules') {
            scanDir(fullPath);
          }
        } else if (stat.isFile() && item.toLowerCase().endsWith('.md')) {
          const relativePath = path.relative(dirPath, fullPath);
          files.push({
            name: item,
            path: fullPath,
            relativePath: relativePath,
            size: stat.size,
            modified: stat.mtime
          });
        }
      }
    } catch (error) {
      console.error(`扫描目录 ${currentPath} 时出错:`, error.message);
    }
  }
  
  if (fs.existsSync(dirPath)) {
    scanDir(dirPath);
  }
  
  return files.sort((a, b) => a.relativePath.localeCompare(b.relativePath));
}

// 生成预览页面HTML
function generatePreviewPage(filePath, htmlContent) {
  const fileName = path.basename(filePath);
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>预览: ${fileName}</title>
    <script src="https://cdn.jsdelivr.net/npm/mermaid@10.6.1/dist/mermaid.min.js"></script>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f8f9fa;
        }
        
        .header {
            background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
            color: white;
            padding: 20px;
            border-radius: 10px;
            margin-bottom: 30px;
            text-align: center;
        }
        
        .content {
            background: white;
            padding: 40px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        
        .mermaid {
            text-align: center;
            margin: 20px 0;
            padding: 20px;
            background: #f8f9fa;
            border-radius: 8px;
            border: 1px solid #e9ecef;
        }
        
        pre {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 8px;
            overflow-x: auto;
            border-left: 4px solid #4facfe;
        }
        
        code {
            background: #e9ecef;
            padding: 2px 6px;
            border-radius: 4px;
            font-family: 'Monaco', 'Consolas', monospace;
        }
        
        pre code {
            background: none;
            padding: 0;
        }
        
        h1, h2, h3, h4, h5, h6 {
            color: #333;
            margin-top: 30px;
            margin-bottom: 15px;
        }
        
        h1 {
            border-bottom: 2px solid #4facfe;
            padding-bottom: 10px;
        }
        
        h2 {
            border-bottom: 1px solid #e9ecef;
            padding-bottom: 8px;
        }
        
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
        }
        
        th, td {
            border: 1px solid #ddd;
            padding: 12px;
            text-align: left;
        }
        
        th {
            background: #f8f9fa;
            font-weight: 600;
        }
        
        blockquote {
            border-left: 4px solid #4facfe;
            margin: 20px 0;
            padding: 10px 20px;
            background: #f8f9fa;
            border-radius: 0 8px 8px 0;
        }
        
        .back-btn {
            background: #6c757d;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 5px;
            cursor: pointer;
            margin-bottom: 20px;
            text-decoration: none;
            display: inline-block;
        }
        
        .back-btn:hover {
            background: #5a6268;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>📄 ${fileName}</h1>
        <p>文件路径: ${filePath}</p>
    </div>
    
    <a href="/" class="back-btn">← 返回首页</a>
    
    <div class="content">
        ${htmlContent}
    </div>
    
    <script>
        mermaid.initialize({
            startOnLoad: true,
            theme: 'default',
            securityLevel: 'loose',
            fontFamily: 'Arial, sans-serif'
        });
        
        document.addEventListener('DOMContentLoaded', function() {
            mermaid.init();
        });
    </script>
</body>
</html>`;
}

// 主页面
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// API: 扫描目录
app.post('/api/scan', (req, res) => {
  const { path: scanPath } = req.body;
  
  if (!scanPath) {
    return res.json({ success: false, error: '请提供要扫描的路径' });
  }
  
  if (!fs.existsSync(scanPath)) {
    return res.json({ success: false, error: '指定的路径不存在' });
  }
  
  try {
    const files = scanMarkdownFiles(scanPath);
    res.json({ success: true, files });
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

// API: 上传文件
app.post('/api/upload', upload.array('files'), (req, res) => {
  try {
    const files = req.files.map(file => ({
      filename: file.filename,
      originalName: file.originalname,
      path: file.path
    }));
    
    res.json({ success: true, files });
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

// 预览本地文件
app.get('/preview', (req, res) => {
  const filePath = decodeURIComponent(req.query.file);
  
  if (!filePath || !fs.existsSync(filePath)) {
    return res.status(404).send('文件不存在');
  }
  
  try {
    const markdownContent = fs.readFileSync(filePath, 'utf8');
    const htmlContent = marked(markdownContent, { renderer: renderer });
    
    res.send(generatePreviewPage(filePath, htmlContent));
  } catch (error) {
    res.status(500).send('读取文件失败: ' + error.message);
  }
});

// 预览上传的文件
app.get('/preview-upload', (req, res) => {
  const filename = req.query.file;
  const filePath = path.join(__dirname, 'uploads', filename);
  
  if (!filename || !fs.existsSync(filePath)) {
    return res.status(404).send('文件不存在');
  }
  
  try {
    const markdownContent = fs.readFileSync(filePath, 'utf8');
    const htmlContent = marked(markdownContent, { renderer: renderer });
    
    res.send(generatePreviewPage(filename, htmlContent));
  } catch (error) {
    res.status(500).send('读取文件失败: ' + error.message);
  }
});

// 启动服务器
app.listen(PORT, () => {
  console.log('\n🚀 Markdown + Mermaid 预览服务已启动!');
  console.log(`📍 访问地址: http://localhost:${PORT}`);
  console.log('\n💡 功能特性:');
  console.log('   ✅ 本地目录扫描');
  console.log('   ✅ 手动文件上传');
  console.log('   ✅ Mermaid图表渲染');
  console.log('   ✅ 实时预览');
  console.log('\n按 Ctrl+C 停止服务器\n');
});

// 优雅关闭
process.on('SIGINT', () => {
  console.log('\n👋 服务器正在关闭...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n👋 服务器正在关闭...');
  process.exit(0);
});