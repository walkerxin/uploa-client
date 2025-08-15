<template>
  <div class="download-container">
    <!-- 文件列表 -->
    <div class="file-list-section">
      <el-card class="list-card">
        <template #header>
          <div class="card-header">
            <span>可下载文件列表</span>
            <div class="header-actions">
              <el-input
                v-model="searchKeyword"
                placeholder="搜索文件名"
                size="small"
                clearable
                style="width: 200px; margin-right: 10px;"
              >
                <template #prefix>
                  <el-icon><Search /></el-icon>
                </template>
              </el-input>
              <el-button
                type="primary"
                size="small"
                @click="refreshFileList"
                :loading="loading"
              >
                <el-icon><Refresh /></el-icon>
                刷新
              </el-button>
            </div>
          </div>
        </template>

        <!-- 加载状态 -->
        <div v-if="loading" class="loading-container">
          <el-skeleton :rows="5" animated />
        </div>

        <!-- 空状态 -->
        <el-empty
          v-else-if="filteredFileList.length === 0"
          description="暂无可下载文件"
        />

        <!-- 文件列表 -->
        <div v-else class="file-list">
          <div
            v-for="file in paginatedFileList"
            :key="file.id"
            class="file-item"
          >
            <div class="file-info">
              <el-icon class="file-icon" :class="getFileIconClass(file.name)">
                <Document v-if="getFileIconType(file.name) === 'document'" />
                <Picture v-else-if="getFileIconType(file.name) === 'image'" />
                <VideoPlay v-else-if="getFileIconType(file.name) === 'video'" />
                <Files v-else />
              </el-icon>
              <div class="file-details">
                <div class="file-name" :title="file.name">{{ file.name }}</div>
                <div class="file-meta">
                  <span class="file-size">{{ formatFileSize(file.size) }}</span>
                  <span class="file-time">{{ formatTime(file.uploadTime) }}</span>
                  <el-tag size="small" :type="getFileTypeTag(file.name)">
                    {{ getFileTypeText(file.name) }}
                  </el-tag>
                </div>
              </div>
            </div>

            <div class="file-actions">
              <el-button
                type="primary"
                size="small"
                @click="downloadFile(file)"
                :disabled="isDownloading(file.id)"
              >
                <el-icon><Download /></el-icon>
                下载
              </el-button>
              <el-button
                type="info"
                size="small"
                @click="previewFile(file)"
                v-if="canPreview(file.name)"
              >
                <el-icon><View /></el-icon>
                预览
              </el-button>
            </div>
          </div>
        </div>

        <!-- 分页 -->
        <div v-if="filteredFileList.length > 0" class="pagination-container">
          <el-pagination
            v-model:current-page="currentPage"
            v-model:page-size="pageSize"
            :page-sizes="[10, 20, 50, 100]"
            :total="filteredFileList.length"
            layout="total, sizes, prev, pager, next, jumper"
            background
          />
        </div>
      </el-card>
    </div>

    <!-- 下载列表 -->
    <div class="download-list-section" v-if="downloadList.length > 0">
      <el-card class="list-card">
        <template #header>
          <div class="card-header">
            <span>下载列表 ({{ downloadList.length }})</span>
            <div class="header-actions">
              <el-button
                type="danger"
                size="small"
                @click="clearCompletedDownloads"
              >
                清空已完成
              </el-button>
            </div>
          </div>
        </template>

        <div class="download-list">
          <div
            v-for="task in downloadList"
            :key="task.id"
            class="download-item"
          >
            <div class="file-info">
              <el-icon class="file-icon" :class="getFileIconClass(task.fileName)">
                <Document v-if="getFileIconType(task.fileName) === 'document'" />
                <Picture v-else-if="getFileIconType(task.fileName) === 'image'" />
                <VideoPlay v-else-if="getFileIconType(task.fileName) === 'video'" />
                <Files v-else />
              </el-icon>
              <div class="file-details">
                <div class="file-name" :title="task.fileName">{{ task.fileName }}</div>
                <div class="file-meta">
                  <span class="file-size">{{ formatFileSize(task.fileSize) }}</span>
                  <span class="download-time">{{ formatTime(task.createTime) }}</span>
                </div>
              </div>
            </div>

            <div class="download-progress">
              <el-progress
                :percentage="task.progress"
                :status="getProgressStatus(task.status)"
                :stroke-width="8"
              />
              <div class="progress-info">
                <span class="progress-text">
                  {{ getProgressText(task) }}
                </span>
                <span class="download-speed" v-if="task.speed > 0">
                  {{ formatSpeed(task.speed) }}
                </span>
              </div>
            </div>

            <div class="download-actions">
              <el-button
                v-if="task.status === 'error'"
                type="primary"
                size="small"
                @click="retryDownload(task)"
              >
                重试
              </el-button>
            </div>
          </div>
        </div>
      </el-card>
    </div>

    <!-- 文件预览对话框 -->
    <el-dialog
      v-model="previewDialogVisible"
      title="文件预览"
      width="800px"
      :before-close="closePreview"
    >
      <div class="preview-container">
        <div v-if="previewLoading" class="loading-container">
          <el-skeleton :rows="3" animated />
        </div>
                 <div v-else-if="previewFileData.type === 'image'" class="image-preview">
           <img :src="previewFileData.url" alt="预览图片" style="max-width: 100%; height: auto;" />
         </div>
         <div v-else-if="previewFileData.type === 'text'" class="text-preview">
           <pre>{{ previewFileData.content }}</pre>
         </div>
        <div v-else class="unsupported-preview">
          <el-icon size="48"><Warning /></el-icon>
          <p>该文件类型不支持预览</p>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { useFileStore } from '../stores/fileStore'
import { getFileList, downloadFile as downloadFileApi } from '../api/fileApi'
import {
  formatFileSize,
  formatSpeed,
  formatTime,
  getFileIconType,
  isImageFile,
  isDocumentFile,
  isVideoFile
} from '../utils/fileUtils'

const fileStore = useFileStore()

// 响应式数据
const loading = ref(false)
const searchKeyword = ref('')
const currentPage = ref(1)
const pageSize = ref(20)
const fileList = ref([])

// 预览相关
const previewDialogVisible = ref(false)
const previewLoading = ref(false)
const previewFileData = ref({})

// 计算属性
const downloadList = computed(() => fileStore.downloadList)
const hasDownloadingTasks = computed(() => 
  downloadList.value.some(task => task.status === 'downloading')
)

// 过滤后的文件列表
const filteredFileList = computed(() => {
  if (!searchKeyword.value) return fileList.value
  
  return fileList.value.filter(file =>
    file.name.toLowerCase().includes(searchKeyword.value.toLowerCase())
  )
})

// 分页后的文件列表
const paginatedFileList = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return filteredFileList.value.slice(start, end)
})

// 刷新文件列表
const refreshFileList = async () => {
  loading.value = true
  try {
    const response = await getFileList()
    console.log('File list response:', response)
    console.log('Files from localStorage:', response.files)
    fileList.value = response.files || []
    ElMessage.success(`文件列表刷新成功 (共${fileList.value.length}个文件)`)
  } catch (error) {
    console.error('Get file list error:', error)
    ElMessage.error('获取文件列表失败')
    // 使用模拟数据
    fileList.value = generateMockFileList()
  } finally {
    loading.value = false
  }
}

// 生成模拟文件列表
const generateMockFileList = () => {
  return [
    {
      id: '1',
      name: 'document.pdf',
      size: 2048576,
      uploadTime: Date.now() - 3600000,
      type: 'application/pdf'
    },
    {
      id: '2',
      name: 'image.jpg',
      size: 1024000,
      uploadTime: Date.now() - 7200000,
      type: 'image/jpeg'
    },
    {
      id: '3',
      name: 'video.mp4',
      size: 50 * 1024 * 1024,
      uploadTime: Date.now() - 86400000,
      type: 'video/mp4'
    },
    {
      id: '4',
      name: 'data.xlsx',
      size: 512000,
      uploadTime: Date.now() - 172800000,
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    }
  ]
}

// 下载文件
const downloadFile = async (file) => {
  try {
    // 添加到下载列表
    fileStore.addDownloadTask({
      fileId: file.id,
      fileName: file.name,
      fileSize: file.size
    })

    const task = downloadList.value.find(t => t.fileId === file.id)
    if (!task) return

    // 开始下载
    fileStore.updateDownloadTask(task.id, { status: 'downloading' })

    const onProgress = (progress) => {
      fileStore.updateDownloadTask(task.id, { progress })
    }

    await downloadFileApi(file.id, file.name, onProgress)

    fileStore.updateDownloadTask(task.id, { 
      status: 'completed', 
      progress: 100 
    })
    ElMessage.success(`文件 ${file.name} 下载完成`)
  } catch (error) {
    console.error('Download error:', error)
    const task = downloadList.value.find(t => t.fileId === file.id)
    if (task) {
      fileStore.updateDownloadTask(task.id, { status: 'error' })
    }
    ElMessage.error(`文件 ${file.name} 下载失败: ${error.message}`)
  }
}

// 预览文件
const previewFile = async (file) => {
  previewDialogVisible.value = true
  previewLoading.value = true
  
  try {
    if (isImageFile(file.name)) {
      // 模拟图片预览
      previewFileData.value = {
        type: 'image',
        url: 'https://via.placeholder.com/400x300?text=Demo+Image'
      }
    } else if (file.name.endsWith('.txt')) {
      // 模拟文本预览
      previewFileData.value = {
        type: 'text',
        content: '这是一个示例文本文件的内容...\n可以在这里显示文件的文本内容。'
      }
    } else {
      previewFileData.value = {
        type: 'unsupported'
      }
    }
  } catch (error) {
    console.error('Preview error:', error)
    ElMessage.error('预览失败')
  } finally {
    previewLoading.value = false
  }
}

// 关闭预览
const closePreview = () => {
  previewDialogVisible.value = false
  previewFileData.value = {}
}

// 检查是否正在下载
const isDownloading = (fileId) => {
  return downloadList.value.some(task => 
    task.fileId === fileId && task.status === 'downloading'
  )
}

// 检查是否可以预览
const canPreview = (fileName) => {
  return isImageFile(fileName) || fileName.endsWith('.txt')
}

// 暂停下载
const pauseDownload = (task) => {
  fileStore.updateDownloadTask(task.id, { status: 'paused' })
}

// 继续下载
const resumeDownload = (task) => {
  const file = fileList.value.find(f => f.id === task.fileId)
  if (file) {
    downloadFile(file)
  }
}

// 重试下载
const retryDownload = (task) => {
  fileStore.updateDownloadTask(task.id, { 
    status: 'waiting',
    progress: 0 
  })
  const file = fileList.value.find(f => f.id === task.fileId)
  if (file) {
    downloadFile(file)
  }
}

// 删除下载任务
const removeDownload = (task) => {
  fileStore.removeDownloadTask(task.id)
}

// 暂停所有下载
const pauseAllDownloads = () => {
  downloadList.value
    .filter(task => task.status === 'downloading')
    .forEach(task => pauseDownload(task))
}

// 清空已完成的下载
const clearCompletedDownloads = () => {
  const completedTasks = downloadList.value.filter(task => 
    task.status === 'completed' || task.status === 'error'
  )
  completedTasks.forEach(task => removeDownload(task))
}

// 获取文件图标样式
const getFileIconClass = (fileName) => {
  const type = getFileIconType(fileName)
  return {
    'document-icon': type === 'document',
    'image-icon': type === 'image',
    'video-icon': type === 'video',
    'file-icon': type === 'file'
  }
}

// 获取文件类型标签
const getFileTypeTag = (fileName) => {
  if (isImageFile(fileName)) return 'success'
  if (isVideoFile(fileName)) return 'warning'
  if (isDocumentFile(fileName)) return 'info'
  return ''
}

// 获取文件类型文本
const getFileTypeText = (fileName) => {
  if (isImageFile(fileName)) return '图片'
  if (isVideoFile(fileName)) return '视频'
  if (isDocumentFile(fileName)) return '文档'
  return '文件'
}

// 获取进度条状态
const getProgressStatus = (status) => {
  const statusMap = {
    completed: 'success',
    downloading: '',
    error: 'exception',
    paused: 'warning'
  }
  return statusMap[status] || ''
}

// 获取进度文本
const getProgressText = (task) => {
  const statusMap = {
    waiting: '等待中',
    downloading: `下载中 ${task.progress}%`,
    paused: `已暂停 ${task.progress}%`,
    completed: '下载完成',
    error: '下载失败'
  }
  return statusMap[task.status] || '未知状态'
}

// 初始化
onMounted(() => {
  refreshFileList()
})
</script>

<style scoped>
.download-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.file-list-section,
.download-list-section {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-actions {
  display: flex;
  align-items: center;
}

.loading-container {
  padding: 20px;
}

.file-list,
.download-list {
  max-height: 600px;
  overflow-y: auto;
}

.file-item,
.download-item {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 15px 0;
  border-bottom: 1px solid #f0f0f0;
}

.file-item:last-child,
.download-item:last-child {
  border-bottom: none;
}

.file-info {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 300px;
}

.file-icon {
  font-size: 24px;
  color: #909399;
}

.document-icon {
  color: #e6a23c;
}

.image-icon {
  color: #67c23a;
}

.video-icon {
  color: #f56c6c;
}

.file-details {
  flex: 1;
  min-width: 0;
}

.file-name {
  font-size: 14px;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-bottom: 4px;
}

.file-meta {
  display: flex;
  gap: 15px;
  align-items: center;
  font-size: 12px;
  color: #909399;
}

.file-actions,
.download-actions {
  display: flex;
  gap: 8px;
}

.download-progress {
  flex: 1;
  min-width: 200px;
}

.progress-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 5px;
  font-size: 12px;
  color: #909399;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}

.preview-container {
  min-height: 300px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.image-preview {
  text-align: center;
}

.text-preview {
  max-height: 400px;
  overflow-y: auto;
  background: #f5f5f5;
  padding: 15px;
  border-radius: 4px;
  font-family: 'Courier New', monospace;
  font-size: 12px;
  line-height: 1.5;
}

.unsupported-preview {
  text-align: center;
  color: #909399;
}

.unsupported-preview p {
  margin-top: 10px;
}

@media (max-width: 768px) {
  .file-item,
  .download-item {
    flex-direction: column;
    align-items: stretch;
    gap: 15px;
  }
  
  .file-info {
    min-width: auto;
  }
  
  .download-progress {
    min-width: auto;
  }
  
  .file-actions,
  .download-actions {
    justify-content: center;
  }
  
  .header-actions {
    flex-direction: column;
    gap: 10px;
  }
}
</style> 