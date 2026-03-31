// 登录和注册功能

// 切换登录/注册表单
document.getElementById('switch-to-register').addEventListener('click', function(e) {
  e.preventDefault();
  document.getElementById('login-form').style.display = 'none';
  document.getElementById('register-form').style.display = 'block';
});

document.getElementById('switch-to-login').addEventListener('click', function(e) {
  e.preventDefault();
  document.getElementById('register-form').style.display = 'none';
  document.getElementById('login-form').style.display = 'block';
});

// 显示消息
function showMessage(message, isError = false) {
  const messageDiv = document.getElementById('auth-message');
  messageDiv.textContent = message;
  messageDiv.className = `message ${isError ? 'error' : 'success'}`;
  setTimeout(() => {
    messageDiv.textContent = '';
    messageDiv.className = 'message';
  }, 3000);
}

// 生成唯一ID
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// 获取所有用户
function getUsers() {
  return storage.get(config.storageKeys.users) || {};
}

// 保存用户
function saveUsers(users) {
  storage.set(config.storageKeys.users, users);
}

// 注册功能
document.getElementById('register-btn').addEventListener('click', function() {
  const email = document.getElementById('register-email').value;
  const password = document.getElementById('register-password').value;
  const role = document.getElementById('register-role').value;
  
  if (!email || !password || !role) {
    showMessage('请填写所有字段', true);
    return;
  }
  
  const users = getUsers();
  
  // 检查邮箱是否已存在
  const existingUser = Object.values(users).find(user => user.email === email);
  if (existingUser) {
    showMessage('该邮箱已注册', true);
    return;
  }
  
  // 创建新用户
  const userId = generateId();
  users[userId] = {
    id: userId,
    email: email,
    password: password, // 注意：实际应用中应该加密存储密码
    role: role,
    createdAt: new Date().getTime()
  };
  
  saveUsers(users);
  
  // 保存当前用户
  storage.set(config.storageKeys.currentUser, users[userId]);
  
  showMessage('注册成功！正在登录...');
  setTimeout(() => {
    window.location.href = 'home.html';
  }, 1500);
});

// 登录功能
document.getElementById('login-btn').addEventListener('click', function() {
  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;
  
  if (!email || !password) {
    showMessage('请填写所有字段', true);
    return;
  }
  
  const users = getUsers();
  
  // 查找用户
  const user = Object.values(users).find(user => user.email === email && user.password === password);
  if (user) {
    // 保存当前用户
    storage.set(config.storageKeys.currentUser, user);
    showMessage('登录成功！正在跳转...');
    setTimeout(() => {
      window.location.href = 'home.html';
    }, 1000);
  } else {
    showMessage('邮箱或密码错误', true);
  }
});

// 检查用户是否已登录
const currentUser = storage.get(config.storageKeys.currentUser);
if (currentUser) {
  // 用户已登录，跳转到主页
  window.location.href = 'home.html';
}
