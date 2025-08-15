<template>
  <div class="upload-container">
    <!-- 上传区域 -->
    <div class="upload-section">
      <el-card class="upload-card">
        <template #header>
          <div class="card-header">
            <span>文件上传</span>
            <el-button
              v-if="uploadList.length > 0"
              type="danger"
              size="small"
              @click="clearAll"
            >
              清空列表
            </el-button>
          </div>
        </template>

        <!-- 拖拽上传区域 -->
        <div
          class="upload-dragger"
          @drop="handleDrop"
          @dragover="handleDragOver"
          @dragenter="handleDragEnter"
          @dragleave="handleDragLeave"
          :class="{ 'is-dragover': isDragover }"
          @click="triggerFileInput"
        >
          <el-icon class="upload-icon"><Upload /></el-icon>
          <div class="upload-text">
            <p>将文件拖拽到此处，或<em>点击选择文件</em></p>
            <p class="upload-tip">支持单个或批量上传，大文件自动启用断点续传</p>
          </div>
        </div>

        <!-- 隐藏的文件输入 -->
        <input
          ref="fileInput"
          type="file"
          multiple
          style="display: none"
          @change="handleFileSelect"
        />

        <!-- 上传选项 -->
        <div class="upload-options">
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="上传模式:">
                <el-radio-group v-model="uploadMode">
                  <el-radio label="auto">自动选择</el-radio>
                  <el-radio label="small">普通上传</el-radio>
                  <el-radio label="chunk">分片上传</el-radio>
                </el-radio-group>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="分片大小:">
                <el-select v-model="chunkSize" :disabled="uploadMode === 'small'">
                  <el-option label="1MB" :value="1024 * 1024" />
                  <el-option label="2MB" :value="2 * 1024 * 1024" />
                  <el-option label="5MB" :value="5 * 1024 * 1024" />
                  <el-option label="10MB" :value="10 * 1024 * 1024" />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>
        </div>
      </el-card>
    </div>

    <!-- 上传列表 -->
    <div class="upload-list-section" v-if="uploadList.length > 0">
      <el-card class="list-card">
        <template #header>
          <div class="card-header">
            <span>上传列表 ({{ uploadList.length }})</span>
          </div>
        </template>

        <div class="upload-list">
          <div
            v-for="task in uploadList"
            :key="task.id"
            class="upload-item"
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
                  <span class="upload-time">{{ formatTime(task.createTime) }}</span>
                </div>
              </div>
            </div>

            <div class="upload-progress">
              <el-progress
                :percentage="task.progress"
                :status="getProgressStatus(task.status)"
                :stroke-width="8"
              />
              <div class="progress-info">
                <span class="progress-text">
                  {{ getProgressText(task) }}
                </span>
                <span class="upload-speed" v-if="task.speed > 0">
                  {{ formatSpeed(task.speed) }}
                </span>
              </div>
            </div>

            <div class="upload-actions">
              <el-button
                v-if="task.status === 'waiting'"
                type="primary"
                size="small"
                @click="startUpload(task)"
              >
                开始
              </el-button>
              <el-button
                v-else-if="task.status === 'error'"
                type="primary"
                size="small"
                @click="retryUpload(task)"
              >
                重试
              </el-button>
            </div>
          </div>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { useFileStore } from '../stores/fileStore'
import { uploadSmallFile, uploadChunk } from '../api/fileApi'
import {
  formatFileSize,
  formatSpeed,
  formatTime,
  getFileIconType,
  calculateFileHash,
  sliceFile,
  validateFileType,
  validateFileSize
} from '../utils/fileUtils'

const fileStore = useFileStore()

// 响应式数据
const isDragover = ref(false)
const uploadMode = ref('auto') // auto, small, chunk
const chunkSize = ref(2 * 1024 * 1024) // 2MB
const fileInput = ref(null)

// 计算属性
const uploadList = computed(() => fileStore.uploadList)
const hasWaitingTasks = computed(() => uploadList.value.some(task => task.status === 'waiting'))
const hasUploadingTasks = computed(() => uploadList.value.some(task => task.status === 'uploading'))

// 拖拽事件处理
const handleDragOver = (e) => {
  e.preventDefault()
}

const handleDragEnter = (e) => {
  e.preventDefault()
  isDragover.value = true
}

const handleDragLeave = (e) => {
  e.preventDefault()
  isDragover.value = false
}

const handleDrop = (e) => {
  e.preventDefault()
  isDragover.value = false
  const files = Array.from(e.dataTransfer.files)
  handleFiles(files)
}

// 触发文件选择
const triggerFileInput = () => {
  fileInput.value?.click()
}

// 文件选择处理
const handleFileSelect = (e) => {
  const files = Array.from(e.target.files)
  handleFiles(files)
  e.target.value = '' // 清空input值，允许选择相同文件
}

// 处理文件
const handleFiles = (files) => {
  files.forEach(file => {
    // 验证文件
    if (!validateFile(file)) {
      return
    }

    // 添加到上传列表
    fileStore.addUploadTask({
      fileName: file.name,
      fileSize: file.size,
      file: file,
      uploadMode: getUploadMode(file),
      chunkSize: chunkSize.value
    })
  })

  ElMessage.success(`已添加 ${files.length} 个文件到上传列表`)
}

// 验证文件
const validateFile = (file) => {
  // 文件大小限制 (500MB)
  const maxSize = 500 * 1024 * 1024
  if (!validateFileSize(file, maxSize)) {
    ElMessage.error(`文件 ${file.name} 超过大小限制 (500MB)`)
    return false
  }

  return true
}

// 获取上传模式
const getUploadMode = (file) => {
  if (uploadMode.value === 'auto') {
    // 大于10MB的文件使用分片上传
    return file.size > 10 * 1024 * 1024 ? 'chunk' : 'small'
  }
  return uploadMode.value
}

// 开始上传
const startUpload = async (task) => {
  try {
    fileStore.updateUploadTask(task.id, { status: 'uploading' })

    let result
    if (task.uploadMode === 'small') {
      result = await uploadSmallFileHandler(task)
    } else {
      result = await uploadChunkedFileHandler(task)
    }

    // 根据任务最终状态决定是否提示完成
    const currentTask = fileStore.uploadList.find(t => t.id === task.id)
    if (currentTask?.status === 'completed') {
      ElMessage.success(`文件 ${task.fileName} 上传完成`)
    } else if (currentTask?.status === 'paused') {
      // 暂停时不做提示
      return
    }
  } catch (error) {
    console.error('Upload error:', error)
    fileStore.updateUploadTask(task.id, { status: 'error' })
    ElMessage.error(`文件 ${task.fileName} 上传失败: ${error.message}` )
  }
}

// 小文件上传处理
const uploadSmallFileHandler = async (task) => {
  const onProgress = (progress) => {
    fileStore.updateUploadTask(task.id, { progress })
  }

  const result = await uploadSmallFile(task.file, onProgress)
  // 小文件上传完成后，设置状态
  fileStore.updateUploadTask(task.id, { status: 'completed', progress: 100 })
  return result
}

// 分片上传处理
const uploadChunkedFileHandler = async (task) => {
  try {
    // 如果没有fileHash，先计算MD5
    if (!task.fileHash) {
      fileStore.updateUploadTask(task.id, { status: 'hashing', progress: 0 })
      
      const fileHash = await calculateFileHash(task.file, (progress) => {
        // MD5计算占总进度的20%
        fileStore.updateUploadTask(task.id, { 
          status: 'hashing', 
          progress: Math.floor(progress * 0.2) 
        })
      })
      
      fileStore.updateUploadTask(task.id, { fileHash })
      task.fileHash = fileHash // 同步更新本地任务对象
    }

    fileStore.updateUploadTask(task.id, { status: 'uploading' })
    const chunkSize = task.chunkSize * 1024 * 1024 // 转换为字节
    let startIndex = task.uploadedBytes || 0 // 从已上传位置开始（断点续传）
    const totalSize = task.file.size
    
    // 如果已经全部上传完成
    if (startIndex >= totalSize) {
      fileStore.updateUploadTask(task.id, { status: 'completed', progress: 100 })
      return { status: 'completed' }
    }

    console.log(`开始上传文件 ${task.fileName}，从字节 ${startIndex} 开始，总大小 ${totalSize}`)

    while (startIndex < totalSize) {
      // 检查任务状态，如果被暂停则停止
      const currentTask = fileStore.uploadList.find(t => t.id === task.id)
      if (currentTask?.status === 'paused') {
        console.log('上传已暂停')
        return { status: 'paused' }
      }

      const endIndex = Math.min(startIndex + chunkSize, totalSize)
      const chunk = task.file.slice(startIndex, endIndex) // 正确使用file.slice
      const isLastChunk = endIndex >= totalSize

      console.log(`上传切片: ${startIndex}-${endIndex}, 是否最后一片: ${isLastChunk}`)

      const chunkData = {
        chunk: chunk,
        startByte: startIndex,
        endByte: endIndex,
        fileName: task.fileName,
        fileSize: totalSize,
        fileHash: task.fileHash,
        isLastChunk: isLastChunk
      }

      const response = await uploadChunk(chunkData, (chunkProgress) => {
        // 计算总进度：MD5占20% + 当前上传进度占80%
        const currentBytes = startIndex + (chunk.size * chunkProgress / 100)
        const totalProgress = 20 + Math.floor((currentBytes / totalSize) * 80)
        fileStore.updateUploadTask(task.id, { progress: Math.min(totalProgress, 100) })
      })

      console.log('切片上传响应:', response)

      // 根据服务器返回的fileIndex更新下一个切片的起始位置
      if (response.fileIndex !== undefined) {
        const serverIndex = parseInt(response.fileIndex)
        startIndex = serverIndex
        fileStore.updateUploadTask(task.id, { uploadedBytes: serverIndex })
        
        console.log(`服务器返回fileIndex: ${serverIndex}，下一个切片从 ${startIndex} 开始`)
      } else {
        // 如果服务器没有返回fileIndex，按本地计算继续
        startIndex = endIndex
        fileStore.updateUploadTask(task.id, { uploadedBytes: endIndex })
      }

      // 更新进度
      const uploadProgress = 20 + Math.floor((task.uploadedBytes || endIndex) / totalSize * 80)
      fileStore.updateUploadTask(task.id, { progress: Math.min(uploadProgress, 100) })

      // 如果是最后一片且上传成功，检查是否有文件ID返回
      if (isLastChunk && response.id) {
        console.log('大文件上传完成，文件ID:', response.id)
        
        // 保存文件信息到本地存储
        saveUploadedFile({
          fileId: response.id,
          fileName: task.fileName,
          fileSize: task.fileSize,
          type: task.file.type || 'application/octet-stream',
          uploadMethod: 'chunk'
        })
        
        fileStore.updateUploadTask(task.id, { 
          status: 'completed', 
          progress: 100,
          fileId: response.id 
        })
        return { status: 'completed', fileId: response.id }
      }
    }

    // 如果循环结束但没有获得文件ID，标记为完成
    const finalTask = fileStore.uploadList.find(t => t.id === task.id)
    if ((finalTask?.uploadedBytes || 0) >= totalSize) {
      fileStore.updateUploadTask(task.id, { status: 'completed', progress: 100 })
      return { status: 'completed' }
    }

    return { status: 'partial' }

  } catch (error) {
    console.error('分片上传失败:', error)
    fileStore.updateUploadTask(task.id, { 
      status: 'error', 
      error: error.message 
    })
    throw error
  }
}

// 暂停上传
const pauseUpload = (task) => {
  fileStore.updateUploadTask(task.id, { status: 'paused' })
}

// 继续上传
const resumeUpload = (task) => {
  startUpload(task)
}

// 重试上传
const retryUpload = (task) => {
  fileStore.updateUploadTask(task.id, { 
    status: 'waiting',
    progress: 0 
  })
  startUpload(task)
}

// 删除上传任务
const removeUpload = (task) => {
  fileStore.removeUploadTask(task.id)
}

// 开始所有上传
const startAllUploads = () => {
  uploadList.value
    .filter(task => task.status === 'waiting')
    .forEach(task => startUpload(task))
}

// 暂停所有上传
const pauseAllUploads = () => {
  uploadList.value
    .filter(task => task.status === 'uploading')
    .forEach(task => pauseUpload(task))
}

// 清空列表
const clearAll = () => {
  const completedTasks = uploadList.value.filter(task => 
    task.status === 'completed' || task.status === 'error'
  )
  completedTasks.forEach(task => removeUpload(task))
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

// 获取进度条状态
const getProgressStatus = (status) => {
  const statusMap = {
    completed: 'success',
    uploading: '',
    hashing: 'info',
    error: 'exception',
    paused: 'warning'
  }
  return statusMap[status] || ''
}

// 获取进度文本
const getProgressText = (task) => {
  const statusMap = {
    waiting: '等待中',
    hashing: `计算文件特征值 ${task.progress}%`,
    uploading: `上传中 ${task.progress}%`,
    paused: `已暂停 ${task.progress}%`,
    completed: '上传完成',
    error: '上传失败'
  }
  return statusMap[task.status] || '未知状态'
}
</script>

<style scoped>
.upload-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.upload-section {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.upload-dragger {
  border: 2px dashed #d9d9d9;
  border-radius: 6px;
  padding: 40px;
  text-align: center;
  cursor: pointer;
  transition: border-color 0.3s;
  margin-bottom: 20px;
}

.upload-dragger:hover,
.upload-dragger.is-dragover {
  border-color: #409eff;
}

.upload-icon {
  font-size: 48px;
  color: #c0c4cc;
  margin-bottom: 16px;
}

.upload-text p {
  margin: 8px 0;
  color: #606266;
}

.upload-text em {
  color: #409eff;
  font-style: normal;
}

.upload-tip {
  font-size: 12px;
  color: #909399;
}

.upload-options {
  border-top: 1px solid #f0f0f0;
  padding-top: 20px;
}

.upload-list {
  max-height: 600px;
  overflow-y: auto;
}

.upload-item {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 15px 0;
  border-bottom: 1px solid #f0f0f0;
}

.upload-item:last-child {
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
  font-size: 12px;
  color: #909399;
}

.upload-progress {
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

.upload-actions {
  display: flex;
  gap: 8px;
}

.header-actions {
  display: flex;
  gap: 10px;
}

@media (max-width: 768px) {
  .upload-item {
    flex-direction: column;
    align-items: stretch;
    gap: 15px;
  }
  
  .file-info {
    min-width: auto;
  }
  
  .upload-progress {
    min-width: auto;
  }
  
  .upload-actions {
    justify-content: center;
  }
}
</style>