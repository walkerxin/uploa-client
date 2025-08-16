import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useFileStore = defineStore('file', () => {
  // 上传列表
  const uploadList = ref([])
  // 下载列表
  const downloadList = ref([])
  
  // 添加上传任务
  const addUploadTask = (task) => {
    uploadList.value.push({
      id: Date.now() + Math.random(),
      ...task,
      status: 'waiting', // waiting, uploading, paused, awaiting-callback, completed, error
      progress: 0,
      speed: 0,
      createTime: Date.now()
    })
  }
  
  // 更新上传任务
  const updateUploadTask = (id, updates) => {
    const index = uploadList.value.findIndex(task => task.id === id)
    if (index !== -1) {
      Object.assign(uploadList.value[index], updates)
    }
  }
  
  // 移除上传任务
  const removeUploadTask = (id) => {
    const index = uploadList.value.findIndex(task => task.id === id)
    if (index !== -1) {
      uploadList.value.splice(index, 1)
    }
  }
  
  // 添加下载任务
  const addDownloadTask = (task) => {
    downloadList.value.push({
      id: Date.now() + Math.random(),
      ...task,
      status: 'waiting',
      progress: 0,
      speed: 0,
      createTime: Date.now()
    })
  }
  
  // 更新下载任务
  const updateDownloadTask = (id, updates) => {
    const index = downloadList.value.findIndex(task => task.id === id)
    if (index !== -1) {
      Object.assign(downloadList.value[index], updates)
    }
  }
  
  // 移除下载任务
  const removeDownloadTask = (id) => {
    const index = downloadList.value.findIndex(task => task.id === id)
    if (index !== -1) {
      downloadList.value.splice(index, 1)
    }
  }
  
  return {
    uploadList,
    downloadList,
    addUploadTask,
    updateUploadTask,
    removeUploadTask,
    addDownloadTask,
    updateDownloadTask,
    removeDownloadTask
  }
}) 