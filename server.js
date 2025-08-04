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

// 解析标题生成目录
function generateTableOfContents(htmlContent) {
  const headingRegex = /<h([1-6])([^>]*)>([^<]+)<\/h[1-6]>/g;
  const headings = [];
  let match;
  let counter = 0;
  
  while ((match = headingRegex.exec(htmlContent)) !== null) {
    const level = parseInt(match[1]);
    const attributes = match[2];
    const text = match[3].trim();
    const id = `heading-${counter++}`;
    
    headings.push({
      level,
      text,
      id
    });
  }
  
  return headings;
}

// 为标题添加ID属性
function addHeadingIds(htmlContent) {
  let counter = 0;
  return htmlContent.replace(/<h([1-6])([^>]*)>([^<]+)<\/h[1-6]>/g, (match, level, attributes, text) => {
    const id = `heading-${counter++}`;
    return `<h${level}${attributes} id="${id}">${text}</h${level}>`;
  });
}

// 生成预览页面HTML
function generatePreviewPage(filePath, htmlContent) {
  const fileName = path.basename(filePath);
  const processedHtml = addHeadingIds(htmlContent);
  const toc = generateTableOfContents(processedHtml);
  
  // 生成目录HTML
  const tocHtml = toc.length > 0 ? toc.map(heading => {
    const indent = '  '.repeat(Math.max(0, heading.level - 1));
    return `${indent}<li class="toc-level-${heading.level}"><a href="#${heading.id}" onclick="scrollToHeading('${heading.id}')">${heading.text}</a></li>`;
  }).join('\n') : '<li class="toc-empty">📭 未找到标题</li>';
  
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
            margin: 0;
            padding: 0;
            background-color: #f8f9fa;
            display: flex;
            min-height: 100vh;
        }
        
        .sidebar {
            width: 300px;
            background: white;
            border-right: 1px solid #e9ecef;
            padding: 20px;
            position: fixed;
            height: 100vh;
            overflow-y: auto;
            box-shadow: 2px 0 5px rgba(0,0,0,0.1);
        }
        
        .sidebar-header {
            background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
            color: white;
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 20px;
            text-align: center;
        }
        
        .sidebar-header h3 {
            margin: 0;
            font-size: 1.1em;
            font-weight: 500;
        }
        
        .toc {
            list-style: none;
            padding: 0;
            margin: 0;
        }
        
        .toc li {
            margin: 0;
            padding: 0;
        }
        
        .toc a {
            display: block;
            padding: 8px 12px;
            color: #495057;
            text-decoration: none;
            border-radius: 6px;
            transition: all 0.2s ease;
            font-size: 14px;
            line-height: 1.4;
        }
        
        .toc a:hover {
            background: #e9ecef;
            color: #4facfe;
        }
        
        .toc a.active {
            background: #4facfe;
            color: white;
            font-weight: 600;
        }
        
        .toc-level-1 a {
            font-weight: 600;
            color: #212529;
        }
        
        .toc-level-2 a {
            padding-left: 24px;
            font-weight: 500;
        }
        
        .toc-level-3 a {
            padding-left: 36px;
        }
        
        .toc-level-4 a {
            padding-left: 48px;
            font-size: 13px;
        }
        
        .toc-level-5 a {
            padding-left: 60px;
            font-size: 13px;
        }
        
        .toc-level-6 a {
            padding-left: 72px;
            font-size: 12px;
        }
        
        .toc-empty {
            color: #6c757d;
            font-style: italic;
            padding: 12px;
            text-align: center;
        }
        
        .main-content {
            flex: 1;
            margin-left: 300px;
            padding: 20px;
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
    <div class="sidebar">
        <div class="sidebar-header">
            <h3>📑 章节导航</h3>
        </div>
        <ul class="toc">
            ${tocHtml}
        </ul>
    </div>
    
    <div class="main-content">
        <div class="header">
            <h1>📄 ${fileName}</h1>
            <p>文件路径: ${filePath}</p>
        </div>
        
        <a href="/" class="back-btn">← 返回首页</a>
        
        <div class="content">
            ${processedHtml}
        </div>
    </div>
    
    <script>
        mermaid.initialize({
            startOnLoad: true,
            theme: 'default',
            securityLevel: 'loose',
            fontFamily: 'Arial, sans-serif'
        });
        
        function scrollToHeading(headingId) {
            const element = document.getElementById(headingId);
            if (element) {
                element.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
                
                // 高亮当前章节
                document.querySelectorAll('.toc a').forEach(a => a.classList.remove('active'));
                document.querySelector('a[href="#' + headingId + '"]').classList.add('active');
            }
        }
        
        // 监听滚动事件，自动高亮当前章节
        function updateActiveHeading() {
            const headings = document.querySelectorAll('h1[id], h2[id], h3[id], h4[id], h5[id], h6[id]');
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            
            let activeHeading = null;
            for (let i = headings.length - 1; i >= 0; i--) {
                const heading = headings[i];
                if (heading.offsetTop <= scrollTop + 100) {
                    activeHeading = heading;
                    break;
                }
            }
            
            document.querySelectorAll('.toc a').forEach(a => a.classList.remove('active'));
             if (activeHeading) {
                 const activeLink = document.querySelector('a[href="#' + activeHeading.id + '"]');
                 if (activeLink) {
                     activeLink.classList.add('active');
                 }
             }
        }
        
        document.addEventListener('DOMContentLoaded', function() {
            mermaid.init();
            
            // 初始化时更新活动标题
            updateActiveHeading();
            
            // 监听滚动事件
            window.addEventListener('scroll', updateActiveHeading);
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