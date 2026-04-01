// 阿里云OSS配置
const ossConfig = {
  bucket: 'family-memo', // 替换为您的OSS Bucket名称
  region: 'oss-cn-beijing', // 替换为您的OSS区域，如 'oss-cn-beijing'
  accessKeyId: 'LTAI5tHc3vQTVqRWH4EpcKT7', // 替换为您的AccessKey ID
  accessKeySecret: 'yJGgVMry3yOwr8mvJGrxzIMU15tPrp', // 替换为您的AccessKey Secret
  endpoint: 'https://family-memo.oss-cn-beijing.aliyuncs.com' // 替换为您的OSS访问域名
};

// 本地存储配置（作为备份）
const config = {
  // 本地存储键名
  storageKeys: {
    users: 'family_memo_users',
    notes: 'family_memo_notes',
    currentUser: 'family_memo_current_user',
    appTitle: 'family_memo_app_title'
  }
};

// 本地存储工具函数
const storage = {
  get: (key) => {
    try {
      const value = localStorage.getItem(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('Error getting data from localStorage:', error);
      return null;
    }
  },
  set: (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error('Error setting data to localStorage:', error);
      return false;
    }
  },
  remove: (key) => {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error('Error removing data from localStorage:', error);
      return false;
    }
  }
};

// OSS工具函数
const oss = {
  // 生成签名URL（用于临时访问）
  generateSignedUrl: (objectName, method = 'GET', expires = 3600) => {
    // 注意：在实际应用中，签名应该在服务器端生成
    // 这里为了简化，我们使用一个简单的方法
    // 生产环境中请使用阿里云SDK生成签名
    const url = `${ossConfig.endpoint}/${objectName}`;
    return url;
  },
  
  // 上传数据到OSS
  async uploadData(data, objectName) {
    try {
      const url = this.generateSignedUrl(objectName, 'PUT');
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
      return response.ok;
    } catch (error) {
      console.error('Error uploading data to OSS:', error);
      return false;
    }
  },
  
  // 从OSS下载数据
  async downloadData(objectName) {
    try {
      const url = this.generateSignedUrl(objectName);
      const response = await fetch(url);
      if (response.ok) {
        return await response.json();
      }
      return null;
    } catch (error) {
      console.error('Error downloading data from OSS:', error);
      return null;
    }
  }
};
