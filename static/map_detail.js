// 夜间模式按钮动画和图标切换，并切换页面主题
(function() {
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
})();

// 用户下拉菜单交互
function setupUserDropdown() {
    const toggle = document.getElementById('userDropdownToggle');
    if (!toggle) return;
    // 直接跳转到个人信息页面
    toggle.addEventListener('click', function(e) {
        window.location.href = '/profile';
    });
}
window.addEventListener('DOMContentLoaded', setupUserDropdown);

// 地图详情页排行榜切换

document.addEventListener('DOMContentLoaded', function() {
    const proBtn = document.getElementById('proViewBtn');
    const nubBtn = document.getElementById('nubViewBtn');
    const proTable = document.getElementById('pro-records-table');
    const nubTable = document.getElementById('nub-records-table');
    if (proBtn && nubBtn && proTable && nubTable) {
        proBtn.addEventListener('click', function() {
            proBtn.classList.add('active');
            nubBtn.classList.remove('active');
            proTable.style.display = '';
            nubTable.style.display = 'none';
        });
        nubBtn.addEventListener('click', function() {
            nubBtn.classList.add('active');
            proBtn.classList.remove('active');
            nubTable.style.display = '';
            proTable.style.display = 'none';
        });
    }
}); 