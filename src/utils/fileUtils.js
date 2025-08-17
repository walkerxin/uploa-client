import SparkMD5 from 'spark-md5'

/**
 * 格式化文件大小
 * @param {number} bytes 字节数
 * @returns {string} 格式化后的大小
 */
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 B'
  
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

/**
 * 格式化上传速度
 * @param {number} bytesPerSecond 每秒字节数
 * @returns {string} 格式化后的速度
 */
export const formatSpeed = (bytesPerSecond) => {
  return formatFileSize(bytesPerSecond) + '/s'
}

/**
 * 计算文件MD5哈希值
 * @param {File} file 文件对象
 * @param {Function} onProgress 进度回调
 * @param {number} [hashChunkSize=5*1024*1024] 计算MD5时使用的分片大小（字节），与上传分片保持一致
 * @returns {Promise<string>} MD5值
 */
export const calculateFileHash = (file, onProgress, hashChunkSize = 5 * 1024 * 1024) => {
  return new Promise((resolve, reject) => {
    const chunkSize = Math.max(256 * 1024, Number(hashChunkSize) || (5 * 1024 * 1024))
    const chunks = Math.ceil(file.size / chunkSize)
    let currentChunk = 0
    const spark = new SparkMD5.ArrayBuffer()
    const fileReader = new FileReader()

    fileReader.onload = (e) => {
      spark.append(e.target.result)
      currentChunk++
      
      const progress = Math.round((currentChunk / chunks) * 100)
      onProgress?.(progress)
      
      if (currentChunk < chunks) {
        loadNext()
      } else {
        resolve(spark.end())
      }
    }

    fileReader.onerror = () => {
      reject(new Error('Failed to read file'))
    }

    const loadNext = () => {
      const start = currentChunk * chunkSize
      const end = Math.min(start + chunkSize, file.size)
      fileReader.readAsArrayBuffer(file.slice(start, end))
    }

    loadNext()
  })
}

/**
 * 切片文件
 * @param {File} file 文件对象
 * @param {number} [chunkSize=5*1024*1024] 分片大小(字节)
 * @returns {Array} 分片数组
 */
export const sliceFile = (file, chunkSize = 5 * 1024 * 1024) => {
  const chunks = []
  let start = 0
  let index = 0
  
  while (start < file.size) {
    const end = Math.min(start + chunkSize, file.size)
    chunks.push({
      index: index++,
      startByte: start,
      endByte: end,
      chunk: file.slice(start, end),
      isLastChunk: end >= file.size // 标记是否为最后一片
    })
    start = end
  }
  
  return chunks
}

/**
 * 获取文件扩展名
 * @param {string} fileName 文件名
 * @returns {string} 扩展名
 */
export const getFileExtension = (fileName) => {
  return fileName.split('.').pop().toLowerCase()
}

/**
 * 检查是否为图片文件
 * @param {string} fileName 文件名
 * @returns {boolean}
 */
export const isImageFile = (fileName) => {
  const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg']
  return imageExtensions.includes(getFileExtension(fileName))
}

/**
 * 检查是否为视频文件
 * @param {string} fileName 文件名
 * @returns {boolean}
 */
export const isVideoFile = (fileName) => {
  const videoExtensions = ['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm', 'mkv']
  return videoExtensions.includes(getFileExtension(fileName))
}

/**
 * 检查是否为文档文件
 * @param {string} fileName 文件名
 * @returns {boolean}
 */
export const isDocumentFile = (fileName) => {
  const docExtensions = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt']
  return docExtensions.includes(getFileExtension(fileName))
}

/**
 * 获取文件图标类型
 * @param {string} fileName 文件名
 * @returns {string} 图标类型
 */
export const getFileIconType = (fileName) => {
  if (isImageFile(fileName)) return 'image'
  if (isVideoFile(fileName)) return 'video'
  if (isDocumentFile(fileName)) return 'document'
  return 'file'
}

/**
 * 验证文件类型
 * @param {File} file 文件对象
 * @param {Array} allowedTypes 允许的文件类型
 * @returns {boolean}
 */
export const validateFileType = (file, allowedTypes = []) => {
  if (allowedTypes.length === 0) return true
  
  const fileExtension = getFileExtension(file.name)
  return allowedTypes.includes(fileExtension)
}

/**
 * 验证文件大小
 * @param {File} file 文件对象
 * @param {number} maxSize 最大大小（字节）
 * @returns {boolean}
 */
export const validateFileSize = (file, maxSize) => {
  return file.size <= maxSize
}

/**
 * 格式化时间
 * @param {number} timestamp 时间戳
 * @returns {string} 格式化后的时间
 */
export const formatTime = (timestamp) => {
  const date = new Date(timestamp)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

/**
 * 计算剩余时间
 * @param {number} uploadedBytes 已上传字节
 * @param {number} totalBytes 总字节数
 * @param {number} speed 上传速度（字节/秒）
 * @returns {string} 剩余时间
 */
export const calculateRemainingTime = (uploadedBytes, totalBytes, speed) => {
  if (speed === 0) return '计算中...'
  
  const remainingBytes = totalBytes - uploadedBytes
  const remainingSeconds = Math.ceil(remainingBytes / speed)
  
  if (remainingSeconds < 60) {
    return `${remainingSeconds}秒`
  } else if (remainingSeconds < 3600) {
    const minutes = Math.floor(remainingSeconds / 60)
    return `${minutes}分钟`
  } else {
    const hours = Math.floor(remainingSeconds / 3600)
    const minutes = Math.floor((remainingSeconds % 3600) / 60)
    return `${hours}小时${minutes}分钟`
  }
} 