// Profile页面独立弹窗函数
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
