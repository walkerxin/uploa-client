/**
 * 本地文件存储管理器
 * 用于存储上传成功的文件信息，因为没有获取文件列表的API
 */

const STORAGE_KEY = 'halome_uploaded_files'

/**
 * 获取存储的文件列表
 * @returns {Array} 文件列表
 */
export const getUploadedFiles = () => {
  try {
    const storedFiles = localStorage.getItem(STORAGE_KEY)
    return storedFiles ? JSON.parse(storedFiles) : []
  } catch (error) {
    console.error('Failed to get uploaded files from localStorage:', error)
    return []
  }
}

/**
 * 保存上传成功的文件信息
 * @param {Object} fileInfo 文件信息
 */
export const saveUploadedFile = (fileInfo) => {
  try {
    console.log('Attempting to save file info:', fileInfo)
    
    const files = getUploadedFiles()
    const newFile = {
      id: fileInfo.fileId || fileInfo.id,
      name: fileInfo.fileName || fileInfo.name,
      size: fileInfo.fileSize || fileInfo.size,
      uploadTime: Date.now(),
      type: fileInfo.type || 'unknown',
      uploadMethod: fileInfo.uploadMethod || 'unknown', // 'small' or 'chunk'
      ...fileInfo
    }
    
    console.log('Processed file object:', newFile)
    
    // 检查是否已存在
    const existingIndex = files.findIndex(f => f.id === newFile.id)
    if (existingIndex !== -1) {
      files[existingIndex] = newFile
      console.log('Updated existing file at index:', existingIndex)
    } else {
      files.unshift(newFile) // 添加到开头
      console.log('Added new file to list')
    }
    
    // 限制最多保存100个文件记录
    const limitedFiles = files.slice(0, 100)
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(limitedFiles))
    console.log('File saved to localStorage. Total files now:', limitedFiles.length)
    console.log('Complete files array:', limitedFiles)
  } catch (error) {
    console.error('Failed to save uploaded file to localStorage:', error)
  }
}

/**
 * 删除存储的文件信息
 * @param {string} fileId 文件ID
 */
export const removeUploadedFile = (fileId) => {
  try {
    const files = getUploadedFiles()
    const filteredFiles = files.filter(f => f.id !== fileId)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filteredFiles))
  } catch (error) {
    console.error('Failed to remove uploaded file from localStorage:', error)
  }
}

/**
 * 清空所有存储的文件信息
 */
export const clearUploadedFiles = () => {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch (error) {
    console.error('Failed to clear uploaded files from localStorage:', error)
  }
}

/**
 * 搜索文件
 * @param {string} keyword 搜索关键词
 * @returns {Array} 匹配的文件列表
 */
export const searchUploadedFiles = (keyword) => {
  const files = getUploadedFiles()
  if (!keyword) return files
  
  return files.filter(file => 
    file.name.toLowerCase().includes(keyword.toLowerCase())
  )
}

/**
 * 获取统计信息
 * @returns {Object} 统计信息
 */
export const getUploadStats = () => {
  const files = getUploadedFiles()
  const totalSize = files.reduce((sum, file) => sum + (file.size || 0), 0)
  
  return {
    totalFiles: files.length,
    totalSize: totalSize,
    smallFileUploads: files.filter(f => f.uploadMethod === 'small').length,
    chunkFileUploads: files.filter(f => f.uploadMethod === 'chunk').length
  }
}

/**
 * 调试函数：在浏览器控制台查看localStorage内容
 */
export const debugLocalStorage = () => {
  console.log('=== LocalStorage Debug Info ===')
  console.log('Storage key:', STORAGE_KEY)
  
  const rawData = localStorage.getItem(STORAGE_KEY)
  console.log('Raw localStorage data:', rawData)
  
  if (rawData) {
    try {
      const parsedData = JSON.parse(rawData)
      console.log('Parsed data:', parsedData)
      console.log('File count:', parsedData.length)
    } catch (error) {
      console.error('Failed to parse localStorage data:', error)
    }
  } else {
    console.log('No data found in localStorage')
  }
  
  const files = getUploadedFiles()
  console.log('Files from getUploadedFiles():', files)
  console.log('Stats:', getUploadStats())
}

// 将调试函数挂载到全局对象，方便在控制台调用
if (typeof window !== 'undefined') {
  window.debugHalomeStorage = debugLocalStorage
} 