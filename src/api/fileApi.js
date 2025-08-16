import { apiClient, API_CONFIG } from './config.js'
import { saveUploadedFile } from '../utils/localFileStorage.js'

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
        // 认证头通过拦截器或代理自动添加
      },
      onUploadProgress: (progressEvent) => {
        const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total)
        onProgress?.(progress)
      }
    })
    
    // 调试：打印API响应
    console.log('Small file upload response:', response.data)
    console.log('Response keys:', Object.keys(response.data || {}))
    console.log('Full response object:', response)
    
    // 保存上传成功的文件信息到本地存储
    if (response.data) {
      // 根据API文档，fileId在response.data.data中
      const fileId = response.data.data
      
      console.log('API response code:', response.data.code)
      console.log('API response message:', response.data.message)
      console.log('File ID from response.data.data:', fileId)
      
      if (response.data.code === 200 && fileId) {
        saveUploadedFile({
          fileId: fileId,
          fileName: file.name,
          fileSize: file.size,
          type: file.type,
          uploadMethod: 'small'
        })
      } else {
        console.error('Upload failed or no fileId returned')
        console.error('Response:', response.data)
        throw new Error(`Upload failed: ${response.data.message || 'Unknown error'}`)
      }
    }
    
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
 * 上传文件分片（支持断点续传）
 * @param {Object} chunkData 分片数据
 * @param {Function} onProgress 进度回调
 * @returns {Promise}
 */
export const uploadChunk = async (chunkData, onProgress, abortSignal) => {
  try {
    // 确保fileHash存在，这是FileMd5参数的值
    if (!chunkData.fileHash) {
      throw new Error('缺少文件MD5值，无法上传')
    }

    // 直接发送分片二进制数据作为请求体（符合接口：Body 为 arraybuff）
    const binaryBody = chunkData.chunk instanceof Blob ? chunkData.chunk : new Blob([chunkData.chunk])

    const notificationLink = chunkData.notificationLink || API_CONFIG.notificationLink
    // 调试：打印本次分片体积与区间
    try {
      console.log('[Chunk Debug] startByte:', chunkData.startByte, 'endByte:', chunkData.endByte, 'body.size:', binaryBody?.size)
    } catch (_) {}
    const response = await apiClient.post('/addLargeFile', binaryBody, {
      headers: {
        'Content-Type': 'application/octet-stream',
        'FileStartIndex': chunkData.startByte.toString(),
        'FileSize': chunkData.fileSize.toString(),
        'FileName': chunkData.fileName,
        'FileMd5': chunkData.fileHash,
        'AuthToken': API_CONFIG.token,
        ...(notificationLink ? { 'NotificationLink': notificationLink } : {}),
        // 仅用于前端/后端问题定位的调试头，服务端可忽略
        'X-Debug-Chunk-Size': (Number(chunkData.endByte) - Number(chunkData.startByte)).toString()
      },
      // 明确不做转换，按原始二进制发送
      transformRequest: (v) => v,
      signal: abortSignal,
      onUploadProgress: (progressEvent) => {
        // 回调报告当前分片的进度(0-100)，供上层按“MD5 20% + 上传80%”计算总进度
        const chunkTotal = Number(chunkData.endByte) - Number(chunkData.startByte)
        const chunkProgress = chunkTotal > 0 
          ? Math.round((progressEvent.loaded * 100) / chunkTotal) 
          : 100
        onProgress?.(chunkProgress)
      }
    })

    console.log('分片上传响应:', response.data)
    // 容错处理：若服务端fileIndex返回超过FileSize（可能表示已全部上传），强制对齐到FileSize
    const safeFileIndex = (() => {
      const idx = Number(response.data.fileIndex)
      const size = Number(chunkData.fileSize)
      if (!Number.isFinite(idx)) return undefined
      if (Number.isFinite(size) && idx > size) return size
      return idx
    })()
    
    // 检查响应代码，确保是200才视为成功
    if (response.data.code !== 200) {
      throw new Error(`上传失败: ${response.data.message || '服务器返回错误'}`)
    }
    
    return {
      ...response.data,
      // 计算已上传字节数（优先使用服务端返回的 fileIndex），并做上限纠正
      uploadedBytes: safeFileIndex ?? chunkData.endByte
    }
  } catch (error) {
    console.error('分片上传失败:', error)
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
export const mergeChunks = async (fileHash, fileName, totalChunks, fileSize) => {
  try {
    const response = await apiClient.post('/merge-chunks', {
      fileHash,
      fileName,
      totalChunks
    })
    
    // 调试：打印合并分片响应
    console.log('Merge chunks response:', response.data)
    console.log('Merge response code:', response.data.code)
    console.log('Merge response message:', response.data.message)
    
    // 保存大文件上传成功的信息到本地存储
    if (response.data) {
      // 根据API文档，fileId在response.data.data中
      const fileId = response.data.data
      
      console.log('File ID from merge response.data.data:', fileId)
      
      if (response.data.code === 200 && fileId) {
        saveUploadedFile({
          fileId: fileId,
          fileName: fileName,
          fileSize: fileSize,
          uploadMethod: 'chunk'
        })
      } else {
        console.error('Merge chunks failed or no fileId returned')
        console.error('Merge response:', response.data)
        throw new Error(`Merge failed: ${response.data.message || 'Unknown error'}`)
      }
    }
    
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
    // 由于没有获取文件列表的API，从本地存储获取
    const { getUploadedFiles } = await import('../utils/localFileStorage.js')
    const files = getUploadedFiles()
    
    return {
      files: files,
      total: files.length,
      success: true
    }
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
    const response = await apiClient.get(`/cat?id=${fileId}`, {
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
    const response = await apiClient.get(`/cat?id=${fileId}`, {
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