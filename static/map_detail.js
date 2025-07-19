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

// 地图详情页右侧浮窗，仅用于记录悬停
(function(){
    if (window._recordPopupFloatInit) return;
    window._recordPopupFloatInit = true;
    document.addEventListener('DOMContentLoaded', function() {
        let popup = document.createElement('div');
        popup.className = 'record-popup-float';
        popup.innerHTML = '<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;color:#333;">自定义内容</div>';
        document.body.appendChild(popup);
        function getDifficultyClass(level) {
            if (!level) return 'difficulty-junior';
            if (['入门', '初级'].includes(level)) return 'difficulty-junior';
            if (['中级', '中级+'].includes(level)) return 'difficulty-middle';
            if (['高级', '高级+'].includes(level)) return 'difficulty-high';
            if (['骨灰', '骨灰+'].includes(level)) return 'difficulty-legend';
            if (['火星', '火星+'].includes(level)) return 'difficulty-mars';
            if (/^极限/.test(level)) return 'difficulty-extreme';
            if (/^死亡/.test(level)) return 'difficulty-death';
            return 'difficulty-junior';
        }
        document.querySelectorAll('.map-detail-records-table tbody tr.record-row').forEach(function(row) {
            row.addEventListener('mouseenter', function(e) {
                let resonable = row.getAttribute('data-resonable');
                let userSuggest = row.getAttribute('data-suggest-level');
                let mapLevel = row.getAttribute('data-map-level');
                let showLevel = '';
                if (resonable === 'Y') {
                    showLevel = mapLevel || '未知';
                } else {
                    showLevel = userSuggest || '未知';
                }
                let levelText = showLevel.replace(/^体感:/, '');
                let diffClass = getDifficultyClass(levelText);
                popup.innerHTML = `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
                    <span class="popup-diff-label">体感:</span>
                    <span class="difficulty-tag ${diffClass} popup-diff-value">${levelText}</span>
                </div>`;
                let rect = row.getBoundingClientRect();
                popup.style.top = (rect.top + rect.height/2 - popup.offsetHeight/2) + 'px';
                popup.classList.add('active');
            });
            row.addEventListener('mouseleave', function(e) {
                popup.classList.remove('active');
            });
        });
    });
})(); 