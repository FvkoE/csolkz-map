function showProfileModal(message, type = 'error') {
    const modal = document.getElementById('profileModal');
    const messageEl = document.getElementById('profileModalMessage');
    const buttonEl = document.getElementById('profileModalButton');
    
    if (modal && messageEl && buttonEl) {
        // 设置消息
        messageEl.textContent = message;
        messageEl.className = `profile-modal-message ${type}`;
        
        // 设置按钮样式
        buttonEl.className = `profile-modal-button ${type}`;
        
        // 显示弹窗
        modal.style.display = 'flex';
        
        // 绑定按钮点击事件
        buttonEl.onclick = function() {
            modal.style.display = 'none';
        };
        
        // 支持点击遮罩关闭
        modal.onclick = function(e) {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        };
    }
}

// Profile页面确认弹窗函数
function showConfirmModal(message, onConfirm) {
    const modal = document.getElementById('profileModal');
    const messageEl = document.getElementById('profileModalMessage');
    const buttonEl = document.getElementById('profileModalButton');

    if (modal && messageEl && buttonEl) {
        // 先移除之前的按钮组
        const oldContainers = modal.querySelectorAll('.profile-modal-confirm-buttons');
        oldContainers.forEach(el => el.remove());

        // 设置消息
        messageEl.textContent = message;
        messageEl.className = 'profile-modal-message';

        // 创建确认和取消按钮
        const buttonContainer = document.createElement('div');
        buttonContainer.className = 'profile-modal-confirm-buttons';
        buttonContainer.style.display = 'flex';
        buttonContainer.style.justifyContent = 'center';
        buttonContainer.style.gap = '12px';

        const cancelBtn = document.createElement('button');
        cancelBtn.textContent = '取消';
        cancelBtn.className = 'profile-modal-button';
        cancelBtn.style.background = '#f5f5f5';
        cancelBtn.style.color = '#666';
        cancelBtn.style.border = '1px solid #ddd';

        const confirmBtn = document.createElement('button');
        confirmBtn.textContent = '确定';
        confirmBtn.className = 'profile-modal-button';
        confirmBtn.style.background = '#1976d2';
        confirmBtn.style.color = '#fff';

        // 隐藏原有按钮
        buttonEl.style.display = 'none';
        buttonContainer.appendChild(cancelBtn);
        buttonContainer.appendChild(confirmBtn);
        modal.querySelector('.profile-modal-content').appendChild(buttonContainer);

        // 显示弹窗
        modal.style.display = 'flex';

        // 绑定取消按钮事件
        cancelBtn.onclick = function() {
            modal.style.display = 'none';
            buttonEl.style.display = 'block';
            buttonContainer.remove();
        };

        // 绑定确认按钮事件
        confirmBtn.onclick = function() {
            modal.style.display = 'none';
            buttonEl.style.display = 'block';
            buttonContainer.remove();
            if (typeof onConfirm === 'function') {
                onConfirm();
            }
        };

        // 支持点击遮罩关闭
        modal.onclick = function(e) {
            if (e.target === modal) {
                modal.style.display = 'none';
                buttonEl.style.display = 'block';
                buttonContainer.remove();
            }
        };
    }
}

// 监听相机logo点击，触发文件选择
const avatarEditBtn = document.getElementById('avatarEditBtn');
const avatarFileInput = document.getElementById('avatarFileInput');
const profileAvatarImg = document.getElementById('profileAvatarImg');

// 获取当前昵称（从页面元素或window变量）
function getCurrentNickname() {
    // 优先从window.currentNickname获取
    if (window.currentNickname) return window.currentNickname;
    // 尝试从页面元素获取
    const nicknameEl = document.querySelector('.profile-nickname-display');
    if (nicknameEl) {
        // 去除@username部分
        let text = nicknameEl.textContent || '';
        return text.replace(/^@.*/, '').trim();
    }
    return '';
}

if (avatarEditBtn && avatarFileInput) {
    avatarEditBtn.addEventListener('click', function() {
        avatarFileInput.click();
    });

    avatarFileInput.addEventListener('change', function() {
        if (avatarFileInput.files && avatarFileInput.files[0]) {
            const file = avatarFileInput.files[0];
            if (!validateImageFile(file)) {
                showProfileModal('图片格式不支持或大小超过5MB', 'error');
                avatarFileInput.value = '';
                return;
            }
            
            // 检查图片是否能正常加载
            const reader = new FileReader();
            reader.onload = function(e) {
                const img = new Image();
                img.onload = function() {
                    // 图片加载成功，弹出裁剪弹窗
                    openAvatarCropModal(file, {
                        onCrop: function(croppedFile) {
                            uploadAvatarViaComplete(croppedFile);
                        }
                    });
                };
                img.onerror = function() {
                    // 图片加载失败
                    showProfileModal('图片加载失败，可能格式不被支持或图片已损坏，请更换图片', 'error');
                    avatarFileInput.value = '';
                };
                img.src = e.target.result;
            };
            reader.onerror = function() {
                showProfileModal('图片加载失败，可能格式不被支持或图片已损坏，请更换图片', 'error');
                avatarFileInput.value = '';
            };
            reader.readAsDataURL(file);
        }
    });
}

// 昵称编辑功能
const editLogoBtn = document.getElementById('editLogoBtn');
const nicknameDisplay = document.getElementById('nicknameDisplay');
const nicknameEdit = document.getElementById('nicknameEdit');
const nicknameInput = document.getElementById('nicknameInput');
const nicknameText = document.getElementById('nicknameText');

if (editLogoBtn && nicknameDisplay && nicknameEdit) {
    // 点击编辑按钮
    editLogoBtn.addEventListener('click', function() {
        const currentNickname = nicknameText.textContent;
        nicknameInput.value = currentNickname;
        nicknameDisplay.style.display = 'none';
        nicknameEdit.style.display = 'flex';
        nicknameInput.focus();
        nicknameInput.select();

        // 添加点击外部关闭监听
        setTimeout(() => {
            document.addEventListener('mousedown', handleClickOutside, true);
        }, 0);
    });

    // 处理点击输入框外部
    function handleClickOutside(e) {
        if (!nicknameEdit.contains(e.target)) {
            exitEditMode();
            document.removeEventListener('mousedown', handleClickOutside, true);
        }
    }

    // 保存昵称
    function saveNickname() {
        const newNickname = nicknameInput.value.trim();
        if (!newNickname) {
            showProfileModal('昵称不能为空', 'error');
            return;
        }
        if (newNickname.length > 20) {
            showProfileModal('昵称长度不能超过20个字符', 'error');
            return;
        }
        // 显示二次确认弹窗，点击确定时再取最新输入值
        showConfirmModal('每月只能修改3次游戏昵称，确定修改吗？', function() {
            const input = document.getElementById('nicknameInput');
            const latestNickname = input ? input.value.trim() : '';
            updateNicknameToServer(latestNickname);
        });
    }

    // 退出编辑模式
    function exitEditMode() {
        nicknameDisplay.style.display = 'flex';
        nicknameEdit.style.display = 'none';
        document.removeEventListener('mousedown', handleClickOutside, true);
    }

    // 绑定回车键和ESC
    if (nicknameInput) {
        nicknameInput.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                saveNickname();
            } else if (e.key === 'Escape') {
                exitEditMode();
            }
        });
    }
}

function uploadAvatarViaComplete(file) {
    const formData = new FormData();
    formData.append('avatar', file);
    formData.append('nickname', getCurrentNickname() || '未命名');
    fetch('/profile/complete', {
        method: 'POST',
        body: formData,
        headers: {'X-Requested-With': 'XMLHttpRequest'}
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // 显示成功弹窗
            showSuccessModal('头像已更新！');
            
            // 延时刷新页面，确保导航栏头像也同步更新
            setTimeout(() => {
                window.location.reload();
            }, 1500);
        } else {
            alert('上传失败：' + (data.message || '未知错误'));
        }
    })
    .catch(() => {
        alert('上传失败，请检查网络');
    });
}

// 将 updateNicknameToServer 移到 if 外部
function updateNicknameToServer(newNickname) {
    console.log('updateNicknameToServer', newNickname);
    fetch('/profile/update_nickname', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest'
        },
        body: JSON.stringify({ nickname: newNickname })
    })
    .then(response => response.json())
    .then(data => {
        console.log('接口返回', data);
        if (data.success) {
            // 延时刷新页面，确保所有昵称显示同步
            setTimeout(() => {
                window.location.reload();
            }, 1500);
            exitEditMode();
        } else {
            showProfileModal('更新失败：' + (data.message || '未知错误'), 'error');
        }
    })
    .catch(err => {
        console.log('接口异常', err);
        showProfileModal('更新失败，请检查网络', 'error');
    });
}

function getDifficultyClass(level) {
    if (['入门', '初级'].includes(level)) return 'difficulty-junior';
    if (['中级', '中级+'].includes(level)) return 'difficulty-middle';
    if (['高级', '高级+'].includes(level)) return 'difficulty-high';
    if (['骨灰', '骨灰+'].includes(level)) return 'difficulty-legend';
    if (['火星', '火星+'].includes(level)) return 'difficulty-mars';
    if (/^极限/.test(level)) return 'difficulty-extreme';
    if (/^死亡/.test(level)) return 'difficulty-death';
    return 'difficulty-junior';
}

// ========== 个人地图记录渲染 ========== //
function formatTimeMMSS(time) {
    if (typeof time !== 'number' && typeof time !== 'string') return '-';
    let s = parseFloat(time);
    if (isNaN(s)) return '-';
    let m = Math.floor(s / 60);
    let sec = s - m * 60;
    return `${m.toString().padStart(2, '0')}:${sec.toFixed(2).padStart(5, '0')}`;
}
function renderProfileRecords(records) {
    const listBox = document.querySelector('.profile-records-list');
    if (!listBox) return;
    listBox.innerHTML = '';
    if (!records || records.length === 0) {
        listBox.innerHTML = '<div style="color:#888;padding:32px 0;text-align:center;">暂无记录</div>';
        return;
    }
    // 构建表格
    const table = document.createElement('table');
    table.className = 'profile-record-table';
    // 不显示表头
    records.forEach((rec, idx) => {
        const videoBtn = rec.video_url ? `<a href="${rec.video_url}" target="_blank" class="profile-record-video-btn"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="12" fill="#1976d2"/><polygon points="10,8 16,12 10,16" fill="#fff"/></svg></a>` : '';
        const tr = document.createElement('tr');
        let rankHtml;
        if (rec.user_rank == 1 || rec.user_rank === '1') {
            rankHtml = '<span class="profile-record-wr">WR!</span>';
        } else {
            rankHtml = `#${rec.user_rank||'-'}`;
        }
        // 地图名可点击，跳转到/map/{map_id}
        let mapLink = `<a href="/map/${rec.map_id}" class="profile-record-maplink" target="_blank">${rec.map_name||'-'}</a>`;
        tr.innerHTML = `
            <td class="profile-record-index">${idx+1}</td>
            <td class="profile-record-mapname">${mapLink}</td>
            <td class="profile-record-finishtime">${formatTimeMMSS(rec.finish_time)}</td>
            <td class="profile-record-rank">${rankHtml}</td>
            <td class="profile-record-video">${videoBtn}</td>
        `;
        table.appendChild(tr);
    });
    listBox.appendChild(table);
}
// ========== Tab切换与模式过滤 ========== //
function filterRecordsByMode(mode) {
    if (!window.bestRecords) return [];
    return window.bestRecords.filter(r => r.mode === mode);
}

function updateRecordsByTab(tab) {
    let mode = 'pro';
    if(tab && tab.id === 'tab-savepoint') mode = 'nub';
    const filtered = filterRecordsByMode(mode);
    renderProfileRecords(filtered);
}

document.addEventListener('DOMContentLoaded', function() {
    // 默认显示裸跳
    if(window.bestRecords){
        renderProfileRecords(filterRecordsByMode('pro'));
    }
    // Tab栏切换效果与数据切换
    const tabItems = document.querySelectorAll('.tab-item');
    tabItems.forEach(tab => {
      tab.addEventListener('click', function() {
        tabItems.forEach(t => t.classList.remove('selected'));
        this.classList.add('selected');
        updateRecordsByTab(this);
      });
    });
});

document.addEventListener('DOMContentLoaded', function() {
    if (window.profileStats) {
        if (typeof window.profileStats.score !== 'undefined') {
            document.getElementById('profile-score').textContent = window.profileStats.score;
        }
        document.getElementById('profile-rank').textContent = (window.profileStats.rank === undefined || window.profileStats.rank === null || window.profileStats.rank === '') ? '-' : window.profileStats.rank;
        if (typeof window.profileStats.first_clear_score !== 'undefined') {
            document.getElementById('profile-first-clear-score').textContent =window.profileStats.first_clear_score;
        }
        if (typeof window.profileStats.score_float !== 'undefined') {
            document.getElementById('profile-score-float').textContent =window.profileStats.score_float;
        }
        // 新增：填充WR数量、首通数量、总记录数、裸跳记录、存点记录
        if (typeof window.profileStats.wrcounts !== 'undefined') {
            document.getElementById('profile-wr-count').textContent = 'WR数量：' + window.profileStats.wrcounts;
        }
        if (typeof window.profileStats.first_clear !== 'undefined') {
            document.getElementById('profile-first-clear-count').textContent = '首通数量：' + window.profileStats.first_clear;
        }
        // 总记录数 = 裸跳记录(pro) + 存点记录(nub)
        if (typeof window.profileStats.pro !== 'undefined' && typeof window.profileStats.nub !== 'undefined') {
            var total = Number(window.profileStats.pro) + Number(window.profileStats.nub);
            document.getElementById('profile-total-record-count').textContent = '总记录数：' + total;
        }
        if (typeof window.profileStats.pro !== 'undefined') {
            document.getElementById('profile-pro-count').textContent = '裸跳记录：' + window.profileStats.pro;
        }
        if (typeof window.profileStats.nub !== 'undefined') {
            document.getElementById('profile-nub-count').textContent = '存点记录：' + window.profileStats.nub;
        }
        // 最高通关难度显示逻辑
        if (typeof window.profileStats.highest_level === 'undefined' || window.profileStats.highest_level === null || window.profileStats.highest_level === '') {
            document.getElementById('profile-highest-level').textContent = '最高通关难度：' + '-';
        } else {
            var level = window.profileStats.highest_level;
            var diffClass = getDifficultyClass(level);
            document.getElementById('profile-highest-level').innerHTML = '最高通关难度：<span class="' + diffClass + '">' + level + '</span>';
        }
    }
}); 

// Tab栏切换效果
const tabItems = document.querySelectorAll('.tab-item');
tabItems.forEach(tab => {
  tab.addEventListener('click', function() {
    tabItems.forEach(t => t.classList.remove('selected'));
    this.classList.add('selected');
  });
}); 

const wrBtn = document.getElementById('wr-toggle-btn');
if (wrBtn) {
  wrBtn.addEventListener('click', function() {
    wrBtn.classList.toggle('selected');
  });
} 

