// 管理员后台主页面JS
// 标签栏切换逻辑
function switchTab(tabIndex) {
    // 记录当前tab
    localStorage.setItem('adminTabIndex', tabIndex);
    // 切换tab时自动刷新页面
    location.reload();
}
window.onload = function() {
    // 优先读取本地tabIndex
    let idx = parseInt(localStorage.getItem('adminTabIndex') || '0');
    // 激活对应tab
    var tabs = document.querySelectorAll('.tab-bar .tab');
    var contents = document.querySelectorAll('.admin-main .tab-content');
    tabs.forEach((tab, tidx) => {
        if(tidx === idx) tab.classList.add('active');
        else tab.classList.remove('active');
    });
    contents.forEach((content, cidx) => {
        if(cidx === idx) content.classList.add('active');
        else content.classList.remove('active');
    });
    // 搜索框自动聚焦并光标移到末尾
    var adminSearchInput = document.querySelector('.admin-search-input');
    if(adminSearchInput) {
        adminSearchInput.focus();
        const val = adminSearchInput.value;
        adminSearchInput.value = '';
        adminSearchInput.value = val;
    }
};
function refreshTab(tabIndex) {
    // 保持tabIndex，刷新页面
    localStorage.setItem('adminTabIndex', tabIndex);
    location.reload();
}
// 删除地图弹窗
function showDeleteModal(mapId, btn) {
    document.getElementById('deleteMapId').value = mapId;
    document.getElementById('deleteModal').style.display = 'flex';
    window._deleteBtn = btn;
}
function closeDeleteModal() {
    document.getElementById('deleteModal').style.display = 'none';
}
function confirmDeleteMap() {
    var mapId = document.getElementById('deleteMapId').value;
    var btn = window._deleteBtn;
    fetch(`/admin/map/delete/${mapId}`, {method: 'POST'})
        .then(res => res.json())
        .then(data => {
            if(data.success) {
                // 适配表格布局，删除所在tr
                if(btn.closest('tr')) btn.closest('tr').remove();
                // 兼容卡片布局
                if(btn.closest('.map-card-admin')) btn.closest('.map-card-admin').remove();
                closeDeleteModal();
            } else {
                alert('删除失败：' + (data.msg || '未知错误'));
                closeDeleteModal();
            }
        })
        .catch(() => { alert('请求失败'); closeDeleteModal(); });
}
// 修改弹窗复用用户端样式
function adminOpenEditModal(mapId, name, author, region, level, type, image) {
    document.getElementById('editModal').style.display = 'flex';
    document.getElementById('editMapId').value = mapId;
    document.getElementById('editMapName').value = name;
    document.getElementById('editMapAuthor').value = author;
    document.getElementById('editMapRegion').value = region;
    document.getElementById('editMapDifficulty').value = level;
    document.getElementById('editMapType').value = type;
    document.getElementById('currentMapImage').src = image;
    document.getElementById('editMapForm').onsubmit = function(e) {
        e.preventDefault();
        var formData = new FormData(this);
        fetch(`/admin/map/edit/${mapId}`, {method: 'POST', body: formData})
            .then(res => res.json())
            .then(data => {
                if(data.success) location.reload();
                else alert('修改失败：' + (data.msg || '未知错误'));
            })
            .catch(() => alert('请求失败'));
    };
}
function closeEditModal() {
    document.getElementById('editModal').style.display = 'none';
    document.querySelector('.edit-map-form').reset();
    document.getElementById('currentMapImage').src = '';
}
// 申请审核逻辑
let pendingReject = null;
function reviewApply(applyId, action, btn) {
    if(action === '通过') {
        // 同意直接执行
        fetch(`/admin/apply/review/${applyId}`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({action: action})
        })
        .then(res => res.json())
        .then(data => {
            if(data.success) {
                btn.closest('tr').remove();
            } else {
                alert('操作失败：' + (data.msg || '未知错误'));
            }
        })
        .catch(() => alert('请求失败'));
    } else if(action === '拒绝') {
        // 弹窗确认
        pendingReject = {applyId, btn};
        document.getElementById('rejectModal').style.display = 'flex';
    }
}
function confirmReject() {
    if(!pendingReject) return;
    const {applyId, btn} = pendingReject;
    fetch(`/admin/apply/review/${applyId}`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({action: '拒绝'})
    })
    .then(res => res.json())
    .then(data => {
        if(data.success) {
            btn.closest('tr').remove();
        } else {
            alert('操作失败：' + (data.msg || '未知错误'));
        }
        closeRejectModal();
    })
    .catch(() => { alert('请求失败'); closeRejectModal(); });
}
function closeRejectModal() {
    document.getElementById('rejectModal').style.display = 'none';
    pendingReject = null;
}
// 历史记录弹窗
function showHistoryModal(mapId) {
    const modal = document.getElementById('historyModal');
    const content = document.getElementById('historyContent');
    content.innerHTML = '<div style="color:#888;text-align:center;padding:40px 0;">加载中...</div>';
    modal.style.display = 'flex';
    fetch(`/admin/map/history/${mapId}`)
        .then(res => res.json())
        .then(data => {
            if(data.success && data.history && data.history.length > 0) {
                let html = '<table class="apply-table-admin" style="margin:0;width:100%;"><thead><tr>' +
                    '<th>操作时间</th><th>操作人</th><th>操作类型</th><th>名称</th><th>作者</th><th>大区</th><th>难度</th><th>类型</th><th>备注</th></tr></thead><tbody>';
                data.history.forEach(h => {
                    html += `<tr><td>${h.operate_time||''}</td><td>${h.operator||''}</td><td>${h.action||''}</td><td>${h.name||''}</td><td>${h.mapper||''}</td><td>${h.region||''}</td><td>${h.level||''}</td><td>${h.type||''}</td><td>${h.note||''}</td></tr>`;
                });
                html += '</tbody></table>';
                content.innerHTML = html;
            } else {
                content.innerHTML = '<div style="color:#888;text-align:center;padding:40px 0;">暂无历史记录</div>';
            }
        })
        .catch(()=>{
            content.innerHTML = '<div style="color:#e53935;text-align:center;padding:40px 0;">加载失败</div>';
        });
}
function closeHistoryModal() {
    document.getElementById('historyModal').style.display = 'none';
}
// 支持点击弹窗外部关闭历史弹窗
window.addEventListener('click', function(e) {
    const modal = document.getElementById('historyModal');
    if (modal && modal.style.display === 'flex' && e.target === modal) {
        closeHistoryModal();
    }
});
window.openAdviceListModal = function() {
    document.getElementById('adviceListModal').style.display = 'flex';
    var box = document.getElementById('adviceListBox');
    box.innerHTML = '<div style="color:#888;text-align:center;padding:30px 0;">加载中...</div>';
    fetch('/admin/advice/list').then(res=>res.json()).then(data=>{
        if(data.success && data.list && data.list.length>0){
            let html = '<ul style="list-style:none;padding:0;margin:0;">';
            data.list.forEach(item=>{
                html += `<li style="border-bottom:1px solid #eee;padding:12px 0;">
                    <div style=\"color:#333;font-size:1.08em;white-space:pre-line;\">${item.content}</div>
                    <div style=\"color:#888;font-size:13px;margin-top:4px;\">${item.create_time}</div>
                </li>`;
            });
            html += '</ul>';
            box.innerHTML = html;
        }else{
            box.innerHTML = '<div style="color:#888;text-align:center;padding:30px 0;">暂无建议</div>';
        }
    }).catch(()=>{
        box.innerHTML = '<div style="color:#e53935;text-align:center;padding:30px 0;">加载失败</div>';
    });
}
window.closeAdviceListModal = function() {
    document.getElementById('adviceListModal').style.display = 'none';
}
// 支持点击弹窗外部关闭建议弹窗
window.addEventListener('click', function(e) {
    const modal = document.getElementById('adviceListModal');
    if (modal && modal.style.display === 'flex' && e.target === modal) {
        window.closeAdviceListModal();
    }
}); 
// 图片上传限制检测函数
function validateImageFile(file) {
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp'];
    const maxSize = 2 * 1024 * 1024; // 2MB
    if (!allowedTypes.includes(file.type)) {
        alert('仅支持PNG、JPG、JPEG、GIF、WEBP格式的图片');
        return false;
    }
    if (file.size > maxSize) {
        alert('图片大小不能超过2MB');
        return false;
    }
    return true;
}
// 添加图片选择检测事件
window.addEventListener('DOMContentLoaded', function() {
    // 添加地图
    var adminAddImgInput = document.getElementById('adminMapImage');
    if(adminAddImgInput){
        adminAddImgInput.addEventListener('change', function(e){
            const file = e.target.files[0];
            if(file && !validateImageFile(file)){
                e.target.value = '';
                document.getElementById('adminAddMapImagePreview').innerHTML = '';
            }
        });
    }
    // 编辑地图
    var adminEditImgInput = document.getElementById('editMapImage');
    if(adminEditImgInput){
        adminEditImgInput.addEventListener('change', function(e){
            const file = e.target.files[0];
            if(file && !validateImageFile(file)){
                e.target.value = '';
                document.getElementById('editMapImagePreview').innerHTML = '';
            }
        });
    }
}); 

// 防止退出后通过后退按钮访问管理员页面
document.addEventListener('DOMContentLoaded', function() {
    // 检查是否是管理员页面
    const isAdminPage = document.querySelector('.admin-navbar') !== null;
    
    if (isAdminPage) {
        // 立即检查登录状态
        checkAdminLoginStatus();
        
        // 监听页面可见性变化
        document.addEventListener('visibilitychange', function() {
            if (!document.hidden) {
                // 页面重新可见时，立即检查管理员登录状态
                checkAdminLoginStatus();
            }
        });
        
        // 监听页面焦点变化 - 减少检查频率
        let focusCheckTimeout;
        window.addEventListener('focus', function() {
            // 防抖处理，避免频繁检查
            clearTimeout(focusCheckTimeout);
            focusCheckTimeout = setTimeout(checkAdminLoginStatus, 1000);
        });
        
        // 监听页面加载完成
        window.addEventListener('load', function() {
            checkAdminLoginStatus();
        });
    }
});

// 检查管理员登录状态的函数
function checkAdminLoginStatus() {
    // 检查是否有管理员会话
    fetch('/admin/check_admin_login')
        .then(response => response.json())
        .then(data => {
            if (!data.admin_logged_in) {
                // 管理员未登录，立即重定向到管理员登录页面
                window.location.replace('/admin/login');
            }
        })
        .catch(error => {
            console.error('检查管理员登录状态失败:', error);
            // 如果检查失败，立即重定向到管理员登录页面
            window.location.replace('/admin/login');
        });
}

// 页面卸载时清除敏感数据
window.addEventListener('beforeunload', function() {
    sessionStorage.clear();
    localStorage.removeItem('admin_session');
});

// 防止页面被缓存 - 更强制的方式
if (window.history && window.history.pushState) {
    // 监听后退按钮
    window.addEventListener('popstate', function() {
        // 立即检查管理员登录状态
        checkAdminLoginStatus();
    });
    
    // 监听前进按钮
    window.addEventListener('pushstate', function() {
        checkAdminLoginStatus();
    });
}

// 定期检查登录状态（每5分钟）- 减少检查频率
setInterval(function() {
    const isAdminPage = document.querySelector('.admin-navbar') !== null;
    if (isAdminPage) {
        checkAdminLoginStatus();
    }
}, 300000); // 5分钟 