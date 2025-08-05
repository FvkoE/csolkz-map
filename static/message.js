// 私信页面JavaScript
document.addEventListener('DOMContentLoaded', function() {
    console.log('私信页面已加载');
    
    // 全局夜间模式切换按钮逻辑
    function setupNightModeToggle() {
        const btn = document.getElementById('nightModeToggle');
        if (!btn) return;
        const iconWrap = document.getElementById('nightModeIconWrap');
        const sun = document.getElementById('nightModeIconSun');
        const moon = document.getElementById('nightModeIconMoon');
        // 读取本地存储，决定初始模式
        let isNight = localStorage.getItem('nightMode') === 'true';
        function applyMode() {
            if (isNight) {
                sun.style.display = 'none';
                moon.style.display = 'block';
                iconWrap.style.transform = 'rotate(-180deg) scale(1.1)';
                document.body.classList.add('night-mode');
            } else {
                sun.style.display = 'block';
                moon.style.display = 'none';
                iconWrap.style.transform = 'rotate(0deg) scale(1)';
                document.body.classList.remove('night-mode');
            }
        }
        btn.onclick = function() {
            isNight = !isNight;
            localStorage.setItem('nightMode', isNight);
            applyMode();
        };
        applyMode();
    }
    
    // 初始化夜间模式切换
    setupNightModeToggle();
    
    // 加载消息列表
    function fetchMessages() {
        fetch('/api/messages?all=1').then(r=>r.json()).then(data=>{
            if (!data.success) return;
            const list = document.getElementById('messageList');
            list.innerHTML = '';
            if (!data.messages.length) {
                list.innerHTML = '<li style="color:#aaa;text-align:center;padding:2em 0;">暂无消息</li>';
                return;
            }
            data.messages.forEach((msg, idx) => {
                const li = document.createElement('li');
                li.dataset.id = msg.id;
                li.innerHTML = `
                    <span class="msg-content">${msg.content}</span>
                    <span class="msg-time">${msg.create_time}${!msg.is_read ? '<span class=\'msg-unread-dot\'></span>' : ''}</span>
                `;
                li.onclick = function() {
                    document.querySelectorAll('#messageList li').forEach(el=>el.classList.remove('active'));
                    li.classList.add('active');
                    showMessageDetail(msg);
                };
                if(idx===0) { // 默认选中第一条
                    setTimeout(()=>li.click(), 0);
                }
                list.appendChild(li);
            });
        });
    }

    // 显示消息详情
    function showMessageDetail(msg) {
        const detail = document.getElementById('messageDetail');
        detail.innerHTML = `
            <div style="font-size:1.15em;margin-bottom:1.2em;">${msg.content}</div>
        `;
    }

    fetchMessages();
}); 