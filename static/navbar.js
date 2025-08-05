// 私信红点功能
function updateMessageRedDot() {
    fetch('/api/unread_message_count').then(r => r.json()).then(data => {
        let link = document.getElementById('nav-message-link');
        if (!link) return;
        let dot = document.getElementById('nav-message-dot');
        if (!dot) {
            dot = document.createElement('span');
            dot.id = 'nav-message-dot';
            dot.style.cssText = 'display:inline-block;width:9px;height:9px;background:#ff3b30;border-radius:50%;margin-left:2px;vertical-align:top;box-shadow:0 0 2px #fff;';
            link.appendChild(dot);
        }
        dot.style.display = (data.count > 0) ? 'inline-block' : 'none';
    });
}

document.addEventListener('DOMContentLoaded', updateMessageRedDot);

// 私信下拉消息列表（悬停弹出）
function createMessageDropdown() {
    let link = document.getElementById('nav-message-link');
    if (!link) return;
    let dropdown = document.getElementById('nav-message-dropdown');
    if (!dropdown) {
        dropdown = document.createElement('div');
        dropdown.id = 'nav-message-dropdown';
        dropdown.style.cssText = 'position:absolute;top:32px;right:0;min-width:260px;max-width:350px;background:#fff;border-radius:8px;box-shadow:0 4px 16px rgba(0,0,0,0.13);padding:0.5em 0;z-index:9999;display:none;';
        dropdown.innerHTML = '<div style="padding:10px 18px;color:#888;font-size:14px;">暂无消息</div>';
        link.parentNode.appendChild(dropdown);
    }
    let hideTimer = null;
    link.addEventListener('mouseenter', function() {
        fetch('/api/messages').then(r=>r.json()).then(data=>{
            if (!data.success || !data.messages.length) {
                dropdown.style.display = 'none';
            } else {
                dropdown.innerHTML = data.messages.map(m=>
                    `<div class="msg-item" style="display:flex;align-items:center;padding:10px 18px;font-size:15px;line-height:1.5;border-bottom:1px solid #f2f2f2;">
                        <div style="flex:1;white-space:normal;word-break:break-all;">${m.content}</div>
                        <div style="margin-left:10px;color:#888;font-size:13px;min-width:56px;text-align:right;">${m.create_time}</div>
                        ${!m.is_read ? '<span style="display:inline-block;width:8px;height:8px;background:#ff3b30;border-radius:50%;margin-left:8px;"></span>' : ''}
                    </div>`
                ).join('');
                dropdown.style.display = 'block';
            }
        });
        // 新增：悬停时自动标记为已读
        fetch('/api/messages/mark_all_read', {method:'POST'}).then(()=>{
            setTimeout(updateMessageRedDot, 200);
        });
        if (hideTimer) clearTimeout(hideTimer);
    });
    link.addEventListener('mouseleave', function() {
        hideTimer = setTimeout(()=>{ dropdown.style.display = 'none'; }, 180);
    });
    dropdown.addEventListener('mouseenter', function() {
        if (hideTimer) clearTimeout(hideTimer);
        dropdown.style.display = 'block';
    });
    dropdown.addEventListener('mouseleave', function() {
        hideTimer = setTimeout(()=>{ dropdown.style.display = 'none'; }, 180);
    });
}
document.addEventListener('DOMContentLoaded', createMessageDropdown);

// 用户头像点击跳转到个人信息页面
function setupUserDropdown() {
    const toggle = document.getElementById('userDropdownToggle');
    if (!toggle) return;
    
    // 直接跳转到个人信息页面
    toggle.addEventListener('click', function(e) {
        window.location.href = '/profile';
    });
}

document.addEventListener('DOMContentLoaded', setupUserDropdown); 