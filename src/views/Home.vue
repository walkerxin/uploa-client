<template>
  <div class="home-container">
    <!-- 欢迎区域 -->
    <div class="welcome-section">
      <el-card class="welcome-card">
        <div class="welcome-content">
          <div class="welcome-text">
            <h1>欢迎使用文件上传下载客户端</h1>
            <p class="description">
              基于 Halome API 构建的高性能文件传输工具，支持小文件快速上传、大文件断点续传和文件下载功能。
            </p>
            <div class="features">
              <div class="feature-item">
                <el-icon class="feature-icon"><Upload /></el-icon>
                <span>快速上传</span>
              </div>
              <div class="feature-item">
                <el-icon class="feature-icon"><Refresh /></el-icon>
                <span>断点续传</span>
              </div>
              <div class="feature-item">
                <el-icon class="feature-icon"><Download /></el-icon>
                <span>高速下载</span>
              </div>
            </div>
          </div>
          <div class="welcome-actions">
            <el-button
              type="primary"
              size="large"
              @click="$router.push('/upload')"
              class="action-btn"
            >
              <el-icon><Upload /></el-icon>
              开始上传
            </el-button>
            <el-button
              type="success"
              size="large"
              @click="$router.push('/download')"
              class="action-btn"
            >
              <el-icon><Download /></el-icon>
              文件下载
            </el-button>
          </div>
        </div>
      </el-card>
    </div>

    <!-- 统计信息 -->
    <div class="stats-section">
      <el-row :gutter="20">
        <el-col :span="8">
          <el-card class="stats-card">
            <div class="stats-item">
              <el-icon class="stats-icon upload-icon"><Upload /></el-icon>
              <div class="stats-info">
                <div class="stats-number">{{ uploadCount }}</div>
                <div class="stats-label">总上传文件</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="8">
          <el-card class="stats-card">
            <div class="stats-item">
              <el-icon class="stats-icon download-icon"><Download /></el-icon>
              <div class="stats-info">
                <div class="stats-number">{{ downloadCount }}</div>
                <div class="stats-label">总下载文件</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="8">
          <el-card class="stats-card">
            <div class="stats-item">
              <el-icon class="stats-icon size-icon"><FolderOpened /></el-icon>
              <div class="stats-info">
                <div class="stats-number">{{ formatFileSize(totalSize) }}</div>
                <div class="stats-label">总传输大小</div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 最近活动 -->
    <div class="recent-section">
      <el-card class="recent-card">
        <template #header>
          <div class="card-header">
            <span>最近活动</span>
            <el-button text @click="refreshActivity">
              <el-icon><Refresh /></el-icon>
              刷新
            </el-button>
          </div>
        </template>
        
        <el-empty v-if="recentActivity.length === 0" description="暂无活动记录" />
        
        <div v-else class="activity-list">
          <div
            v-for="activity in recentActivity"
            :key="activity.id"
            class="activity-item"
          >
            <el-icon
              :class="[
                'activity-icon',
                activity.type === 'upload' ? 'upload-icon' : 'download-icon'
              ]"
            >
              <Upload v-if="activity.type === 'upload'" />
              <Download v-else />
            </el-icon>
            <div class="activity-content">
              <div class="activity-title">{{ activity.fileName }}</div>
              <div class="activity-meta">
                <span class="activity-type">
                  {{ activity.type === 'upload' ? '上传' : '下载' }}
                </span>
                <span class="activity-size">{{ formatFileSize(activity.size) }}</span>
                <span class="activity-time">{{ formatTime(activity.time) }}</span>
              </div>
            </div>
            <div class="activity-status">
              <el-tag
                :type="getStatusType(activity.status)"
                size="small"
              >
                {{ getStatusText(activity.status) }}
              </el-tag>
            </div>
          </div>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useFileStore } from '../stores/fileStore'
import { formatFileSize, formatTime } from '../utils/fileUtils'

const fileStore = useFileStore()

// 统计数据
const uploadCount = ref(0)
const downloadCount = ref(0)
const totalSize = ref(0)

// 最近活动
const recentActivity = ref([
  {
    id: 1,
    fileName: 'demo.pdf',
    type: 'upload',
    size: 2048576,
    status: 'completed',
    time: Date.now() - 3600000
  },
  {
    id: 2,
    fileName: 'image.jpg',
    type: 'download',
    size: 1024000,
    status: 'completed',
    time: Date.now() - 7200000
  }
])

// 获取状态标签类型
const getStatusType = (status) => {
  const statusMap = {
    completed: 'success',
    uploading: 'warning',
    downloading: 'warning',
    error: 'danger',
    paused: 'info'
  }
  return statusMap[status] || 'info'
}

// 获取状态文本
const getStatusText = (status) => {
  const statusMap = {
    completed: '完成',
    uploading: '上传中',
    downloading: '下载中',
    error: '失败',
    paused: '暂停'
  }
  return statusMap[status] || '未知'
}

// 刷新活动
const refreshActivity = () => {
  // 实际应用中这里会调用API获取最新数据
  console.log('刷新活动记录')
}

// 初始化数据
onMounted(() => {
  // 计算统计数据
  uploadCount.value = fileStore.uploadList.length
  downloadCount.value = fileStore.downloadList.length
  
  // 计算总大小（这里是示例数据）
  totalSize.value = 10 * 1024 * 1024 * 1024 // 10GB
})
</script>

<style scoped>
.home-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.welcome-section {
  margin-bottom: 30px;
}

.welcome-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
}

.welcome-card :deep(.el-card__body) {
  padding: 40px;
}

.welcome-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 40px;
}

.welcome-text h1 {
  margin: 0 0 15px 0;
  font-size: 28px;
  font-weight: bold;
}

.description {
  font-size: 16px;
  line-height: 1.6;
  margin: 0 0 25px 0;
  opacity: 0.9;
}

.features {
  display: flex;
  gap: 25px;
}

.feature-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
}

.feature-icon {
  font-size: 18px;
}

.welcome-actions {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.action-btn {
  width: 160px;
  height: 50px;
  font-size: 16px;
}

.stats-section {
  margin-bottom: 30px;
}

.stats-card {
  height: 120px;
}

.stats-item {
  display: flex;
  align-items: center;
  height: 100%;
  gap: 20px;
}

.stats-icon {
  font-size: 36px;
}

.upload-icon {
  color: #409eff;
}

.download-icon {
  color: #67c23a;
}

.size-icon {
  color: #e6a23c;
}

.stats-info {
  flex: 1;
}

.stats-number {
  font-size: 24px;
  font-weight: bold;
  margin-bottom: 5px;
}

.stats-label {
  font-size: 14px;
  color: #909399;
}

.recent-section {
  margin-bottom: 30px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.activity-list {
  max-height: 400px;
  overflow-y: auto;
}

.activity-item {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 15px 0;
  border-bottom: 1px solid #f0f0f0;
}

.activity-item:last-child {
  border-bottom: none;
}

.activity-icon {
  font-size: 20px;
}

.activity-content {
  flex: 1;
}

.activity-title {
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 5px;
}

.activity-meta {
  display: flex;
  gap: 15px;
  font-size: 12px;
  color: #909399;
}

.activity-status {
  min-width: 60px;
}

@media (max-width: 768px) {
  .welcome-content {
    flex-direction: column;
    text-align: center;
  }
  
  .features {
    justify-content: center;
  }
  
  .welcome-actions {
    flex-direction: row;
    justify-content: center;
  }
  
  .activity-meta {
    flex-direction: column;
    gap: 5px;
  }
}
</style> 