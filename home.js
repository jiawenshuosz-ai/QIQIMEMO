// 备忘录主页面功能

// 检查用户是否已登录
let currentUser = null;
let userRole = '';

// 获取当前用户
currentUser = storage.get(config.storageKeys.currentUser);
if (currentUser) {
  userRole = currentUser.role;
  document.getElementById('user-role').textContent = `角色: ${userRole}`;
  document.getElementById('user-email').textContent = `邮箱: ${currentUser.email}`;
  // 加载备忘录
  loadNotes();
  // 加载应用标题
  loadAppTitle();
  // 定期同步数据
  setInterval(syncData, 30000); // 每30秒同步一次
} else {
  // 用户未登录，跳转到登录页
  window.location.href = 'index.html';
}

// 退出登录
document.getElementById('logout-btn').addEventListener('click', function() {
  storage.remove(config.storageKeys.currentUser);
  window.location.href = 'index.html';
});

// 深色模式切换
const themeToggle = document.getElementById('theme-toggle');
if (localStorage.getItem('theme') === 'dark' || (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
  document.body.classList.add('dark-mode');
  themeToggle.textContent = '☀️';
} else {
  document.body.classList.remove('dark-mode');
  themeToggle.textContent = '🌙';
}

themeToggle.addEventListener('click', function() {
  document.body.classList.toggle('dark-mode');
  if (document.body.classList.contains('dark-mode')) {
    themeToggle.textContent = '☀️';
    localStorage.setItem('theme', 'dark');
  } else {
    themeToggle.textContent = '🌙';
    localStorage.setItem('theme', 'light');
  }
});

// 可编辑标题
const appTitle = document.getElementById('app-title');
appTitle.addEventListener('blur', function() {
  const newTitle = this.textContent.trim() || '家庭共享备忘录';
  storage.set(config.storageKeys.appTitle, newTitle);
  // 同步到OSS
  syncAppTitle(newTitle);
});

// 加载应用标题
function loadAppTitle() {
  // 先尝试从OSS加载
  loadAppTitleFromOSS().then(title => {
    if (title) {
      appTitle.textContent = title;
      storage.set(config.storageKeys.appTitle, title);
    } else {
      // 如果OSS没有，从本地存储加载
      const savedTitle = storage.get(config.storageKeys.appTitle);
      if (savedTitle) {
        appTitle.textContent = savedTitle;
      }
    }
  });
}

// 从OSS加载应用标题
async function loadAppTitleFromOSS() {
  try {
    const data = await oss.downloadData('app_title.json');
    return data ? data.title : null;
  } catch (error) {
    console.error('Error loading app title from OSS:', error);
    return null;
  }
}

// 同步应用标题到OSS
async function syncAppTitle(title) {
  try {
    await oss.uploadData({ title }, 'app_title.json');
  } catch (error) {
    console.error('Error syncing app title to OSS:', error);
  }
}

// 获取所有备忘录
function getNotes() {
  return storage.get(config.storageKeys.notes) || {};
}

// 保存备忘录
function saveNotes(notes) {
  storage.set(config.storageKeys.notes, notes);
  // 同步到OSS
  syncNotesToOSS(notes);
}

// 从OSS加载备忘录
async function loadNotesFromOSS() {
  try {
    const notes = await oss.downloadData('notes.json');
    if (notes) {
      storage.set(config.storageKeys.notes, notes);
      return notes;
    }
    return null;
  } catch (error) {
    console.error('Error loading notes from OSS:', error);
    return null;
  }
}

// 同步备忘录到OSS
async function syncNotesToOSS(notes) {
  try {
    await oss.uploadData(notes, 'notes.json');
  } catch (error) {
    console.error('Error syncing notes to OSS:', error);
  }
}

// 加载备忘录
async function loadNotes() {
  const notesList = document.getElementById('notes-list');
  notesList.innerHTML = '<p style="text-align: center; color: #666; margin-top: 20px;">正在加载备忘录...</p>';
  
  // 先尝试从OSS加载
  const ossNotes = await loadNotesFromOSS();
  const notes = ossNotes || getNotes();
  
  if (notes && Object.keys(notes).length > 0) {
    notesList.innerHTML = '';
    Object.keys(notes).forEach((noteId) => {
      const note = notes[noteId];
      createNoteElement(noteId, note);
    });
  } else {
    notesList.innerHTML = '<p style="text-align: center; color: #666; margin-top: 20px;">暂无备忘录</p>';
  }
}

// 定期同步数据
async function syncData() {
  try {
    const ossNotes = await loadNotesFromOSS();
    if (ossNotes) {
      const localNotes = getNotes();
      // 比较本地和OSS的数据，决定是否更新
      if (JSON.stringify(ossNotes) !== JSON.stringify(localNotes)) {
        storage.set(config.storageKeys.notes, ossNotes);
        loadNotes();
      }
    }
  } catch (error) {
    console.error('Error syncing data:', error);
  }
}

// 获取类型图标
function getTypeIcon(type) {
  switch (type) {
    case '购物':
      return '🛍️';
    case '记事':
      return '📝';
    case '取快递':
      return '📦';
    case '其他':
      return '📌';
    default:
      return '📌';
  }
}

// 检查是否过期
function isOverdue(deadline) {
  if (!deadline) return false;
  return new Date(deadline) < new Date();
}

// 格式化截止期限
function formatDeadline(deadline) {
  if (!deadline) return '';
  const date = new Date(deadline);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// 创建备忘录元素
function createNoteElement(noteId, note) {
  const notesList = document.getElementById('notes-list');
  const noteItem = document.createElement('div');
  noteItem.className = `note-item role-${note.author}`;
  noteItem.dataset.noteId = noteId;
  
  // 格式化时间
  const date = new Date(note.createdAt);
  const formattedDate = date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
  
  const isNoteOverdue = note.deadline && isOverdue(note.deadline);
  
  noteItem.innerHTML = `
    <div class="note-header">
      <div class="note-type">
        <span class="note-type-icon">${getTypeIcon(note.type || '其他')}</span>
        <span>${note.type || '其他'}</span>
      </div>
      ${note.deadline ? `
        <div class="note-deadline-info ${isNoteOverdue ? 'overdue' : ''}">
          截止: ${formatDeadline(note.deadline)}
        </div>
      ` : ''}
    </div>
    <div class="note-content">
      <div class="note-text ${note.completed ? 'completed' : ''}">${note.text}</div>
      <div class="note-meta">
        由 ${note.author} 创建于 ${formattedDate}
        ${note.completed ? ` | 由 ${note.completedBy} 完成于 ${new Date(note.completedAt).toLocaleString('zh-CN', {hour: '2-digit', minute: '2-digit'})}` : ''}
      </div>
    </div>
    <div class="note-actions">
      <button class="edit-btn">编辑</button>
      <button class="complete-btn">${note.completed ? '取消完成' : '标记完成'}</button>
      <button class="reply-btn">回复</button>
      <button class="delete-btn">删除</button>
    </div>
    <div class="replies-section">
      <h4>回复</h4>
      <div class="replies-list">
        ${note.replies ? Object.values(note.replies).map(reply => `
          <div class="reply-item">
            <div class="reply-content">${reply.content}</div>
            <div class="reply-meta">
              由 ${reply.author} 回复于 ${new Date(reply.createdAt).toLocaleString('zh-CN', {
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </div>
          </div>
        `).join('') : ''}
      </div>
      <div class="reply-form">
        <input type="text" class="reply-input" placeholder="写下你的回复...">
        <button class="send-reply-btn">发送</button>
      </div>
    </div>
  `;
  
  notesList.appendChild(noteItem);
  
  // 添加事件监听器
  addNoteEventListeners(noteItem, noteId, note);
}

// 添加备忘录事件监听器
function addNoteEventListeners(noteItem, noteId, note) {
  // 编辑按钮
  noteItem.querySelector('.edit-btn').addEventListener('click', function() {
    showEditForm(noteItem, noteId, note);
  });
  
  // 标记完成按钮
  noteItem.querySelector('.complete-btn').addEventListener('click', function() {
    toggleComplete(noteId, note);
  });
  
  // 回复按钮
  noteItem.querySelector('.reply-btn').addEventListener('click', function() {
    const replyInput = noteItem.querySelector('.reply-input');
    if (replyInput) {
      replyInput.focus();
    }
  });
  
  // 发送回复按钮
  const sendReplyBtn = noteItem.querySelector('.send-reply-btn');
  if (sendReplyBtn) {
    sendReplyBtn.addEventListener('click', function() {
      const replyInput = noteItem.querySelector('.reply-input');
      const replyContent = replyInput.value.trim();
      if (replyContent) {
        addReply(noteId, replyContent);
        replyInput.value = '';
      }
    });
  }
  
  // 按Enter键发送回复
  const replyInput = noteItem.querySelector('.reply-input');
  if (replyInput) {
    replyInput.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
        const replyContent = this.value.trim();
        if (replyContent) {
          addReply(noteId, replyContent);
          this.value = '';
        }
      }
    });
  }
  
  // 删除按钮
  noteItem.querySelector('.delete-btn').addEventListener('click', function() {
    deleteNote(noteId);
  });
}

// 显示编辑表单
function showEditForm(noteItem, noteId, note) {
  const originalContent = noteItem.innerHTML;
  noteItem.innerHTML = `
    <div class="note-edit">
      <div class="note-type-selector">
        <label for="edit-note-type-${noteId}">类型:</label>
        <select id="edit-note-type-${noteId}">
          <option value="购物" ${note.type === '购物' ? 'selected' : ''}>购物</option>
          <option value="记事" ${note.type === '记事' ? 'selected' : ''}>记事</option>
          <option value="取快递" ${note.type === '取快递' ? 'selected' : ''}>取快递</option>
          <option value="其他" ${note.type === '其他' ? 'selected' : ''}>其他</option>
        </select>
      </div>
      <div class="note-deadline">
        <label for="edit-note-deadline-${noteId}">截止期限:</label>
        <input type="datetime-local" id="edit-note-deadline-${noteId}" value="${note.deadline ? note.deadline.replace(' ', 'T').slice(0, 16) : ''}">
      </div>
      <input type="text" id="edit-note-${noteId}" value="${note.text}" required>
      <div class="note-edit-buttons">
        <button class="save-btn">保存</button>
        <button class="cancel-btn">取消</button>
      </div>
    </div>
  `;
  
  // 保存按钮
  noteItem.querySelector('.save-btn').addEventListener('click', function() {
    const newText = document.getElementById(`edit-note-${noteId}`).value.trim();
    const newType = document.getElementById(`edit-note-type-${noteId}`).value;
    const newDeadline = document.getElementById(`edit-note-deadline-${noteId}`).value;
    
    if (newText) {
      updateNote(noteId, newText, newType, newDeadline);
    }
  });
  
  // 取消按钮
  noteItem.querySelector('.cancel-btn').addEventListener('click', function() {
    noteItem.innerHTML = originalContent;
    // 重新添加事件监听器
    addNoteEventListeners(noteItem, noteId, note);
  });
}

// 添加新备忘录
document.getElementById('add-note-btn').addEventListener('click', function() {
  const newNoteText = document.getElementById('new-note').value.trim();
  const noteType = document.getElementById('note-type').value;
  const noteDeadline = document.getElementById('note-deadline').value;
  
  if (newNoteText) {
    addNote(newNoteText, noteType, noteDeadline);
    document.getElementById('new-note').value = '';
    document.getElementById('note-deadline').value = '';
  }
});

// 按Enter键添加备忘录
document.getElementById('new-note').addEventListener('keypress', function(e) {
  if (e.key === 'Enter') {
    const newNoteText = this.value.trim();
    const noteType = document.getElementById('note-type').value;
    const noteDeadline = document.getElementById('note-deadline').value;
    
    if (newNoteText) {
      addNote(newNoteText, noteType, noteDeadline);
      this.value = '';
      document.getElementById('note-deadline').value = '';
    }
  }
});

// 生成唯一ID
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// 添加备忘录到存储
function addNote(text, type = '其他', deadline = '') {
  const notes = getNotes();
  const noteId = generateId();
  notes[noteId] = {
    text: text,
    type: type,
    deadline: deadline,
    author: userRole,
    createdAt: new Date().getTime(),
    completed: false,
    replies: {}
  };
  saveNotes(notes);
  loadNotes();
}

// 更新备忘录
function updateNote(noteId, newText, newType, newDeadline) {
  const notes = getNotes();
  if (notes[noteId]) {
    notes[noteId].text = newText;
    notes[noteId].type = newType;
    notes[noteId].deadline = newDeadline;
    saveNotes(notes);
    loadNotes();
  }
}

// 切换完成状态
function toggleComplete(noteId, note) {
  const notes = getNotes();
  if (notes[noteId]) {
    if (note.completed) {
      // 取消完成
      notes[noteId].completed = false;
      notes[noteId].completedBy = null;
      notes[noteId].completedAt = null;
    } else {
      // 标记为完成
      notes[noteId].completed = true;
      notes[noteId].completedBy = userRole;
      notes[noteId].completedAt = new Date().getTime();
    }
    saveNotes(notes);
    loadNotes();
  }
}

// 添加回复
function addReply(noteId, content) {
  const notes = getNotes();
  if (notes[noteId]) {
    if (!notes[noteId].replies) {
      notes[noteId].replies = {};
    }
    const replyId = generateId();
    notes[noteId].replies[replyId] = {
      content: content,
      author: userRole,
      createdAt: new Date().getTime()
    };
    saveNotes(notes);
    loadNotes();
  }
}

// 删除备忘录
function deleteNote(noteId) {
  if (confirm('确定要删除这条备忘录吗？')) {
    const notes = getNotes();
    delete notes[noteId];
    saveNotes(notes);
    loadNotes();
  }
}

// 添加导出/导入功能
function addExportImport功能() {
  // 添加导出按钮
  const headerRight = document.querySelector('.header-right');
  const exportBtn = document.createElement('button');
  exportBtn.id = 'export-btn';
  exportBtn.textContent = '导出';
  exportBtn.style.backgroundColor = '#9c27b0';
  headerRight.appendChild(exportBtn);
  
  // 添加导入按钮
  const importBtn = document.createElement('button');
  importBtn.id = 'import-btn';
  importBtn.textContent = '导入';
  importBtn.style.backgroundColor = '#ff9800';
  headerRight.appendChild(importBtn);
  
  // 添加文件输入框（隐藏）
  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.id = 'file-input';
  fileInput.accept = '.json';
  fileInput.style.display = 'none';
  document.body.appendChild(fileInput);
  
  // 导出功能
  exportBtn.addEventListener('click', function() {
    const notes = getNotes();
    const dataStr = JSON.stringify(notes, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `family-notes-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  });
  
  // 导入功能
  importBtn.addEventListener('click', function() {
    fileInput.click();
  });
  
  fileInput.addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = function(e) {
        try {
          const importedNotes = JSON.parse(e.target.result);
          if (confirm('确定要导入备忘录吗？这将覆盖当前所有备忘录。')) {
            saveNotes(importedNotes);
            loadNotes();
            alert('导入成功！');
          }
        } catch (error) {
          alert('导入失败：文件格式错误');
        }
      };
      reader.readAsText(file);
    }
  });
}

// 初始化导出/导入功能
addExportImport功能();
