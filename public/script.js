async function scanDirectory() {
    const path = document.getElementById('scanPath').value.trim();
    if (!path) {
        alert('请输入要扫描的目录路径');
        return;
    }
    
    const resultsDiv = document.getElementById('scanResults');
    resultsDiv.innerHTML = '<div class="loading">🔍 正在扫描目录...</div>';
    
    try {
        const response = await fetch('/api/scan', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ path: path })
        });
        
        const data = await response.json();
        
        if (data.success) {
            displayFileList(data.files, resultsDiv);
        } else {
            resultsDiv.innerHTML = '<div class="error">❌ ' + data.error + '</div>';
        }
    } catch (error) {
        resultsDiv.innerHTML = '<div class="error">❌ 扫描失败: ' + error.message + '</div>';
    }
}

function displayFileList(files, container) {
    if (files.length === 0) {
        container.innerHTML = '<div class="error">📭 未找到Markdown文件</div>';
        return;
    }
    
    let html = '<div class="success">✅ 找到 ' + files.length + ' 个Markdown文件</div>';
    html += '<div class="file-list">';
    
    files.forEach(function(file) {
        const fileSize = (file.size / 1024).toFixed(1);
        const modifiedDate = new Date(file.modified).toLocaleString('zh-CN');
        
        html += '<div class="file-item">';
        html += '<div class="file-info">';
        html += '<div class="file-name">📄 ' + file.name + '</div>';
        html += '<div class="file-path">' + file.relativePath + '</div>';
        html += '<div class="file-meta">大小: ' + fileSize + 'KB | 修改时间: ' + modifiedDate + '</div>';
        html += '</div>';
        html += '<button class="preview-btn" onclick="previewFile(\'' + encodeURIComponent(file.path) + '\')">';
        html += '👁️ 预览</button>';
        html += '</div>';
    });
    
    html += '</div>';
    container.innerHTML = html;
}

function previewFile(filePath) {
    const url = '/preview?file=' + filePath;
    window.open(url, '_blank');
}

function clearResults() {
    document.getElementById('scanResults').innerHTML = '';
    document.getElementById('uploadResults').innerHTML = '';
}

async function uploadFiles() {
    const fileInput = document.getElementById('fileUpload');
    const files = fileInput.files;
    
    if (files.length === 0) {
        alert('请选择要上传的Markdown文件');
        return;
    }
    
    const resultsDiv = document.getElementById('uploadResults');
    resultsDiv.innerHTML = '<div class="loading">📤 正在上传文件...</div>';
    
    const formData = new FormData();
    for (let file of files) {
        formData.append('files', file);
    }
    
    try {
        const response = await fetch('/api/upload', {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        
        if (data.success) {
            displayUploadedFiles(data.files, resultsDiv);
        } else {
            resultsDiv.innerHTML = '<div class="error">❌ ' + data.error + '</div>';
        }
    } catch (error) {
        resultsDiv.innerHTML = '<div class="error">❌ 上传失败: ' + error.message + '</div>';
    }
}

function displayUploadedFiles(files, container) {
    let html = '<div class="success">✅ 成功上传 ' + files.length + ' 个文件</div>';
    html += '<div class="file-list">';
    
    files.forEach(function(file) {
        html += '<div class="file-item">';
        html += '<div class="file-info">';
        html += '<div class="file-name">📄 ' + file.originalName + '</div>';
        html += '<div class="file-path">临时文件: ' + file.filename + '</div>';
        html += '</div>';
        html += '<button class="preview-btn" onclick="previewUploadedFile(\'' + file.filename + '\')">';
        html += '👁️ 预览</button>';
        html += '</div>';
    });
    
    html += '</div>';
    container.innerHTML = html;
}

function previewUploadedFile(filename) {
    const url = '/preview-upload?file=' + filename;
    window.open(url, '_blank');
}