document.addEventListener('DOMContentLoaded', function() {

    
    // 全局变量
    let currentPage = 1;
    let currentType = 'wr';
    let isLoading = false;
    let hasMoreData = true;
    let allRankData = [];
    
    // 夜间模式切换功能
    function setupNightModeToggle() {
        const toggle = document.getElementById('nightModeToggle');
        const sunIcon = document.getElementById('nightModeIconSun');
        const moonIcon = document.getElementById('nightModeIconMoon');
        
        // 从localStorage获取夜间模式状态
        const isNightMode = localStorage.getItem('nightMode') === 'true';
        
        // 初始化页面状态
        if (isNightMode) {
            document.body.classList.add('night-mode');
            sunIcon.style.display = 'none';
            moonIcon.style.display = 'block';
        } else {
            document.body.classList.remove('night-mode');
            sunIcon.style.display = 'block';
            moonIcon.style.display = 'none';
        }
        
        // 切换按钮点击事件
        toggle.addEventListener('click', function() {
            const isCurrentlyNightMode = document.body.classList.contains('night-mode');
            
            if (isCurrentlyNightMode) {
                // 切换到日间模式
                document.body.classList.remove('night-mode');
                sunIcon.style.display = 'block';
                moonIcon.style.display = 'none';
                localStorage.setItem('nightMode', 'false');
            } else {
                // 切换到夜间模式
                document.body.classList.add('night-mode');
                sunIcon.style.display = 'none';
                moonIcon.style.display = 'block';
                localStorage.setItem('nightMode', 'true');
            }
        });
        
        // 按钮悬停效果
        toggle.addEventListener('mouseenter', function() {
            this.style.transform = 'scale(1.1)';
        });
        
        toggle.addEventListener('mouseleave', function() {
            this.style.transform = 'scale(1)';
        });
    }
    
    // 初始化夜间模式切换
    setupNightModeToggle();
    
    // 排行榜切换功能
    function setupRankToggle() {
        const toggleBtns = document.querySelectorAll('.rank-toggle-btn');
        
        toggleBtns.forEach(btn => {
            btn.addEventListener('click', function() {
                const type = this.dataset.type;
                if (type === currentType) return; // 如果点击的是当前激活的按钮，不做任何操作
                
                // 移除所有按钮的active状态
                toggleBtns.forEach(b => b.classList.remove('active'));
                // 添加当前按钮的active状态
                this.classList.add('active');
                
                // 重置状态并加载对应类型的排行榜数据
                currentPage = 1;
                hasMoreData = true;
                allRankData = [];
                loadRankData(type, 1, false);
            });
        });
    }
    
    // 加载排行榜数据
    function loadRankData(type, page = 1, append = false) {
        if (isLoading) return;
        
        isLoading = true;
        currentType = type;
        
        const podiumContainer = document.getElementById('podium-container');
        const rankList = document.getElementById('rank-list');
        
        // 如果是第一页，显示加载状态
        if (page === 1) {
            podiumContainer.innerHTML = '<div class="loading-message">加载中...</div>';
            rankList.innerHTML = '<div class="loading-message">加载中...</div>';
            allRankData = [];
        } else {
            // 显示加载更多指示器
            showLoadMoreIndicator();
        }
        
        // 使用真实API调用
        fetch(`/api/rank_data?type=${type}&page=${page}&per_page=20`)
            .then(response => response.json())
            .then(data => {

                if (data.success) {
                    if (page === 1) {
                        // 第一页数据，重置所有数据
                        allRankData = data.data;
                        currentPage = 1;
                        hasMoreData = data.has_more;
                        renderRankData(allRankData, type);
                    } else {
                        // 追加数据
                        allRankData = allRankData.concat(data.data);
                        currentPage = page;
                        hasMoreData = data.has_more;
                        renderRankData(allRankData, type, true);
                    }
                } else {
                    showError('加载排行榜数据失败');
                }
            })
            .catch(error => {

                showError('加载排行榜数据失败');
            })
            .finally(() => {
                isLoading = false;
                hideLoadMoreIndicator();
            });
    }
    
    // 渲染排行榜数据
    function renderRankData(rankData, type, append = false) {
        const podiumContainer = document.getElementById('podium-container');
        const rankList = document.getElementById('rank-list');
        
        if (!rankData || rankData.length === 0) {
            podiumContainer.innerHTML = '<div class="no-data-message">暂无排行榜数据</div>';
            rankList.innerHTML = '<div class="no-data-message">暂无排行榜数据</div>';
            return;
        }
        
        // 渲染前三名领奖台（只在第一页时渲染）
        if (!append) {
            const podiumData = rankData.slice(0, 3);
            podiumContainer.innerHTML = podiumData.map((user, index) => {
                const rank = index + 1;
                const podiumClass = rank === 1 ? 'podium-first' : rank === 2 ? 'podium-second' : 'podium-third';
                const primaryValue = type === 'wr' ? user.wr_count : user.total_score;
                const primaryLabel = type === 'wr' ? 'WR数量' : '总积分';
                const secondaryValue = type === 'wr' ? user.total_score : user.wr_count;
                const secondaryLabel = type === 'wr' ? '总积分' : 'WR数量';
                
                // 处理avatar路径，避免重复
                let avatarSrc = 'static/default_avatar.svg';
                if (user.avatar && user.avatar !== 'None') {
                    if (user.avatar.startsWith('avatars/')) {
                        avatarSrc = `static/${user.avatar}`;
                    } else {
                        avatarSrc = `static/avatars/${user.avatar}`;
                    }
                }
                return `
                    <div class="podium-item ${podiumClass}">
                        <div class="podium-rank">${rank}</div>
                        <div class="podium-avatar" style="cursor: pointer;" onclick="window.open('/profile/${user.user_id}', '_blank')">
                            <img src="${avatarSrc}" alt="用户头像" onerror="this.src='static/default_avatar.svg'">
                        </div>
                        <div class="podium-name" style="cursor: pointer;" onclick="window.open('/profile/${user.user_id}', '_blank')">${user.username}</div>
                        <div class="podium-stats">
                            <div class="stat-item">
                                <span class="stat-label">${primaryLabel}</span>
                                <span class="stat-value">${primaryValue.toLocaleString()}</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-label">${secondaryLabel}</span>
                                <span class="stat-value">${secondaryValue.toLocaleString()}</span>
                            </div>
                        </div>
                    </div>
                `;
            }).join('');
        }
        
        // 渲染其他排名列表
        if (append) {
                            // 追加模式：只渲染新加载的数据
                // 新加载的数据是当前页面的数据，需要计算正确的排名
                const newData = rankData.slice(-10); // 获取最后10条数据（第二页的数据）
            
            const listHTML = newData.map((user, index) => {
                // 新加载的数据从第21名开始（因为第一页显示了第4-20名）
                const rank = 21 + index;
                
                const primaryValue = type === 'wr' ? user.wr_count : user.total_score;
                const secondaryValue = type === 'wr' ? user.total_score : user.wr_count;
                
                // 处理avatar路径，避免重复
                let avatarSrc = 'static/default_avatar.svg';
                if (user.avatar && user.avatar !== 'None') {
                    if (user.avatar.startsWith('avatars/')) {
                        avatarSrc = `static/${user.avatar}`;
                    } else {
                        avatarSrc = `static/avatars/${user.avatar}`;
                    }
                }
                return `
                    <div class="rank-item">
                        <div class="rank-number">${rank}</div>
                        <div class="rank-avatar" style="cursor: pointer;" onclick="window.open('/profile/${user.user_id}', '_blank')">
                            <img src="${avatarSrc}" alt="用户头像" onerror="this.src='static/default_avatar.svg'">
                        </div>
                        <div class="rank-info">
                            <div class="rank-name" style="cursor: pointer;" onclick="window.open('/profile/${user.user_id}', '_blank')">${user.username}</div>
                            <div class="rank-stats">
                                <span class="rank-wr">WR: ${user.wr_count}</span>
                                <span class="rank-score">积分: ${user.total_score.toLocaleString()}</span>
                            </div>
                        </div>
                    </div>
                `;
            }).join('');
            
            // 追加到现有列表
            rankList.innerHTML += listHTML;
        } else {
            // 重置模式：显示第4名之后的所有数据
            const listData = rankData.slice(3);
            
            if (listData.length > 0) {
                const listHTML = listData.map((user, index) => {
                                    const rank = index + 4;
                    
                    const primaryValue = type === 'wr' ? user.wr_count : user.total_score;
                    const secondaryValue = type === 'wr' ? user.total_score : user.wr_count;
                    
                    // 处理avatar路径，避免重复
                    let avatarSrc = 'static/default_avatar.svg';
                    if (user.avatar && user.avatar !== 'None') {
                        if (user.avatar.startsWith('avatars/')) {
                            avatarSrc = `static/${user.avatar}`;
                        } else {
                            avatarSrc = `static/avatars/${user.avatar}`;
                        }
                    }
                    return `
                        <div class="rank-item">
                            <div class="rank-number">${rank}</div>
                            <div class="rank-avatar" style="cursor: pointer;" onclick="window.open('/profile/${user.user_id}', '_blank')">
                                <img src="${avatarSrc}" alt="用户头像" onerror="this.src='static/default_avatar.svg'">
                            </div>
                            <div class="rank-info">
                                <div class="rank-name" style="cursor: pointer;" onclick="window.open('/profile/${user.user_id}', '_blank')">${user.username}</div>
                                <div class="rank-stats">
                                    <span class="rank-wr">WR: ${user.wr_count}</span>
                                    <span class="rank-score">积分: ${user.total_score.toLocaleString()}</span>
                                </div>
                            </div>
                        </div>
                    `;
                }).join('');
                
                                 rankList.innerHTML = listHTML;
             } else {
                 rankList.innerHTML = '<div class="no-data-message">暂无其他排名数据</div>';
             }
         }
        
        // 添加加载更多指示器
        if (hasMoreData) {
            addLoadMoreIndicator();
        }
    }
    
    // 显示错误信息
    function showError(message) {
        const podiumContainer = document.getElementById('podium-container');
        const rankList = document.getElementById('rank-list');
        podiumContainer.innerHTML = `<div class="error-message">${message}</div>`;
        rankList.innerHTML = `<div class="error-message">${message}</div>`;
    }
    
    // 添加加载更多指示器
    function addLoadMoreIndicator() {
        const rankList = document.getElementById('rank-list');
        const existingIndicator = rankList.querySelector('.load-more-indicator');
        if (!existingIndicator) {
            const indicator = document.createElement('div');
            indicator.className = 'load-more-indicator';
            indicator.innerHTML = `
                <div class="load-more-content">
                    <div class="load-more-spinner"></div>
                    <span>向下滚动加载更多</span>
                </div>
            `;
            rankList.appendChild(indicator);
        }
    }
    
    // 显示加载更多指示器
    function showLoadMoreIndicator() {
        const indicator = document.querySelector('.load-more-indicator');
        if (indicator) {
            indicator.style.display = 'block';
        }
    }
    
    // 隐藏加载更多指示器
    function hideLoadMoreIndicator() {
        const indicator = document.querySelector('.load-more-indicator');
        if (indicator) {
            indicator.style.display = 'none';
        }
    }
    

    
    // 加载更多数据
    function loadMoreData() {
        if (isLoading || !hasMoreData) return;
        

        loadRankData(currentType, currentPage + 1, true);
    }
    
    // 滚动监听
    function setupScrollListener() {
        window.addEventListener('scroll', () => {
            if (isLoading || !hasMoreData) return;
            
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            const windowHeight = window.innerHeight;
            const documentHeight = document.documentElement.scrollHeight;
            
            // 当滚动到距离底部100px时触发加载
            if (scrollTop + windowHeight >= documentHeight - 100) {
                loadMoreData();
            }
        });
    }
    
    // 初始化排行榜切换功能
    setupRankToggle();
    
    // 设置滚动监听
    setupScrollListener();
    
    // 页面加载时自动加载WR排名数据
    loadRankData('wr');
}); 