import axios from 'axios'

// API基础配置
export const API_CONFIG = {
  baseURL: 'https://api.halome.cc', // 根据实际API地址修改
  token: '1b1427d1c3a88c308a0e0b3d61cf337e',
  timeout: 30000,
  chunkSize: 2 * 1024 * 1024, // 2MB 分片大小
}

// 创建axios实例
export const apiClient = axios.create({
  baseURL: API_CONFIG.baseURL,
  timeout: API_CONFIG.timeout,
  headers: {
    'Authorization': `Bearer ${API_CONFIG.token}`,
    'Content-Type': 'application/json'
  }
})

// 请求拦截器
apiClient.interceptors.request.use(
  config => {
    // 可以在这里添加请求日志
    console.log('API Request:', config.method?.toUpperCase(), config.url)
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