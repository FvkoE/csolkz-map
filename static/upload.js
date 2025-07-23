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
    let confirmedMap = null;

    function showResult(data) {
        if (!data) {
            resultBox.style.display = 'none';
            confirmBtn.style.display = 'none';
            searchInput.disabled = false;
            confirmedMap = null;
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
        confirmedMap = data; // 保存完整地图对象
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
        // confirmedValue = searchInput.value.trim(); // 删除
        // 只用confirmedMap
    });

    resetBtn.addEventListener('click', function() {
        searchInput.disabled = false;
        searchBtn.disabled = false;
        resetBtn.style.display = 'none';
        resultBox.style.display = 'none';
        searchInput.focus();
        confirmedMap = null;
    });

    // ===================================
    //  视频解析功能
    // ===================================
    const videoUrlInput = document.getElementById('demo-video-url');
    const videoPlayer = document.querySelector('.upload-video-player');
    const parseStatus = document.getElementById('upload-video-parse-status');
    const parseStatusIcon = document.getElementById('parse-status-icon');
    const parseStatusText = document.getElementById('parse-status-text');
    
    let parseTimeout = null;

    // 显示解析状态
    function showParseStatus(type, message) {
        parseStatus.style.display = 'flex';
        parseStatusIcon.className = 'parse-status-icon ' + type;
        parseStatusText.textContent = message;
        
        if (type === 'loading') {
            parseStatusIcon.innerHTML = '⟳';
        } else if (type === 'success') {
            parseStatusIcon.innerHTML = '✓';
        } else if (type === 'error') {
            parseStatusIcon.innerHTML = '✗';
        }
    }

    // 隐藏解析状态
    function hideParseStatus() {
        parseStatus.style.display = 'none';
    }

    // 解析视频链接
    function parseVideoUrl(url) {
        videoPlayer.innerHTML = '';
        showParseStatus('loading', '正在解析视频链接...');
        if (parseTimeout) clearTimeout(parseTimeout);
        parseTimeout = setTimeout(() => {
            showParseStatus('error', '视频解析超时，请检查链接是否正确');
        }, 10000);

        let embedUrl = null, isDirectVideo = false;

        // 直链mp4/ogg/webm
        if (/\.(mp4|webm|ogg)(\?.*)?$/i.test(url)) {
            isDirectVideo = true;
        }
        // 支持B站视频链接
        else if (url.includes('bilibili.com')) {
            const bvMatch = url.match(/BV\w+/);
            const avMatch = url.match(/av(\d+)/);
            if (bvMatch) {
                embedUrl = `https://player.bilibili.com/player.html?bvid=${bvMatch[0]}&page=1&high_quality=1&danmaku=0`;
            } else if (avMatch) {
                embedUrl = `https://player.bilibili.com/player.html?aid=${avMatch[1]}&page=1&high_quality=1&danmaku=0`;
            }
        }
        // 支持YouTube视频链接
        else if (url.includes('youtube.com') || url.includes('youtu.be')) {
            const videoId = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
            if (videoId) {
                embedUrl = `https://www.youtube.com/embed/${videoId[1]}`;
            }
        }
        // 支持腾讯视频链接
        else if (url.includes('v.qq.com')) {
            const videoId = url.match(/\/x\/cover\/([^\/\n?#]+)/);
            if (videoId) {
                embedUrl = `https://v.qq.com/txp/iframe/player.html?vid=${videoId[1]}`;
            }
        }
        // 支持优酷视频链接
        else if (url.includes('youku.com')) {
            const videoId = url.match(/id_([^\.\n?#]+)/);
            if (videoId) {
                embedUrl = `https://player.youku.com/embed/${videoId[1]}`;
            }
        }
        // 支持爱奇艺视频链接
        else if (url.includes('iqiyi.com')) {
            const videoId = url.match(/v_([^\.\n?#]+)/);
            if (videoId) {
                embedUrl = `https://www.iqiyi.com/v_${videoId[1]}.html`;
            }
        }
        // 支持抖音视频链接
        else if (url.includes('douyin.com')) {
            // 支持 https://www.douyin.com/video/xxxxxxx 和 https://v.douyin.com/xxxxxxx
            let videoId = null;
            const match1 = url.match(/douyin\.com\/video\/(\d+)/);
            if (match1) {
                videoId = match1[1];
            } else {
                // 短链跳转需后端解析，前端无法直接获取真实id，暂时只支持标准长链
            }
            if (videoId) {
                embedUrl = `https://www.douyin.com/video/${videoId}`;
            }
        }

        if (isDirectVideo) {
            const video = document.createElement('video');
            video.src = url;
            video.controls = true;
            video.autoplay = true;
            video.style.background = '#000';
            video.onloadeddata = function() {
                clearTimeout(parseTimeout);
                showParseStatus('success', '视频解析成功');
                setTimeout(hideParseStatus, 3000);
            };
            video.onerror = function() {
                clearTimeout(parseTimeout);
                showParseStatus('error', '视频加载失败，请检查链接是否正确');
            };
            videoPlayer.appendChild(video);
        } else if (embedUrl) {
            const iframe = document.createElement('iframe');
            iframe.src = embedUrl;
            iframe.allowFullscreen = true;
            iframe.onload = function() {
                clearTimeout(parseTimeout);
                showParseStatus('success', '视频解析成功');
                setTimeout(hideParseStatus, 3000);
            };
            iframe.onerror = function() {
                clearTimeout(parseTimeout);
                showParseStatus('error', '视频加载失败，请检查链接是否正确');
            };
            videoPlayer.appendChild(iframe);
        } else {
            clearTimeout(parseTimeout);
            showParseStatus('error', '不支持的视频链接格式，请使用B站、YouTube、腾讯视频等平台链接');
        }
    }

    // 监听视频链接输入
    if (videoUrlInput) {
        let inputTimeout = null;
        
        videoUrlInput.addEventListener('input', function() {
            const url = this.value.trim();
            
            // 清除之前的超时
            if (inputTimeout) {
                clearTimeout(inputTimeout);
            }
            
            // 如果输入框为空，清空视频播放器
            if (!url) {
                videoPlayer.innerHTML = '';
                hideParseStatus();
                return;
            }
            
            // 延迟1秒后开始解析，避免频繁解析
            inputTimeout = setTimeout(() => {
                parseVideoUrl(url);
            }, 1000);
        });
        
        // 监听回车键
        videoUrlInput.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                const url = this.value.trim();
                if (url) {
                    parseVideoUrl(url);
                }
            }
        });
    }

    // 类型选择逻辑
    const demoTypeRadios = document.querySelectorAll('input[name="demo-type"]');
    const savepointExtraInputs = document.getElementById('savepoint-extra-inputs');
    function updateSavepointInputs() {
        const checked = document.querySelector('input[name="demo-type"]:checked');
        if (checked && checked.value === '存点') {
            savepointExtraInputs.style.display = '';
            savepointExtraInputs.innerHTML =
                '<div class="savepoint-extra-group">' +
                '<label>存点 <input type="number" min="0" class="upload-demo-input" name="savepoint-count" placeholder="选填"></label>' +
                '<label>读点 <input type="number" min="0" class="upload-demo-input" name="loadpoint-count" placeholder="选填"></label>' +
                '</div>';
        } else {
            savepointExtraInputs.style.display = 'none';
            savepointExtraInputs.innerHTML = '';
        }
    }
    demoTypeRadios.forEach(radio => {
        radio.addEventListener('change', updateSavepointInputs);
    });
    // 页面加载时初始化
    updateSavepointInputs();

    // 难度选择逻辑
    const difficultyRadios = document.querySelectorAll('input[name="demo-difficulty"]');
    const difficultySuggestSelect = document.getElementById('difficulty-suggest-select');
    const allLevels = [
        '入门','初级','中级','中级+','高级','高级+','骨灰','骨灰+','火星','火星+',
        '极限(1)','极限(2)','极限(3)','极限(4)',
        '死亡(1)','死亡(2)','死亡(3)','死亡(4)'
    ];
    function updateDifficultySuggest() {
        const checked = document.querySelector('input[name="demo-difficulty"]:checked');
        if (checked && checked.value === '否') {
            difficultySuggestSelect.style.display = '';
            let html = '<label style="margin-right:6px;">建议</label>';
            html += '<select class="upload-demo-input" name="suggest-level" style="width:110px;">';
            allLevels.forEach(lv => {
                html += `<option value="${lv}">${lv}</option>`;
            });
            html += '</select>';
            difficultySuggestSelect.innerHTML = html;
        } else {
            difficultySuggestSelect.style.display = 'none';
            difficultySuggestSelect.innerHTML = '';
        }
    }
    difficultyRadios.forEach(radio => {
        radio.addEventListener('change', updateDifficultySuggest);
    });
    updateDifficultySuggest();

    // ========== 上传记录提交 ==========
    const submitBtn = document.querySelector('.submit-btn');
    if (submitBtn) {
        submitBtn.addEventListener('click', function() {
            // 1. 地图ID（需已确认）
            let mapId = confirmedMap && confirmedMap.id;
            if (!mapId) {
                alert('请先搜索并确认地图');
                return;
            }
            // 2. 视频链接
            const videoUrl = videoUrlInput.value.trim();
            if (!videoUrl) {
                alert('请填写视频链接');
                return;
            }
            // 只允许bilibili和抖音
            if (!/^(https?:\/\/)?(www\.)?(bilibili\.com|b23\.tv|douyin\.com)\//.test(videoUrl)) {
                alert('只允许提交bilibili和抖音的视频链接！');
                return;
            }
            // 3. 类型
            const typeRadio = document.querySelector('input[name="demo-type"]:checked');
            let mode = typeRadio ? typeRadio.value : '';
            if (!mode) {
                alert('请选择类型');
                return;
            }
            // 类型转换
            if (mode === '存点') mode = 'nub';
            else if (mode === '裸跳') mode = 'pro';
            // 4. 存点/读点
            let cp = null, tp = null;
            if (mode === 'nub') { // 存点
                const cpInput = document.querySelector('input[name="savepoint-count"]');
                const tpInput = document.querySelector('input[name="loadpoint-count"]');
                if (cpInput && cpInput.value.trim() !== '') {
                    cp = parseInt(cpInput.value);
                    if (isNaN(cp) || cp < 0) {
                        alert('存点数量必须为非负整数！');
                        return;
                    }
                }
                if (tpInput && tpInput.value.trim() !== '') {
                    tp = parseInt(tpInput.value);
                    if (isNaN(tp) || tp < 0) {
                        alert('读点数量必须为非负整数！');
                        return;
                    }
                }
            }
            // 5. 难度
            const diffRadio = document.querySelector('input[name="demo-difficulty"]:checked');
            const difficulty = diffRadio ? diffRadio.value : '';
            let resonable = '';
            if (difficulty === '是') resonable = 'Y';
            else if (difficulty === '否') resonable = 'N';
            else resonable = '';
            if (!resonable) {
                alert('请选择难度是否合理');
                return;
            }
            // 6. 建议难度
            let suggestLevel = null;
            if (difficulty === '否') {
                const sel = document.querySelector('select[name="suggest-level"]');
                suggestLevel = sel ? sel.value : null;
            }
            // 7. 完成时间
            const min = document.getElementById('finish-min-input').value.trim();
            const sec = document.getElementById('finish-sec-input').value.trim();
            const hs = document.getElementById('finish-hs-input').value.trim();
            if (!min && !sec && !hs) {
                alert('请填写完成时间');
                return;
            }
            let finishTime = 0;
            if (min) finishTime += parseInt(min) * 60;
            if (sec) finishTime += parseInt(sec);
            if (hs) finishTime += parseInt(hs) / 100;
            // 8. 其他必填项（user_rank, score, first_clear_score, is_first_clear）
            let userRank = 0, score = 0, firstClearScore = 0, isFirstClear = false;
            let userId = window.user_id || null;
            if (!userId) {
                const userIdInput = document.getElementById('current-user-id');
                if (userIdInput) userId = userIdInput.value;
            }
            if (!userId) {
                alert('无法获取当前用户ID，请重新登录');
                return;
            }
            // 组装数据
            const payload = {
                maplist_id: mapId,
                finish_time: finishTime,
                user_rank: userRank,
                score: score,
                first_clear_score: firstClearScore,
                mode: mode,
                is_first_clear: isFirstClear,
                video_url: videoUrl,
                cp: cp,
                tp: tp,
                resonable: resonable,
                SUGGEST_LEVEL: suggestLevel,
                user_id: userId
            };
            fetch('/upload_record', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(payload)
            })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    alert('上传成功！');
                } else {
                    alert('上传失败：' + (data.msg || '未知错误'));
                }
            })
            .catch(() => alert('网络错误，上传失败'));
        });
    }
});
