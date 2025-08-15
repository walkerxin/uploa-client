import { apiClient, API_CONFIG } from './config.js'

/**
 * 小文件直接上传
 * @param {File} file 文件对象
 * @param {Function} onProgress 进度回调
 * @returns {Promise}
 */
export const uploadSmallFile = async (file, onProgress) => {
  const formData = new FormData()
  formData.append('file', file)
  
  try {
    const response = await apiClient.post('/add', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      onUploadProgress: (progressEvent) => {
        const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total)
        onProgress?.(progress)
      }
    })
    return response.data
  } catch (error) {
    console.error('Small file upload error:', error)
    throw error
  }
}

/**
 * 检查文件是否已存在（用于断点续传）
 * @param {string} fileName 文件名
 * @param {string} fileHash 文件hash
 * @returns {Promise}
 */
export const checkFileExists = async (fileName, fileHash) => {
  try {
    const response = await apiClient.get('/check-file', {
      params: { fileName, fileHash }
    })
    return response.data
  } catch (error) {
    console.error('Check file error:', error)
    throw error
  }
}

/**
 * 获取已上传的分片信息
 * @param {string} fileHash 文件hash
 * @returns {Promise}
 */
export const getUploadedChunks = async (fileHash) => {
  try {
    const response = await apiClient.get('/addLargeFile', {
      params: { fileHash }
    })
    return response.data
  } catch (error) {
    console.error('Get uploaded chunks error:', error)
    throw error
  }
}

/**
 * 上传文件分片
 * @param {Object} chunkData 分片数据
 * @param {Function} onProgress 进度回调
 * @returns {Promise}
 */
export const uploadChunk = async (chunkData, onProgress) => {
  const formData = new FormData()
  formData.append('chunk', chunkData.chunk)
  formData.append('chunkIndex', chunkData.chunkIndex)
  formData.append('fileHash', chunkData.fileHash)
  formData.append('fileName', chunkData.fileName)
  formData.append('totalChunks', chunkData.totalChunks)
  
  try {
    const response = await apiClient.post('/upload-chunk', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      onUploadProgress: (progressEvent) => {
        const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total)
        onProgress?.(progress)
      }
    })
    return response.data
  } catch (error) {
    console.error('Chunk upload error:', error)
    throw error
  }
}

/**
 * 合并文件分片
 * @param {string} fileHash 文件hash
 * @param {string} fileName 文件名
 * @param {number} totalChunks 总分片数
 * @returns {Promise}
 */
export const mergeChunks = async (fileHash, fileName, totalChunks) => {
  try {
    const response = await apiClient.post('/merge-chunks', {
      fileHash,
      fileName,
      totalChunks
    })
    return response.data
  } catch (error) {
    console.error('Merge chunks error:', error)
    throw error
  }
}

/**
 * 获取文件列表
 * @param {Object} params 查询参数
 * @returns {Promise}
 */
export const getFileList = async (params = {}) => {
  try {
    const response = await apiClient.get('/cat', { params })
    return response.data
  } catch (error) {
    console.error('Get file list error:', error)
    throw error
  }
}

/**
 * 下载文件
 * @param {string} fileId 文件ID
 * @param {string} fileName 文件名
 * @param {Function} onProgress 进度回调
 * @returns {Promise}
 */
export const downloadFile = async (fileId, fileName, onProgress) => {
  try {
    const response = await apiClient.get(`/download/${fileId}`, {
      responseType: 'blob',
      onDownloadProgress: (progressEvent) => {
        const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total)
        onProgress?.(progress)
      }
    })
    
    // 创建下载链接
    const url = window.URL.createObjectURL(new Blob([response.data]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', fileName)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
    
    return response.data
  } catch (error) {
    console.error('Download file error:', error)
    throw error
  }
}

/**
 * 断点续传下载
 * @param {string} fileId 文件ID
 * @param {string} fileName 文件名
 * @param {number} startByte 开始字节
 * @param {number} endByte 结束字节
 * @param {Function} onProgress 进度回调
 * @returns {Promise}
 */
export const downloadFileRange = async (fileId, fileName, startByte, endByte, onProgress) => {
  try {
    const response = await apiClient.get(`/download/${fileId}`, {
      headers: {
        'Range': `bytes=${startByte}-${endByte}`
      },
      responseType: 'blob',
      onDownloadProgress: (progressEvent) => {
        const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total)
        onProgress?.(progress)
      }
    })
    
    return response.data
  } catch (error) {
    console.error('Download file range error:', error)
    throw error
  }
} 