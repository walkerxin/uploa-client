<script setup>
// 使用字符串名称方式，无需导入
</script>

<template>
  <div id="app">
    <el-container class="app-container">
      <!-- 头部导航 -->
      <el-header class="app-header">
        <div class="header-content">
          <h1 class="app-title">
            <el-icon><Folder /></el-icon>
            文件上传下载客户端
          </h1>
          <nav class="app-nav">
            <el-menu
              mode="horizontal"
              :default-active="$route.path"
              router
              class="nav-menu"
            >
              <el-menu-item index="/">
                <el-icon><House /></el-icon>
                首页
              </el-menu-item>
              <el-menu-item index="/upload">
                <el-icon><Upload /></el-icon>
                文件上传
              </el-menu-item>
              <el-menu-item index="/download">
                <el-icon><Download /></el-icon>
                文件下载
              </el-menu-item>
            </el-menu>
          </nav>
        </div>
      </el-header>

      <!-- 主要内容区域 -->
      <el-main class="app-main">
        <router-view />
      </el-main>

      <!-- 底部 -->
      <el-footer class="app-footer">
        <div class="footer-content">
          <p>&copy; 2025 文件上传下载客户端 - 基于 Halome API</p>
        </div>
      </el-footer>
    </el-container>
  </div>
</template>

<style scoped>
.app-container {
  min-height: 100vh;
}

.app-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 0;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
}

.app-title {
  margin: 0;
  font-size: 20px;
  font-weight: bold;
  display: flex;
  align-items: center;
  gap: 8px;
}

.nav-menu {
  background: transparent;
  border: none;
}

.nav-menu .el-menu-item {
  color: white;
  border-bottom: 2px solid transparent;
}

.nav-menu .el-menu-item:hover {
  background: rgba(255, 255, 255, 0.1);
  border-bottom-color: white;
}

.nav-menu .el-menu-item.is-active {
  background: rgba(255, 255, 255, 0.2);
  border-bottom-color: white;
}

.app-main {
  background: #f5f7fa;
  min-height: calc(100vh - 120px);
  padding: 20px;
}

.app-footer {
  background: #2c3e50;
  color: white;
  height: 60px;
  padding: 0;
}

.footer-content {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  text-align: center;
}

.footer-content p {
  margin: 0;
  font-size: 14px;
}
</style>

<style>
/* 全局样式 */
* {
  box-sizing: border-box;
}

body {
  margin: 0;
  font-family: 'Helvetica Neue', Helvetica, 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', '微软雅黑', Arial, sans-serif;
}

#app {
  min-height: 100vh;
}

/* Element Plus 样式调整 */
.el-menu--horizontal .el-menu-item {
  height: 60px;
  line-height: 60px;
}

.el-container {
  height: 100%;
}
</style>
