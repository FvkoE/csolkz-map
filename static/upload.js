// 地图搜索功能

document.addEventListener('DOMContentLoaded', function() {
    const searchBtn = document.getElementById('map-search-btn');
    const searchInput = document.getElementById('map-id-input');
    const resultBox = document.getElementById('map-search-result-detail');
    const profileBox = document.getElementById('upload-map-profile');
    const img = document.getElementById('map-result-img');
    const title = document.getElementById('map-result-title');
    const meta = document.getElementById('map-result-meta');
    const desc = document.getElementById('map-result-desc');
    const confirmBtn = document.getElementById('map-confirm-btn');
    const resetBtn = document.getElementById('map-reset-btn');
    let confirmedValue = '';

    function showResult(data) {
        if (!data) {
            resultBox.style.display = 'none';
            confirmBtn.style.display = 'none';
            searchInput.disabled = false;
            confirmedValue = '';
            return;
        }
        // 填充内容
        img.src = data.image_url || '/static/default_avatar.svg';
        title.textContent = data.name || '未找到地图';
        meta.innerHTML =
            `大区：${data.region || '-'}<br>` +
            `难度：${data.level || '-'}<br>` +
            `作者：${data.mapper || '-'}<br>` +
            `ID：${data.id}`;
        desc.textContent = data.description || '';
        resultBox.style.display = 'flex';
        confirmBtn.style.display = 'inline-block';
        searchInput.disabled = false;
        confirmedValue = '';
    }

    function searchMap() {
        const query = searchInput.value.trim();
        if (!query) {
            resultBox.style.display = 'none';
            return;
        }
        fetch(`/api/map_search?query=${encodeURIComponent(query)}`)
            .then(res => res.json())
            .then(resp => {
                if (resp.success && resp.data) {
                    showResult(resp.data);
                } else {
                    showResult(null);
                }
            })
            .catch(() => {
                showResult(null);
            });
    }

    searchBtn.addEventListener('click', searchMap);
    searchInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            searchMap();
        }
    });

    confirmBtn.addEventListener('click', function() {
        searchInput.disabled = true;
        searchBtn.disabled = true;
        confirmBtn.style.display = 'none';
        resetBtn.style.display = 'inline-block';
        confirmedValue = searchInput.value.trim();
        // 你可以在这里将confirmedValue用于后续提交
    });

    resetBtn.addEventListener('click', function() {
        searchInput.disabled = false;
        searchBtn.disabled = false;
        resetBtn.style.display = 'none';
        resultBox.style.display = 'none';
        searchInput.focus();
        confirmedValue = '';
    });
});
