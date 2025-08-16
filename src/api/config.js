import axios from 'axios'

// API基础配置
export const API_CONFIG = {
  baseURL: import.meta.env.DEV ? '/api' : 'https://test.wukongyun.fun/v1', // 开发环境使用代理
  token: '1b1427d1c3a88c308a0e0b3d61cf337e',
  timeout: 30000,
  chunkSize: 5 * 1024 * 1024, // 5MB 分片大小
  // 可选：提供异步通知回调地址时，服务端在最后一个分片会立即返回并异步通知该地址
  // notificationLink: 'https://your.callback.endpoint/notify'
}

// 创建axios实例
export const apiClient = axios.create({
  baseURL: API_CONFIG.baseURL,
  timeout: API_CONFIG.timeout,
  headers: {
    // 开发环境下通过代理添加认证头，生产环境直接添加
    ...(import.meta.env.DEV ? {} : { 'Authorization': API_CONFIG.token })
  }
})

// 请求拦截器
apiClient.interceptors.request.use(
  config => {
    // 可以在这里添加请求日志
    console.log('API Request:', config.method?.toUpperCase(), config.url)
    // 统一添加 AuthToken 头，若单个请求已设置则不覆盖
    if (!config.headers) config.headers = {}
    if (!('AuthToken' in config.headers)) {
      config.headers['AuthToken'] = API_CONFIG.token
    }
    return config
  },
  error => {
    console.error('API Request Error:', error)
    return Promise.reject(error)
  }
)

// 响应拦截器
apiClient.interceptors.response.use(
  response => {
    console.log('API Response:', response.status, response.config.url)
    return response
  },
  error => {
    console.error('API Response Error:', error.response?.status, error.config?.url)
    return Promise.reject(error)
  }
) 