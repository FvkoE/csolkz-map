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
    const dropdown = document.querySelector('.user-dropdown');
    const toggle = document.getElementById('userDropdownToggle');
    const menu = document.getElementById('userDropdownMenu');
    if (!dropdown || !toggle || !menu) return;
    // 切换下拉
    toggle.addEventListener('click', function(e) {
        e.stopPropagation();
        dropdown.classList.toggle('open');
    });
    // 点击外部关闭
    document.addEventListener('click', function(e) {
        if (!dropdown.contains(e.target)) {
            dropdown.classList.remove('open');
        }
    });
}
window.addEventListener('DOMContentLoaded', setupUserDropdown); 