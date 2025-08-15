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
    
    // 检查是否已存在
    const existingIndex = files.findIndex(f => f.id === newFile.id)
    if (existingIndex !== -1) {
      files[existingIndex] = newFile
    } else {
      files.unshift(newFile) // 添加到开头
    }
    
    // 限制最多保存100个文件记录
    const limitedFiles = files.slice(0, 100)
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(limitedFiles))
    console.log('File saved to localStorage:', newFile)
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