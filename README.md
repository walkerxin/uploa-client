# 文件上传下载客户端

基于 Vue 3 + Element Plus 构建的现代化文件传输工具，支持小文件快速上传、大文件断点续传和文件下载功能。

## ✨ 特性

- 🚀 **快速上传** - 小文件直接上传，速度快
- 🔄 **断点续传** - 大文件分片上传，支持断点续传
- ⬇️ **高速下载** - 文件下载with进度显示
- 🎨 **现代UI** - 基于Element Plus的美观界面
- 📱 **响应式** - 完美适配桌面和移动设备
- 📊 **实时监控** - 实时显示传输进度和速度

## 🛠️ 技术栈

- **前端框架**: Vue 3 + Composition API
- **构建工具**: Vite
- **UI组件库**: Element Plus
- **状态管理**: Pinia
- **HTTP客户端**: Axios
- **文件处理**: spark-md5 (文件哈希计算)
- **路由**: Vue Router 4

## 📦 安装

### 前置要求

- Node.js >= 20.19.0 或 >= 22.12.0
- npm 或 yarn

### 克隆项目

```bash
git clone <repository-url>
cd file-upload-client
```

### 安装依赖

```bash
npm install
```

## 🚀 开发

启动开发服务器：

```bash
npm run dev
```

默认在 `http://localhost:3000` 打开应用。

## 🏗️ 构建

构建生产版本：

```bash
npm run build
```

预览构建结果：

```bash
npm run preview
```

## 📝 配置

### API配置

在 `src/api/config.js` 中配置API相关信息：

```javascript
export const API_CONFIG = {
  baseURL: 'https://api.halome.cc', // 修改为实际API地址
  token: '1b1427d1c3a88c308a0e0b3d61cf337e', // 您的API token
  timeout: 30000,
  chunkSize: 2 * 1024 * 1024, // 2MB 分片大小
}
```

### 上传设置

- **自动模式**: 根据文件大小自动选择上传方式
  - 小于10MB: 直接上传
  - 大于10MB: 分片上传
- **普通上传**: 适合小文件，直接上传
- **分片上传**: 适合大文件，支持断点续传

## 📚 功能说明

### 文件上传

1. **拖拽上传**: 将文件拖拽到上传区域
2. **点击选择**: 点击上传区域选择文件
3. **批量上传**: 支持同时选择多个文件
4. **进度监控**: 实时显示上传进度和速度
5. **暂停/继续**: 支持暂停和继续上传
6. **断点续传**: 大文件自动分片，支持断点续传

### 文件下载

1. **文件列表**: 显示可下载的文件列表
2. **搜索过滤**: 支持按文件名搜索
3. **文件预览**: 支持图片和文本文件预览
4. **下载管理**: 显示下载进度，支持暂停/继续
5. **批量操作**: 支持批量暂停和清理

### 界面功能

1. **首页**: 显示使用统计和最近活动
2. **文件图标**: 根据文件类型显示不同图标
3. **响应式**: 适配不同屏幕尺寸
4. **主题**: 现代化渐变设计

## 🔧 API接口

本项目需要后端API支持以下功能：

### 小文件上传
```http
POST /add
Content-Type: multipart/form-data

file: <文件>
```

### 分片上传相关

#### 检查文件是否存在
```http
GET /check-file?fileName=<文件名>&fileHash=<文件哈希>
```

#### 上传分片
```http
POST /addLargeFile
Content-Type: multipart/form-data

chunk: <分片数据>
chunkIndex: <分片索引>
fileHash: <文件哈希>
fileName: <文件名>
totalChunks: <总分片数>
```

#### 合并分片
```http
POST /merge-chunks
Content-Type: application/json

{
  "fileHash": "<文件哈希>",
  "fileName": "<文件名>",
  "totalChunks": <总分片数>
}
```

### 文件下载

#### 获取文件列表
```http
GET /files
```

#### 下载文件
```http
GET /cat?id=<fileId>
```

## 🎯 使用说明

### 1. 上传文件

1. 进入"文件上传"页面
2. 选择上传模式（推荐使用"自动选择"）
3. 拖拽文件到上传区域或点击选择文件
4. 文件自动添加到上传列表
5. 点击"开始"按钮开始上传
6. 可以随时暂停、继续或删除上传任务

### 2. 下载文件

1. 进入"文件下载"页面
2. 查看可下载文件列表
3. 使用搜索框查找特定文件
4. 点击"下载"按钮开始下载
5. 在下载列表中查看下载进度
6. 支持暂停、继续和重试下载

### 3. 文件管理

- 支持多种文件类型：图片、视频、文档等
- 自动识别文件类型并显示对应图标
- 显示文件大小、上传时间等信息
- 支持文件预览功能

## 🔍 浏览器支持

- Chrome >= 90
- Firefox >= 88
- Safari >= 14
- Edge >= 90

## 📖 开发指南

### 项目结构

```
src/
├── api/           # API接口
├── components/    # 公共组件
├── router/        # 路由配置
├── stores/        # 状态管理
├── utils/         # 工具函数
├── views/         # 页面组件
├── App.vue        # 根组件
└── main.js        # 入口文件
```

### 添加新功能

1. 在 `src/views/` 中创建新的页面组件
2. 在 `src/router/index.js` 中添加路由
3. 在 `src/api/` 中添加相关API接口
4. 使用 Pinia store 管理状态

## 🤝 贡献

欢迎提交 Issue 和 Pull Request 来改进这个项目。

## 📄 许可证

MIT License

## 🙏 致谢

- [Vue.js](https://vuejs.org/) - 渐进式JavaScript框架
- [Element Plus](https://element-plus.org/) - 基于Vue 3的组件库
- [Vite](https://vitejs.dev/) - 下一代前端构建工具
- [Pinia](https://pinia.vuejs.org/) - Vue状态管理库
