// 模态框操作
window.modal = {
    // 添加地图相关操作
    add: {
        open() {
            // 每次打开时，都从sessionStorage加载草稿，确保数据恢复
            const addMapForm = document.querySelector('.add-map-form:not(.admin-add-map-form)');
            if (addMapForm) {
                console.log('[草稿] 模态框已打开，执行加载操作...');
                loadDraft(addMapForm);
            }
            document.getElementById('addModal').style.display = 'flex';
        },
        close() {
            document.getElementById('addModal').style.display = 'none';
            // 不再清空表单，以便保留用户输入
            // document.querySelector('.add-map-form').reset();
            // document.querySelector('.file-preview').innerHTML = '';
        }
    },
    // 点击模态框外部关闭处理
    handleOutsideClick(event) {
        if (event.target.classList.contains('modal')) {
            if (event.target.id === 'addModal') {
                window.modal.add.close();
            }
        }
    }
};

// 图片预览功能
window.imagePreview = {
    // 初始化图片预览功能
    init() {
        // 添加地图的图片预览
        const addImageInput = document.getElementById('mapImage');
        if (addImageInput) {
            addImageInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file && !validateImageFile(file)) {
                    e.target.value = '';
                    const userForm = document.querySelector('.add-map-form:not(.admin-add-map-form)');
                    if (userForm) {
                        userForm.querySelector('.file-preview').innerHTML = '';
                    }
                    return;
                }
                window.imagePreview.handleImageChange(e, '.file-preview');
            });
        }

        // 修改地图的图片预览
        const editImageInput = document.getElementById('editMapImage');
        if (editImageInput) {
            editImageInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file && !validateImageFile(file)) {
                    e.target.value = '';
                    document.querySelector('.edit-map-form .file-preview').innerHTML = '';
                    return;
                }
                window.imagePreview.handleImageChange(e, '.file-preview', true);
            });
        }
    },

    // 处理图片变化
    handleImageChange(event, previewSelector, isEdit = false) {
        const file = event.target.files[0];
        const preview = event.target.closest('.file-upload').querySelector(previewSelector);

        if (!preview) return; // 安全检查

        if (!file) {
            if (!isEdit) {
                preview.innerHTML = '';
            }
            return;
        }

        const reader = new FileReader();
        reader.onload = function(e) {
            if(isEdit) {
                preview.innerHTML = `<p class="current-image-text">新图片预览：</p>\n                 <img class="edit-modal-image-preview" src="${e.target.result}" alt="新图片预览">`;
            } else {
                preview.innerHTML = `<img src="${e.target.result}" alt="预览图">`;
            }
        };
        reader.readAsDataURL(file);
    }
};

// =====================
// 表单草稿功能 (Session Storage)
// =====================
const DRAFT_KEY_PREFIX = 'add_map_draft_';

// 保存草稿
function saveDraft(formElement) {
    if (!formElement) return;
    console.log('[草稿] 正在保存...');
    const formData = new FormData(formElement);
    for (let [key, value] of formData.entries()) {
        // 不保存文件和空字段
        if (key !== 'image' && value) {
            console.log(`  - 保存字段: ${key}, 值: ${value}`);
            sessionStorage.setItem(DRAFT_KEY_PREFIX + key, value);
        }
    }
    
    // 保存大区按钮选中状态
    const activeRegionBtns = formElement.querySelectorAll('#add-map-region-btn-group .region-btn.active');
    if (activeRegionBtns.length > 0) {
        const selectedRegions = Array.from(activeRegionBtns).map(btn => btn.dataset.value);
        sessionStorage.setItem(DRAFT_KEY_PREFIX + 'region_btns', JSON.stringify(selectedRegions));
    } else {
        sessionStorage.removeItem(DRAFT_KEY_PREFIX + 'region_btns');
    }
}

// 加载草稿
function loadDraft(formElement) {
    if (!formElement) return;
    console.log('[草稿] 正在加载...');
    for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key.startsWith(DRAFT_KEY_PREFIX)) {
            const formKey = key.replace(DRAFT_KEY_PREFIX, '');
            const element = formElement.elements[formKey];
            const value = sessionStorage.getItem(key);
            if (element && value) {
                console.log(`  - 加载字段: ${formKey}, 值: ${value}`);
                element.value = value;
            }
        }
    }
    
    // 恢复大区按钮选中状态
    const savedRegions = sessionStorage.getItem(DRAFT_KEY_PREFIX + 'region_btns');
    if (savedRegions) {
        try {
            const selectedRegions = JSON.parse(savedRegions);
            formElement.querySelectorAll('#add-map-region-btn-group .region-btn').forEach(btn => {
                btn.classList.toggle('active', selectedRegions.includes(btn.dataset.value));
            });
        } catch (e) {
            console.error('解析保存的大区数据失败:', e);
        }
    }
}

// 清除草稿
function clearDraft(formElement) {
    if (!formElement) return;
    console.log('[草稿] 正在清除...');
    const keysToRemove = [];
    for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key.startsWith(DRAFT_KEY_PREFIX)) {
            keysToRemove.push(key);
        }
    }
    keysToRemove.forEach(key => sessionStorage.removeItem(key));
    // 同时重置表单
    formElement.reset();
    document.querySelector('.file-preview').innerHTML = '';
    
    // 清除大区按钮选中状态
    formElement.querySelectorAll('#add-map-region-btn-group .region-btn').forEach(btn => {
        btn.classList.remove('active');
    });
}

// 新增：表单AJAX提交与错误弹窗
function showErrorModal(msg) {
    let modal = document.getElementById('errorModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.className = 'modal';
        modal.id = 'errorModal';
        modal.innerHTML = `<div class="modal-content" style="max-width:340px;text-align:center;">
            <div style="font-size:1.1em;margin:30px 0 24px 0;color:#e53935;">${msg}</div>
            <div style="display:flex;justify-content:center;gap:18px;">
                <button class="submit-btn" onclick="document.getElementById('errorModal').style.display='none'">确定</button>
            </div>
        </div>`;
        document.body.appendChild(modal);
    } else {
        modal.querySelector('div.modal-content>div').innerText = msg;
    }
    modal.style.display = 'flex';
}

// 新增：成功弹窗
function showSuccessModal(msg) {
    let modal = document.getElementById('successModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.className = 'modal';
        modal.id = 'successModal';
        modal.innerHTML = `<div class="modal-content" style="max-width:340px;text-align:center;">
            <div style="font-size:1.1em;margin:30px 0 24px 0;color:#43a047;">${msg}</div>
            <div style="display:flex;justify-content:center;gap:18px;">
                <button class="submit-btn" onclick="document.getElementById('successModal').style.display='none'">确定</button>
            </div>
        </div>`;
        document.body.appendChild(modal);
    } else {
        modal.querySelector('div.modal-content>div').innerText = msg;
    }
    modal.style.display = 'flex';
}

document.addEventListener('DOMContentLoaded', function() {
    // ===================================
    //  常量获取
    // ===================================
    const addModal = document.getElementById('addModal');
    const openAddModalBtn = document.getElementById('openAddModalBtn');
    const addModalCloseBtn = document.getElementById('addModalCloseBtn');
    const addModalCancelBtn = document.getElementById('addModalCancelBtn');
    const addMapForm = document.querySelector('.add-map-form:not(.admin-add-map-form)');
    const loadingMask = document.getElementById('loadingMask');
    
    // ===================================
    //  草稿处理函数
    // ===================================
    const DRAFT_KEY_PREFIX = 'add_map_draft_';

    function saveDraft() {
        if (!addMapForm) return;
        console.log('[草稿] 正在保存...');
        const formData = new FormData(addMapForm);
        for (let [key, value] of formData.entries()) {
            // 不保存文件和空字段
            if (key !== 'image' && value) {
                console.log(`  - 保存字段: ${key}, 值: ${value}`);
                sessionStorage.setItem(DRAFT_KEY_PREFIX + key, value);
            }
        }
        
        // 保存大区按钮选中状态
        const activeRegionBtns = addMapForm.querySelectorAll('#add-map-region-btn-group .region-btn.active');
        if (activeRegionBtns.length > 0) {
            const selectedRegions = Array.from(activeRegionBtns).map(btn => btn.dataset.value);
            sessionStorage.setItem(DRAFT_KEY_PREFIX + 'region_btns', JSON.stringify(selectedRegions));
        } else {
            sessionStorage.removeItem(DRAFT_KEY_PREFIX + 'region_btns');
        }
    }

    function loadDraft() {
        if (!addMapForm) return;
        console.log('[草稿] 正在加载...');
        for (let i = 0; i < sessionStorage.length; i++) {
            const key = sessionStorage.key(i);
            if (key.startsWith(DRAFT_KEY_PREFIX)) {
                const formKey = key.replace(DRAFT_KEY_PREFIX, '');
                const element = addMapForm.elements[formKey];
                const value = sessionStorage.getItem(key);
                if (element && value) {
                    console.log(`  - 加载字段: ${formKey}, 值: ${value}`);
                    element.value = value;
                }
            }
        }
        
        // 恢复大区按钮选中状态
        const savedRegions = sessionStorage.getItem(DRAFT_KEY_PREFIX + 'region_btns');
        if (savedRegions) {
            try {
                const selectedRegions = JSON.parse(savedRegions);
                addMapForm.querySelectorAll('#add-map-region-btn-group .region-btn').forEach(btn => {
                    btn.classList.toggle('active', selectedRegions.includes(btn.dataset.value));
                });
            } catch (e) {
                console.error('解析保存的大区数据失败:', e);
            }
        }
    }

    function clearDraft() {
        if (!addMapForm) return;
        console.log('[草稿] 正在清除...');
        const keysToRemove = [];
        for (let i = 0; i < sessionStorage.length; i++) {
            const key = sessionStorage.key(i);
            if (key.startsWith(DRAFT_KEY_PREFIX)) {
                keysToRemove.push(key);
            }
        }
        keysToRemove.forEach(key => sessionStorage.removeItem(key));
        // 同时重置表单
        addMapForm.reset();
        document.querySelector('.file-preview').innerHTML = '';
        
        // 清除大区按钮选中状态
        addMapForm.querySelectorAll('#add-map-region-btn-group .region-btn').forEach(btn => {
            btn.classList.remove('active');
        });
    }

    // ===================================
    //  模态框控制
    // ===================================
    if (addModal) {
        // 打开
        openAddModalBtn?.addEventListener('click', () => {
            loadDraft();
            addModal.style.display = 'flex';
        });

        // 关闭 (X 按钮)
        addModalCloseBtn?.addEventListener('click', () => {
            addModal.style.display = 'none';
        });

        // 关闭 (取消按钮)
        addModalCancelBtn?.addEventListener('click', () => {
            addModal.style.display = 'none';
        });

        // 点击模态框外部关闭
        addModal.addEventListener('click', (event) => {
            if (event.target === addModal) {
                addModal.style.display = 'none';
            }
        });
    }

    // ===================================
    //  表单事件处理 (只针对用户端表单，排除管理员端)
    // ===================================
    if (addMapForm && !addMapForm.classList.contains('admin-add-map-form')) {
        // 实时保存草稿
        addMapForm.addEventListener('input', saveDraft);
        
        // AJAX提交
        addMapForm.addEventListener('submit', function(e) {
            e.preventDefault();
            if(loadingMask) loadingMask.style.display = 'flex';
            
            const formData = new FormData(this);
            fetch('/map/add', {
                method: 'POST',
                body: formData,
                headers: {'X-Requested-With': 'XMLHttpRequest'}
            })
            .then(res => res.json())
            .then(data => {
                if(loadingMask) loadingMask.style.display = 'none';
                if (data.success) {
                    clearDraft();
                    showSuccessModal('申请成功！您可以关闭窗口或继续添加。');
                } else {
                    showErrorModal(data.msg || '申请失败');
                }
            })
            .catch(() => {
                if(loadingMask) loadingMask.style.display = 'none';
                showErrorModal('网络错误');
            });
        });
    }

    // ===================================
    //  添加地图表单大区按钮逻辑
    // ===================================
    const addMapRegionButtons = document.querySelectorAll('#add-map-region-btn-group .region-btn');
    const addMapRegionInput = document.getElementById('addMapRegionInput');
    
    if (addMapRegionButtons.length > 0) {
        addMapRegionButtons.forEach(button => {
            button.addEventListener('click', () => {
                // 切换选中状态
                button.classList.toggle('active');
                
                // 获取所有选中的大区
                const selectedRegions = Array.from(addMapRegionButtons)
                    .filter(btn => btn.classList.contains('active'))
                    .map(btn => btn.dataset.value);
                
                // 根据选中数量决定值
                let regionValue = '';
                if (selectedRegions.length === 0) {
                    // 没有选中任何大区
                    regionValue = '';
                } else if (selectedRegions.length === 3) {
                    // 选中3个大区，显示"全区"
                    regionValue = '全区';
                } else {
                    // 选中1-2个大区，用'/'分隔
                    regionValue = selectedRegions.join('/');
                }
                
                // 更新隐藏输入框的值
                addMapRegionInput.value = regionValue;
                // 保存草稿
                saveDraft();
            });
        });
    }

    // ===================================
    //  编辑地图表单大区按钮逻辑
    // ===================================
    const editMapRegionButtons = document.querySelectorAll('#edit-map-region-btn-group .region-btn');
    const editMapRegionInput = document.getElementById('editMapRegionInput');
    
    if (editMapRegionButtons.length > 0) {
        editMapRegionButtons.forEach(button => {
            button.addEventListener('click', () => {
                // 切换选中状态
                button.classList.toggle('active');
                
                // 获取所有选中的大区
                const selectedRegions = Array.from(editMapRegionButtons)
                    .filter(btn => btn.classList.contains('active'))
                    .map(btn => btn.dataset.value);
                
                // 根据选中数量决定值
                let regionValue = '';
                if (selectedRegions.length === 0) {
                    // 没有选中任何大区
                    regionValue = '';
                } else if (selectedRegions.length === 3) {
                    // 选中3个大区，显示"全区"
                    regionValue = '全区';
                } else {
                    // 选中1-2个大区，用'/'分隔
                    regionValue = selectedRegions.join('/');
                }
                
                // 更新隐藏输入框的值
                editMapRegionInput.value = regionValue;
            });
        });
    }

    // ===================================
    //  筛选功能 (保持不变)
    // ===================================
    const filterResultsContainer = document.getElementById('filter-results-container');
    const mapListContainer = document.getElementById('map-list-container');
    const filterForm = document.querySelector('.filter-section');

    async function applyFilters(url) {
        if (!mapListContainer || !filterResultsContainer) return;

        try {
            const response = await fetch(url, { headers: { 'X-Requested-With': 'XMLHttpRequest' } });
            if (!response.ok) throw new Error('网络响应失败');
            const data = await response.json();
            if (data.results_html) filterResultsContainer.innerHTML = data.results_html;
            if (data.maps_html) mapListContainer.innerHTML = data.maps_html;
            history.pushState({}, '', url);

            // 修复：内容替换后重新绑定图片预览
            if (typeof bindImagePreview === 'function') bindImagePreview();

            // 更新按钮的激活状态
            const params = new URL(url).searchParams;
            const region = params.get('region') || '';
            const type = params.get('type') || '';

            // 更新大区按钮激活状态（支持多选）
            document.querySelectorAll('.region-btn').forEach(btn => {
                if (region === '全区') {
                    btn.classList.add('active');
                } else if (region && region.includes('/')) {
                    const selectedRegions = region.split('/').map(r => r.trim());
                    btn.classList.toggle('active', selectedRegions.includes(btn.dataset.value));
                } else {
                    btn.classList.toggle('active', btn.dataset.value === region);
                }
            });
    
            document.querySelectorAll('.type-btn').forEach(btn => {
                btn.classList.toggle('active', btn.dataset.value === type);
            });

            // 新增：每次内容刷新后，重新绑定视图切换逻辑
            if (typeof bindViewSwitcher === 'function') bindViewSwitcher();

            // 在AJAX筛选内容替换后调用
            if (typeof window._afterMapListUpdate === 'function') window._afterMapListUpdate();

        } catch (error) {
            console.error('筛选请求失败:', error);
            mapListContainer.innerHTML = '<p style="color:red;text-align:center;">内容加载失败，请刷新页面重试。</p>';
        }
    }

    // 筛选表单
    if (filterForm) {
        filterForm.addEventListener('submit', e => {
            e.preventDefault();
            const formData = new FormData(filterForm);
            const params = new URLSearchParams(formData);
            // 修复：在添加查询参数前，移除 action URL 中的锚点
            const action = filterForm.action.split('#')[0];
            const url = `${action}?${params.toString()}`;
            applyFilters(url);
        });

        // 大区多选逻辑
        const regionButtons = filterForm.querySelectorAll('.region-btn');
        const regionInput = document.getElementById('regionInput');
        
        // 初始化选中状态（从URL参数恢复）
        const urlParams = new URLSearchParams(window.location.search);
        const currentRegion = urlParams.get('region');
        if (currentRegion) {
            const selectedRegions = currentRegion.split('/').filter(r => r.trim());
            regionButtons.forEach(btn => {
                if (selectedRegions.includes(btn.dataset.value)) {
                    btn.classList.add('active');
                }
            });
        } else {
            // 如果没有region参数或region为空，激活"全部"按钮
            const allButton = filterForm.querySelector('.region-btn[data-value=""]');
            if (allButton) {
                allButton.classList.add('active');
            }
        }

        // 大区按钮点击事件
        regionButtons.forEach(button => {
            button.addEventListener(
                'click', () => {
                    // 如果点击的是"全部"按钮
                    if (button.dataset.value === '') {
                        // 清除所有其他按钮的选中状态
                        regionButtons.forEach(btn => {
                            btn.classList.remove('active');
                        });
                        // 激活"全部"按钮
                        button.classList.add('active');
                        regionValue = '';
                    } else {
                        // 如果点击的是其他大区按钮，先移除"全部"按钮的选中状态
                        const allButton = filterForm.querySelector('.region-btn[data-value=""]');
                        if (allButton) {
                            allButton.classList.remove('active');
                        }
                        
                        // 切换当前按钮的选中状态
                        button.classList.toggle('active');
                        
                        // 获取所有选中的大区（排除"全部"按钮）
                        const selectedRegions = Array.from(regionButtons)
                            .filter(btn => btn.classList.contains('active') && btn.dataset.value !== '')
                            .map(btn => btn.dataset.value);
                        
                        // 根据选中数量决定筛选逻辑
                        if (selectedRegions.length === 0) {
                            // 没有选中任何大区，激活"全部"按钮
                            if (allButton) {
                                allButton.classList.add('active');
                            }
                            regionValue = '';
                        } else if (selectedRegions.length === 3) {
                            // 选中3个大区，筛选"全区"
                            regionValue = '全区';
                        } else {
                            // 选中1-2个大区，用'/'分隔
                            regionValue = selectedRegions.join('/');
                        }
                    }
                    
                    // 更新隐藏输入框的值
                    regionInput.value = regionValue;
                    
                    // 提交筛选
                    filterForm.dispatchEvent(new Event('submit', { cancelable: true }));
                });
        });

        // 地图类型筛选（保持原有逻辑）
        filterForm.querySelectorAll('.type-btn').forEach(button => {
            button.addEventListener('click', () => {
                document.getElementById('typeInput').value = button.dataset.value;
                filterForm.dispatchEvent(new Event('submit', { cancelable: true }));
            });
        });
        
        filterForm.querySelector('#levelSelect')?.addEventListener('change', () => {
            filterForm.dispatchEvent(new Event('submit', { cancelable: true }));
        });
    }

    if (mapListContainer) {
        mapListContainer.addEventListener('click', event => {
            const target = event.target.closest('a');
            if (target && (target.matches('.page-item'))) {
                event.preventDefault();
                applyFilters(target.href);
            }
        });
    }

    if (filterResultsContainer) {
        filterResultsContainer.addEventListener('click', event => {
            if (e.target.matches('.clear-filter-btn') && filterResultsContainer && filterResultsContainer.contains(e.target)) {
                e.preventDefault();
                applyFilters(e.target.href);
                
                // Bug修复：手动重置表单项
                const levelSelect = document.getElementById('levelSelect');
                if (levelSelect) levelSelect.selectedIndex = 0;
                
                const searchInput = document.querySelector('.search-input[name="search"]');
                if (searchInput) searchInput.value = '';
                
                // 清除大区按钮选中状态
                document.querySelectorAll('.region-btn').forEach(btn => {
                    btn.classList.remove('active');
                });
                
                // 激活"全部"按钮
                const allButton = document.querySelector('.region-btn[data-value=""]');
                if (allButton) {
                    allButton.classList.add('active');
                }
                
                // 清除大区隐藏输入框
                const regionInput = document.getElementById('regionInput');
                if (regionInput) regionInput.value = '';
                
                return; // 处理完后退出
            }
        });
    }

    // 页面加载完成后统一初始化
    if (addMapForm) {
        // 这部分逻辑已经被合并，不再需要
    }

    if (filterForm) {
        // ...
    }

    window.addEventListener('click', (event) => {
        if (event.target.classList.contains('modal')) {
            event.target.style.display = 'none';
        }
    });

    window.imagePreview.init();

    let searchInput = document.querySelector('.search-input');
    if(searchInput) {
        searchInput.focus();
        const val = searchInput.value;
        searchInput.value = '';
        searchInput.value = val;
    }

    // 将所有委托到 body 的点击事件统一处理
    document.body.addEventListener('click', e => {
        // 分页链接
        const pageLink = e.target.closest('a.page-item');
        if (pageLink && mapListContainer && mapListContainer.contains(e.target)) {
            e.preventDefault();
            applyFilters(pageLink.href);
            return; // 处理完后退出
        }
        
        // 清除筛选按钮
        if (e.target.matches('.clear-filter-btn') && filterResultsContainer && filterResultsContainer.contains(e.target)) {
            e.preventDefault();
            applyFilters(e.target.href);
            
            // Bug修复：手动重置表单项
            const levelSelect = document.getElementById('levelSelect');
            if (levelSelect) levelSelect.selectedIndex = 0;
            
            const searchInput = document.querySelector('.search-input[name="search"]');
            if (searchInput) searchInput.value = '';
            
            // 清除大区按钮选中状态
            document.querySelectorAll('.region-btn').forEach(btn => {
                btn.classList.remove('active');
            });
            
            // 激活"全部"按钮
            const allButton = document.querySelector('.region-btn[data-value=""]');
            if (allButton) {
                allButton.classList.add('active');
            }
            
            // 清除大区隐藏输入框
            const regionInput = document.getElementById('regionInput');
            if (regionInput) regionInput.value = '';
            
            return; // 处理完后退出
        }

        // 打开模态框
        if (e.target.matches('.add-btn')) openAddModal();
        if (e.target.matches('#adviceLink')) {
            e.preventDefault();
            openAdviceBox();
        }
        const editButton = e.target.closest('.edit-btn');
        if (editButton) {
            e.preventDefault();
            openEditModal(editButton.dataset.mapId, editButton.dataset.mapName, editButton.dataset.mapAuthor, editButton.dataset.mapRegion, editButton.dataset.mapDifficulty, editButton.dataset.mapImage);
        }
        
        // 关闭模态框
        const addModal = document.getElementById('addModal');
        const editModal = document.getElementById('editModal');
        const adviceModal = document.getElementById('adviceModal');

        if (e.target.matches('#closeAddModalBtn, #cancelAddModalBtn')) closeAddModal();
        if (e.target.matches('#closeEditModalBtn, #cancelEditModalBtn')) window.modal.edit.close();
        if (e.target.matches('#closeAdviceBoxBtn, #cancelAdviceBoxBtn')) closeAdviceBox();
        
        // 点击模态框背景关闭
        if (e.target === addModal) closeAddModal();
        if (e.target === editModal) window.modal.edit.close();
        if (e.target === adviceModal) closeAdviceBox();
    });

    // 检查页面是否包含敏感信息（用户已登录）
    const isAuthenticated = document.querySelector('.username') !== null;
    
    if (isAuthenticated) {
        // 监听页面可见性变化 - 只在页面重新可见时检查
        document.addEventListener('visibilitychange', function() {
            if (!document.hidden) {
                // 页面重新可见时，检查登录状态
                checkLoginStatus();
            }
        });
        
        // 监听页面焦点变化 - 减少检查频率
        let focusCheckTimeout;
        window.addEventListener('focus', function() {
            // 防抖处理，避免频繁检查
            clearTimeout(focusCheckTimeout);
            focusCheckTimeout = setTimeout(checkLoginStatus, 1000);
        });
    }

    // ===================================
    //  全局函数绑定
    // ===================================
    // 将模态框操作函数绑定到全局，以便HTML中的onclick可以调用
    window.openAddModal = window.modal.add.open;
    window.closeAddModal = window.modal.add.close;
    // ... 其他全局函数绑定 ...

    // 视图切换按钮逻辑（记忆视图状态，内容刷新后自动恢复）
    function bindViewSwitcher() {
        const listBtn = document.getElementById('listViewBtn');
        const cardBtn = document.getElementById('cardViewBtn');
        const cardWrapper = document.querySelector('.map-list');
        const tableWrapper = document.getElementById('infinite-table-wrapper');
        const pagination = document.querySelector('.pagination-container');
        const viewInput = document.getElementById('viewModeInput');
        if (!listBtn || !cardBtn || !cardWrapper || !tableWrapper) return;
        // 优先读取URL参数view
        function getUrlViewMode() {
            const params = new URLSearchParams(window.location.search);
            const v = params.get('view');
            if (v === 'list' || v === 'card') return v;
            return null;
        }
        let view = getUrlViewMode() || localStorage.getItem('mapViewMode') || 'card';
        async function setView(mode) {
            if (viewInput) viewInput.value = mode;
            if (mode === 'list') {
                listBtn.classList.add('active');
                cardBtn.classList.remove('active');
                cardWrapper.style.display = 'none';
                tableWrapper.style.display = '';
                if (pagination) pagination.style.display = 'none';
                const urlParams = new URLSearchParams(window.location.search);
                urlParams.set('page', '1');
                urlParams.set('view', 'list');
                const url = window.location.pathname + '?' + urlParams.toString();
                if (typeof window.loadListFirstPage === 'function') {
                    await window.loadListFirstPage(url);
                }
                if (typeof window.resetInfiniteScroll === 'function') {
                    window.resetInfiniteScroll();
                }
            } else {
                cardBtn.classList.add('active');
                listBtn.classList.remove('active');
                cardWrapper.style.display = '';
                tableWrapper.style.display = 'none';
                if (pagination) pagination.style.display = '';
            }
            localStorage.setItem('mapViewMode', mode);
        }
        listBtn.onclick = function() { setView('list'); };
        cardBtn.onclick = function() { setView('card'); };
        setView(view);
    }
    // 实现AJAX加载第一页并重置下拉
    window.loadListFirstPage = async function(url) {
        if (!url) return;
        let infinitePage = 1;
        let infiniteNoMore = false;
        let infiniteLoading = false;
        if (infiniteLoadingDiv) infiniteLoadingDiv.style.display = '';
        try {
            const resp = await fetch(url, { headers: { 'X-Requested-With': 'XMLHttpRequest' } });
            if (!resp.ok) throw new Error('网络错误');
            const data = await resp.json();
            const parser = new DOMParser();
            const doc = parser.parseFromString(data.maps_html, 'text/html');
            const newTbody = doc.querySelector('tbody');
            const table = document.querySelector('.map-list-table');
            const tbody = table.querySelector('tbody');
            tbody.innerHTML = '';
            if (newTbody && newTbody.children.length > 0) {
                Array.from(newTbody.children).forEach(tr => {
                    if (tr.tagName === 'TR') tbody.appendChild(tr);
                });
            }
            // 处理"暂无地图信息"时隐藏加载动画
            if (tbody.textContent.includes('暂无地图信息')) {
                if (infiniteLoadingDiv) infiniteLoadingDiv.style.display = 'none';
            }
            // 新增：刷新后重新绑定图片放大预览
            if (typeof bindImagePreview === 'function') bindImagePreview();
        } catch (e) {
            if (infiniteLoadingDiv) infiniteLoadingDiv.style.display = 'none';
        }
    };
    // 加载动画超时1秒
    let loadingTimeout = null;
    function showLoadingWithTimeout() {
        if (infiniteLoadingDiv) infiniteLoadingDiv.style.display = '';
        if (loadingTimeout) clearTimeout(loadingTimeout);
        loadingTimeout = setTimeout(() => {
            if (infiniteLoadingDiv) infiniteLoadingDiv.style.display = 'none';
        }, 1000);
    }
    // 保证无数据时加载动画消失
    if (document.querySelector('.map-list-table tbody tr') && document.querySelector('.map-list-table tbody tr').textContent.includes('暂无地图信息')) {
        if (infiniteLoadingDiv) infiniteLoadingDiv.style.display = 'none';
    }
    // 禁用列表视图下分页点击
    document.addEventListener('click', function(e) {
        const pagination = document.querySelector('.pagination-container');
        const tableWrapper = document.getElementById('infinite-table-wrapper');
        if (pagination && tableWrapper && tableWrapper.style.display !== 'none') {
            if (e.target.closest('.page-item')) {
                e.preventDefault();
                return false;
            }
        }
    }, true);
    // 页面初次加载绑定
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', bindViewSwitcher);
    } else {
        bindViewSwitcher();
    }
    // 内容异步刷新后重新绑定
    if (window.bindMapViewSwitcher) {
        const oldBind = window.bindMapViewSwitcher;
        window.bindMapViewSwitcher = function() {
            oldBind();
            if (typeof bindImagePreview === 'function') bindImagePreview();
        };
    }

    // ======================
    // 列表视图无限下拉加载（全页面滚动监听）
    // ======================
    let infinitePage = 1;
    let infiniteLoading = false;
    let infiniteNoMore = false;
    const infiniteLoadingDiv = document.getElementById('infinite-loading');
    function getCurrentListUrl(page) {
        const urlParams = new URLSearchParams(window.location.search);
        urlParams.set('page', page);
        return window.location.pathname + '?' + urlParams.toString();
    }
    async function loadNextPage() {
        if (infiniteLoading || infiniteNoMore) return;
        infiniteLoading = true;
        showLoadingWithTimeout();
        infinitePage++;
        const url = getCurrentListUrl(infinitePage);
        try {
            const resp = await fetch(url, { headers: { 'X-Requested-With': 'XMLHttpRequest' } });
            if (!resp.ok) throw new Error('网络错误');
            const data = await resp.json();
            // 只提取新页tbody的<tr>，追加到现有tbody
            const parser = new DOMParser();
            const doc = parser.parseFromString(data.maps_html, 'text/html');
            const newTbody = doc.querySelector('tbody');
            if (newTbody && newTbody.children.length > 0) {
                const table = document.querySelector('.map-list-table');
                const tbody = table.querySelector('tbody');
                Array.from(newTbody.children).forEach(tr => {
                    if (tr.tagName === 'TR') tbody.appendChild(tr);
                });
            } else {
                infiniteNoMore = true;
            }
        } catch (e) {
            infiniteNoMore = true;
        } finally {
            infiniteLoading = false;
            if (infiniteLoadingDiv) infiniteLoadingDiv.style.display = infiniteNoMore ? 'none' : '';
        }
    }
    function onWindowScroll() {
        if (infiniteNoMore) return;
        if ((window.innerHeight + window.scrollY) >= (document.body.offsetHeight - 40)) {
            loadNextPage();
        }
    }
    // 绑定滚动事件（防止多次绑定）
    window.removeEventListener('scroll', onWindowScroll);
    window.addEventListener('scroll', onWindowScroll);
    // 切换到列表视图时重置下拉状态
    window.resetInfiniteScroll = function() {
        infinitePage = 1;
        infiniteNoMore = false;
        infiniteLoading = false;
    };

    // 难度排序三态切换（升序/降序/无）
    let levelSortState = 'none'; // 'none' | 'asc' | 'desc'
    function updateLevelSortArrow() {
        const arrow = document.getElementById('level-sort-arrow');
        if (!arrow) return;
        if (levelSortState === 'asc') arrow.textContent = '↑';
        else if (levelSortState === 'desc') arrow.textContent = '↓';
        else arrow.textContent = '⇅';
    }
    function bindLevelSortEvent() {
        const levelTh = document.getElementById('level-sort-th');
        if (!levelTh) return;
        levelTh.onclick = async function() {
            if (levelSortState === 'none') levelSortState = 'asc';
            else if (levelSortState === 'asc') levelSortState = 'desc';
            else levelSortState = 'none';
            updateLevelSortArrow();
            const urlParams = new URLSearchParams(window.location.search);
            urlParams.set('page', '1');
            if (levelSortState !== 'none') {
                urlParams.set('level_sort', levelSortState);
            } else {
                urlParams.delete('level_sort');
            }
            const url = window.location.pathname + '?' + urlParams.toString();
            if (typeof window.loadListFirstPage === 'function') {
                await window.loadListFirstPage(url);
            }
            if (typeof window.resetInfiniteScroll === 'function') {
                window.resetInfiniteScroll();
            }
            window.history.replaceState(null, '', url);
        };
        // 初始化箭头
        updateLevelSortArrow();
    }
    // 页面初次加载和每次AJAX刷新后都调用
    bindLevelSortEvent();
    // 在loadListFirstPage最后也调用
    const oldLoadListFirstPage = window.loadListFirstPage;
    window.loadListFirstPage = async function(url) {
        if (!url) return;
        let infinitePage = 1;
        let infiniteNoMore = false;
        let infiniteLoading = false;
        if (infiniteLoadingDiv) infiniteLoadingDiv.style.display = '';
        try {
            const resp = await fetch(url, { headers: { 'X-Requested-With': 'XMLHttpRequest' } });
            if (!resp.ok) throw new Error('网络错误');
            const data = await resp.json();
            const parser = new DOMParser();
            const doc = parser.parseFromString(data.maps_html, 'text/html');
            const newTbody = doc.querySelector('tbody');
            const table = document.querySelector('.map-list-table');
            const tbody = table.querySelector('tbody');
            tbody.innerHTML = '';
            if (newTbody && newTbody.children.length > 0) {
                Array.from(newTbody.children).forEach(tr => {
                    if (tr.tagName === 'TR') tbody.appendChild(tr);
                });
            }
            // 处理"暂无地图信息"时隐藏加载动画
            if (tbody.textContent.includes('暂无地图信息')) {
                if (infiniteLoadingDiv) infiniteLoadingDiv.style.display = 'none';
            }
        } catch (e) {
            if (infiniteLoadingDiv) infiniteLoadingDiv.style.display = 'none';
        }
        // 重新绑定排序事件
        bindLevelSortEvent();
    };

    // =====================
    // 图片点击放大预览功能
    // =====================
    function bindImagePreview() {
        // 移除旧的模态框
        let oldModal = document.getElementById('imagePreviewModal');
        if (oldModal) oldModal.remove();
        // 绑定所有图片点击
        document.querySelectorAll('.map-card-image, .map-list-thumb').forEach(img => {
            img.style.cursor = 'zoom-in';
            img.onclick = function(e) {
                e.stopPropagation();
                // 创建模态框
                let modal = document.createElement('div');
                modal.id = 'imagePreviewModal';
                modal.style.position = 'fixed';
                modal.style.left = '0';
                modal.style.top = '0';
                modal.style.width = '100vw';
                modal.style.height = '100vh';
                modal.style.background = 'rgba(0,0,0,0.7)';
                modal.style.display = 'flex';
                modal.style.alignItems = 'center';
                modal.style.justifyContent = 'center';
                modal.style.zIndex = '9999';
                modal.innerHTML = `<img src='${img.src}' style='max-width:90vw;max-height:90vh;border-radius:12px;box-shadow:0 4px 32px #0008;display:block;'>`;
                // 点击模态框关闭
                modal.onclick = function() { modal.remove(); };
                document.body.appendChild(modal);
            };
        });
    }
    // 内容刷新后重新绑定图片预览
    if (typeof bindImagePreview === 'function') bindImagePreview();

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

    // ========== 地图详情跳转 ========== //
    function bindMapDetailLinks() {
        // 先移除旧的事件（防止重复绑定）
        const wrapper = document.getElementById('map-views-wrapper');
        if (!wrapper) return;
        wrapper._mapDetailHandler && wrapper.removeEventListener('click', wrapper._mapDetailHandler);
        wrapper._mapDetailHandler = function(e) {
            let target = e.target;
            while (target && !target.classList.contains('map-detail-link') && target !== this) {
                target = target.parentElement;
            }
            if (target && target.classList.contains('map-detail-link')) {
                const mapId = target.getAttribute('data-map-id');
                if (mapId) {
                    window.open(`/map/${mapId}`, '_blank');
                }
            }
        };
        wrapper.addEventListener('click', wrapper._mapDetailHandler);
    }
    // 页面加载和每次AJAX内容更新后都要调用
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', bindMapDetailLinks);
    } else {
        bindMapDetailLinks();
    }
    // 在AJAX筛选内容替换后也调用
    window._afterMapListUpdate = function() {
        bindMapDetailLinks();
    };

    // 用户下拉菜单交互（主页面统一为点击跳转）
    function setupUserDropdown() {
        const toggle = document.getElementById('userDropdownToggle');
        if (!toggle) return;
        // 直接跳转到个人信息页面
        toggle.addEventListener('click', function(e) {
            window.location.href = '/profile';
        });
    }
    window.addEventListener('DOMContentLoaded', setupUserDropdown);
});

// 检查登录状态的函数
function checkLoginStatus() {
    fetch('/check_login')
        .then(response => response.json())
        .then(data => {
            if (!data.logged_in) {
                // 用户未登录，重定向到登录页面
                window.location.replace('/login');
            }
        })
        .catch(error => {
            console.error('检查登录状态失败:', error);
        });
}

// 页面卸载时清除敏感数据
window.addEventListener('beforeunload', function() {
    // 可以在这里添加额外的清理逻辑
    sessionStorage.clear();
});

// 防止页面被缓存
if (window.history && window.history.pushState) {
    window.addEventListener('popstate', function() {
        // 用户点击后退按钮时，检查登录状态
        const isAuthenticated = document.querySelector('.username') !== null;
        if (isAuthenticated) {
            checkLoginStatus();
        }
    });
}

function openAdviceBox() {
    const modal = document.getElementById('adviceModal');
    if(modal) modal.style.display = 'flex';
}
function closeAdviceBox() {
    const modal = document.getElementById('adviceModal');
    if(modal) modal.style.display = 'none';
}

async function submitAdvice(event) {
    event.preventDefault();
    const contentEl = document.getElementById('adviceContent');
    const content = contentEl.value.trim();
    if (!content) {
        alert('请填写建议内容');
        return;
    }
    try {
        const response = await fetch('/advice/add', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ content: content })
        });
        const data = await response.json();
        if(data.success){
            contentEl.value = ''; // 清空文本域
            const successMsg = document.getElementById('adviceSuccessMsg');
            if(successMsg) successMsg.style.display = 'block';
            setTimeout(() => { 
                closeAdviceBox();
                if(successMsg) successMsg.style.display = 'none';
            }, 2000);
        } else {
            alert('提交失败: ' + (data.msg || '未知错误'));
        }
    } catch(error) {
        console.error("Submit advice failed:", error);
        alert("网络错误，提交失败！");
    }
}

function handleImageInput(inputElement, previewSelector) {
    const file = inputElement.files[0];
    const preview = document.querySelector(previewSelector);
    if (!file || !preview) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        preview.innerHTML = `<img src="${e.target.result}" alt="预览图" style="max-width:100%;max-height:100%;object-fit:contain;">`;
    };
    reader.readAsDataURL(file);
    
    compressImage(file, 1024, 1024, 0.7, (compressedBlob) => {
        if(!compressedBlob) return;
        const dataTransfer = new DataTransfer();
        const compressedFile = new File([compressedBlob], file.name, {
            type: 'image/jpeg',
            lastModified: Date.now()
        });
        dataTransfer.items.add(compressedFile);
        inputElement.files = dataTransfer.files;
    });
}

function compressImage(file, maxWidth, maxHeight, quality, callback) {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (e) => {
        const img = new Image();
        img.src = e.target.result;
        img.onerror = () => callback(null);
        img.onload = () => {
            let width = img.width;
            let height = img.height;

            if (width > height) {
                if (width > maxWidth) {
                    height *= maxWidth / width;
                    width = maxWidth;
                }
            } else {
                if (height > maxHeight) {
                    width *= maxHeight / height;
                    height = maxHeight;
                }
            }

            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);
            canvas.toBlob(callback, 'image/jpeg', quality);
        };
    };
    reader.onerror = () => callback(null);
}

function validateImageFile(file) {
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp'];
    const maxSize = 2 * 1024 * 1024; // 2MB
    if (!allowedTypes.includes(file.type)) {
        showErrorModal('仅支持PNG、JPG、JPEG、GIF、WEBP格式的图片');
        return false;
    }
    if (file.size > maxSize) {
        showErrorModal('图片大小不能超过2MB');
        return false;
    }
    return true;
}

// 编辑地图模态框函数
function openEditModal(mapId, mapName, mapAuthor, mapRegion, mapDifficulty, mapImage) {
    const editModal = document.getElementById('editModal');
    const editForm = document.getElementById('editMapForm');
    
    // 设置表单字段值
    document.getElementById('editMapId').value = mapId;
    document.getElementById('editMapName').value = mapName;
    document.getElementById('editMapAuthor').value = mapAuthor;
    document.getElementById('editMapDifficulty').value = mapDifficulty;
    
    // 设置大区按钮选中状态
    const editRegionButtons = document.querySelectorAll('#edit-map-region-btn-group .region-btn');
    editRegionButtons.forEach(btn => btn.classList.remove('active'));
    
    if (mapRegion === '全区') {
        // 如果是"全区"，选中所有大区按钮
        editRegionButtons.forEach(btn => btn.classList.add('active'));
        document.getElementById('editMapRegionInput').value = '全区';
    } else if (mapRegion && mapRegion.includes('/')) {
        // 如果是多选大区，选中对应的大区按钮
        const selectedRegions = mapRegion.split('/').map(r => r.trim());
        editRegionButtons.forEach(btn => {
            if (selectedRegions.includes(btn.dataset.value)) {
                btn.classList.add('active');
            }
        });
        document.getElementById('editMapRegionInput').value = mapRegion;
    } else if (mapRegion) {
        // 如果是单选大区
        const targetRegionBtn = document.querySelector(`#edit-map-region-btn-group .region-btn[data-value="${mapRegion}"]`);
        if (targetRegionBtn) {
            targetRegionBtn.classList.add('active');
            document.getElementById('editMapRegionInput').value = mapRegion;
        }
    }
    
    // 设置图片预览
    const imagePreview = document.querySelector('#editMapImagePreview img');
    if (imagePreview) {
        if (mapImage && mapImage.startsWith('http')) {
            imagePreview.src = mapImage;
        } else if (mapImage) {
            imagePreview.src = `/static/${mapImage}`;
        } else {
            imagePreview.src = '';
        }
    }
    
    // 显示模态框
    editModal.style.display = 'flex';
}

function closeEditModal() {
    const editModal = document.getElementById('editModal');
    const editForm = document.getElementById('editMapForm');
    
    // 隐藏模态框
    editModal.style.display = 'none';
    
    // 重置表单
    editForm.reset();
    
    // 清除大区按钮选中状态
    document.querySelectorAll('#edit-map-region-btn-group .region-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // 清除图片预览
    const imagePreview = document.querySelector('#editMapImagePreview img');
    if (imagePreview) {
        imagePreview.src = '';
    }
}

// 将函数绑定到全局
window.openEditModal = openEditModal;
window.closeEditModal = closeEditModal;

// =====================
// 个人信息完善弹窗功能
// =====================

// 检查是否需要显示个人信息完善弹窗
function checkProfileCompletion() {
    // 检查session中是否需要完善个人信息
    fetch('/check_profile_completion')
        .then(response => response.json())
        .then(data => {
            if (data.needs_completion) {
                openProfileModal();
            }
        })
        .catch(error => {
            console.error('检查个人信息完善状态失败:', error);
        });
}

// 打开个人信息完善弹窗
function openProfileModal() {
    const modal = document.getElementById('profileModal');
    modal.style.display = 'flex';
    modal.classList.add('force-complete');
    
    // 添加body类来阻止背景交互
    document.body.classList.add('modal-open');
    
    // 初始化头像上传预览
    const avatarInput = document.getElementById('profileAvatar');
    if (avatarInput) {
        // 移除之前的事件监听器，避免重复绑定
        avatarInput.removeEventListener('change', handleProfileImageChange);
        avatarInput.addEventListener('change', handleProfileImageChange);
        
        // 绑定头像点击事件
        const placeholder = document.getElementById('profileAvatarPlaceholder');
        const preview = document.getElementById('profileAvatarPreview');
        
        if (placeholder) {
            placeholder.onclick = () => avatarInput.click();
        }
        if (preview) {
            preview.onclick = () => avatarInput.click();
        }
    }
    
    // 绑定点击外侧事件
    modal.addEventListener('click', handleModalOutsideClick);
    
    // 阻止键盘事件传播
    modal.addEventListener('keydown', handleModalKeydown);
}

// 处理点击弹窗外侧
function handleModalOutsideClick(event) {
    // 如果点击的是头像裁剪弹窗，不处理
    if (event.target.closest('.avatar-crop-modal')) {
        return;
    }
    
    if (event.target.classList.contains('profile-completion-modal')) {
        showProfileError('请完善所有必填信息！');
    }
}

// 显示错误提示
function showProfileError(message) {
    const errorMsg = document.getElementById('profileErrorMsg');
    if (errorMsg) {
        errorMsg.textContent = message;
        errorMsg.style.display = 'block';
        
        // 3秒后隐藏错误提示
        setTimeout(() => {
            errorMsg.style.display = 'none';
        }, 3000);
    }
}

// 处理键盘事件
function handleModalKeydown(event) {
    // 如果事件来自头像裁剪弹窗，不处理
    if (event.target.closest('.avatar-crop-modal')) {
        return;
    }
    
    // 阻止ESC键关闭弹窗
    if (event.key === 'Escape') {
        event.preventDefault();
        showProfileError('请完善所有必填信息！');
        return false;
    }
    
    // 阻止Tab键切换到背景元素
    if (event.key === 'Tab') {
        const focusableElements = document.querySelectorAll('.profile-completion-content button, .profile-completion-content input, .profile-completion-content textarea');
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];
        
        if (event.shiftKey) {
            if (document.activeElement === firstElement) {
                event.preventDefault();
                lastElement.focus();
            }
        } else {
            if (document.activeElement === lastElement) {
                event.preventDefault();
                firstElement.focus();
            }
        }
    }
}



// 关闭个人信息完善弹窗（仅在成功提交后调用）
function closeProfileModal() {
    const modal = document.getElementById('profileModal');
    modal.style.display = 'none';
    modal.classList.remove('force-complete');
    
    // 移除body类来恢复背景交互
    document.body.classList.remove('modal-open');
    
    // 清空表单
    document.getElementById('profileForm').reset();
    document.getElementById('profileAvatarPreview').innerHTML = '';
    document.getElementById('profileAvatarPreview').style.display = 'none';
    document.getElementById('profileAvatarPlaceholder').style.display = 'flex';
    
    // 隐藏错误提示
    const errorMsg = document.getElementById('profileErrorMsg');
    if (errorMsg) {
        errorMsg.style.display = 'none';
    }
    
    // 移除事件监听器
    const avatarInput = document.getElementById('profileAvatar');
    if (avatarInput) {
        avatarInput.removeEventListener('change', handleProfileImageChange);
    }
    
    // 移除点击外侧事件监听器
    modal.removeEventListener('click', handleModalOutsideClick);
    
    // 移除键盘事件监听器
    modal.removeEventListener('keydown', handleModalKeydown);
}

// 处理头像图片变化
function handleProfileImageChange(event) {
    const file = event.target.files[0];
    const preview = document.getElementById('profileAvatarPreview');
    const placeholder = document.getElementById('profileAvatarPlaceholder');

    if (!file) {
        preview.style.display = 'none';
        placeholder.style.display = 'flex';
        return;
    }

    // 验证图片文件
    if (!validateImageFile(file)) {
        event.target.value = '';
        preview.style.display = 'none';
        placeholder.style.display = 'flex';
        return;
    }

    // 打开裁剪弹窗
    openAvatarCropModal(file);
}

// 提交个人信息
async function submitProfile(event) {
    event.preventDefault();
    
    const form = event.target;
    const formData = new FormData(form);
    
    // 表单验证
    const nickname = formData.get('nickname') || '';
    const avatar = formData.get('avatar');
    
    if (!nickname.trim()) {
        showProfileError('请输入游戏昵称！');
        return;
    }
    
    if (!avatar || avatar.size === 0) {
        showProfileError('请选择头像图片！');
        return;
    }
    
    try {
        const response = await fetch('/profile/complete', {
            method: 'POST',
            body: formData
        });
        
        const result = await response.json();
        
        if (result.success) {
            // 显示成功消息
            document.getElementById('profileSuccessMsg').style.display = 'block';
            document.getElementById('profileForm').style.display = 'none';
            
            // 3秒后关闭弹窗并刷新页面
            setTimeout(() => {
                closeProfileModal();
                window.location.reload();
            }, 3000);
        } else {
            showProfileError(result.message || '保存失败，请重试');
        }
    } catch (error) {
        console.error('提交个人信息失败:', error);
        showProfileError('网络错误，请重试');
    }
}

// 页面加载时检查个人信息完善状态
document.addEventListener('DOMContentLoaded', function() {
    // 延迟检查，确保其他功能先初始化
    setTimeout(() => {
        checkProfileCompletion();
    }, 1000);
});

// 加载动画样式
(function(){
    const style = document.createElement('style');
    style.innerHTML = `
    .loader {
        display: inline-block;
        width: 24px;
        height: 24px;
        border: 3px solid #1976d2;
        border-radius: 50%;
        border-top: 3px solid transparent;
        animation: spin 1s linear infinite;
        vertical-align: middle;
    }
    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
    `;
    document.head.appendChild(style);
})();

// =====================
// 头像裁剪功能
// =====================

let avatarCropData = {
    image: null,
    scale: 1,
    offsetX: 0,
    offsetY: 0,
    isDragging: false,
    startX: 0,
    startY: 0,
    originalOffsetX: 0,
    originalOffsetY: 0
};

// 打开头像裁剪弹窗
function openAvatarCropModal(imageFile) {
    const modal = document.getElementById('avatarCropModal');
    const cropImage = document.getElementById('avatarCropImage');
    
    if (!modal || !cropImage) {
        console.error('头像裁剪弹窗元素不存在');
        return;
    }
    
    // 创建图片URL
    const imageUrl = URL.createObjectURL(imageFile);
    cropImage.src = imageUrl;
    
    // 重置裁剪数据
    avatarCropData = {
        image: imageFile,
        scale: 1,
        offsetX: 0,
        offsetY: 0,
        isDragging: false,
        startX: 0,
        startY: 0,
        originalOffsetX: 0,
        originalOffsetY: 0
    };
    
    // 显示弹窗并确保在最顶层
    modal.style.display = 'block';
    modal.style.zIndex = '20000';
    
    // 绑定事件
    bindAvatarCropEvents();
    
    // 绑定弹窗点击事件，防止事件传播
    modal.addEventListener('click', handleAvatarCropModalClick, true);
    
    // 阻止弹窗内所有元素的点击事件传播
    const cropContent = modal.querySelector('.avatar-crop-content');
    if (cropContent) {
        cropContent.addEventListener('click', function(e) {
            // 如果点击的是按钮，不阻止事件
            if (e.target.classList.contains('avatar-crop-btn') || 
                e.target.classList.contains('avatar-crop-close') ||
                e.target.closest('.avatar-crop-btn') ||
                e.target.closest('.avatar-crop-close')) {
                return;
            }
            
            e.stopPropagation();
            e.stopImmediatePropagation();
        }, true);
    }
    
    // 图片加载完成后初始化
    cropImage.onload = function() {
        initializeAvatarCrop();
    };
}

// 关闭头像裁剪弹窗
function closeAvatarCropModal() {
    console.log('执行关闭头像裁剪弹窗');
    const modal = document.getElementById('avatarCropModal');
    if (!modal) {
        console.log('未找到裁剪弹窗元素');
        return;
    }
    
    modal.style.display = 'none';
    
    // 清理事件绑定
    unbindAvatarCropEvents();
    
    // 移除弹窗点击事件监听器
    modal.removeEventListener('click', handleAvatarCropModalClick, true);
    
    // 移除内容区域事件监听器
    const cropContent = modal.querySelector('.avatar-crop-content');
    if (cropContent) {
        cropContent.removeEventListener('click', function(e) {
            e.stopPropagation();
            e.stopImmediatePropagation();
        }, true);
    }
    
    // 清理图片URL
    const cropImage = document.getElementById('avatarCropImage');
    if (cropImage && cropImage.src) {
        URL.revokeObjectURL(cropImage.src);
    }
}

// 初始化头像裁剪
function initializeAvatarCrop() {
    const cropImage = document.getElementById('avatarCropImage');
    const zoomSlider = document.getElementById('avatarCropZoom');
    const zoomValue = document.getElementById('avatarCropZoomValue');
    
    if (!cropImage || !zoomSlider || !zoomValue) return;
    
    // 重置缩放
    zoomSlider.value = 1;
    zoomValue.textContent = '100%';
    
    // 重置位置
    avatarCropData.scale = 1;
    avatarCropData.offsetX = 0;
    avatarCropData.offsetY = 0;
    
    updateAvatarCropTransform();
}

// 绑定头像裁剪事件
function bindAvatarCropEvents() {
    const cropImage = document.getElementById('avatarCropImage');
    const zoomSlider = document.getElementById('avatarCropZoom');
    const zoomValue = document.getElementById('avatarCropZoomValue');
    
    if (!cropImage || !zoomSlider || !zoomValue) return;
    
    // 缩放事件
    const zoomHandler = function() {
        avatarCropData.scale = parseFloat(this.value);
        zoomValue.textContent = Math.round(avatarCropData.scale * 100) + '%';
        updateAvatarCropTransform();
    };
    
    zoomSlider.addEventListener('input', zoomHandler);
    zoomSlider._zoomHandler = zoomHandler; // 保存引用以便移除
    
    // 鼠标事件 - 使用捕获阶段确保事件优先处理
    cropImage.addEventListener('mousedown', startAvatarCropDrag, true);
    document.addEventListener('mousemove', updateAvatarCropDrag, true);
    document.addEventListener('mouseup', stopAvatarCropDrag, true);
    
    // 触摸事件（移动端）- 使用捕获阶段确保事件优先处理
    cropImage.addEventListener('touchstart', startAvatarCropDrag, true);
    document.addEventListener('touchmove', updateAvatarCropDrag, true);
    document.addEventListener('touchend', stopAvatarCropDrag, true);
    
    // 为按钮添加点击事件处理
    const resetBtn = document.querySelector('.avatar-crop-reset');
    const applyBtn = document.querySelector('.avatar-crop-apply');
    const closeBtn = document.querySelector('.avatar-crop-close');
    
    // 创建按钮事件处理函数
    const resetHandler = function(e) {
        console.log('重置按钮被点击');
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        resetAvatarCrop();
    };
    
    const applyHandler = function(e) {
        console.log('应用按钮被点击');
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        applyAvatarCrop();
    };
    
    const closeHandler = function(e) {
        console.log('关闭按钮被点击');
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        closeAvatarCropModal();
    };
    
    if (resetBtn) {
        console.log('找到重置按钮，绑定事件');
        resetBtn.addEventListener('click', resetHandler, true);
        resetBtn._resetHandler = resetHandler; // 保存引用
    } else {
        console.log('未找到重置按钮');
    }
    
    if (applyBtn) {
        console.log('找到应用按钮，绑定事件');
        applyBtn.addEventListener('click', applyHandler, true);
        applyBtn._applyHandler = applyHandler; // 保存引用
    } else {
        console.log('未找到应用按钮');
    }
    
    if (closeBtn) {
        console.log('找到关闭按钮，绑定事件');
        closeBtn.addEventListener('click', closeHandler, true);
        closeBtn._closeHandler = closeHandler; // 保存引用
    } else {
        console.log('未找到关闭按钮');
    }
}

// 解绑头像裁剪事件
function unbindAvatarCropEvents() {
    const cropImage = document.getElementById('avatarCropImage');
    const zoomSlider = document.getElementById('avatarCropZoom');
    
    if (!cropImage || !zoomSlider) return;
    
    // 移除缩放事件监听器
    if (zoomSlider._zoomHandler) {
        zoomSlider.removeEventListener('input', zoomSlider._zoomHandler);
        delete zoomSlider._zoomHandler;
    }
    
    // 移除鼠标事件监听器 - 使用捕获阶段
    cropImage.removeEventListener('mousedown', startAvatarCropDrag, true);
    document.removeEventListener('mousemove', updateAvatarCropDrag, true);
    document.removeEventListener('mouseup', stopAvatarCropDrag, true);
    
    // 移除触摸事件监听器 - 使用捕获阶段
    cropImage.removeEventListener('touchstart', startAvatarCropDrag, true);
    document.removeEventListener('touchmove', updateAvatarCropDrag, true);
    document.removeEventListener('touchend', stopAvatarCropDrag, true);
    
    // 移除按钮事件监听器
    const resetBtn = document.querySelector('.avatar-crop-reset');
    const applyBtn = document.querySelector('.avatar-crop-apply');
    const closeBtn = document.querySelector('.avatar-crop-close');
    
    if (resetBtn && resetBtn._resetHandler) {
        resetBtn.removeEventListener('click', resetBtn._resetHandler, true);
        delete resetBtn._resetHandler;
    }
    
    if (applyBtn && applyBtn._applyHandler) {
        applyBtn.removeEventListener('click', applyBtn._applyHandler, true);
        delete applyBtn._applyHandler;
    }
    
    if (closeBtn && closeBtn._closeHandler) {
        closeBtn.removeEventListener('click', closeBtn._closeHandler, true);
        delete closeBtn._closeHandler;
    }
}

// 开始拖拽
function startAvatarCropDrag(e) {
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();
    
    const isTouch = e.type === 'touchstart';
    const clientX = isTouch ? e.touches[0].clientX : e.clientX;
    const clientY = isTouch ? e.touches[0].clientY : e.clientY;
    
    avatarCropData.isDragging = true;
    avatarCropData.startX = clientX;
    avatarCropData.startY = clientY;
    avatarCropData.originalOffsetX = avatarCropData.offsetX;
    avatarCropData.originalOffsetY = avatarCropData.offsetY;
}

// 更新拖拽
function updateAvatarCropDrag(e) {
    if (!avatarCropData.isDragging) return;
    
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();
    
    const isTouch = e.type === 'touchmove';
    const clientX = isTouch ? e.touches[0].clientX : e.clientX;
    const clientY = isTouch ? e.touches[0].clientY : e.clientY;
    
    const deltaX = clientX - avatarCropData.startX;
    const deltaY = clientY - avatarCropData.startY;
    
    avatarCropData.offsetX = avatarCropData.originalOffsetX + deltaX;
    avatarCropData.offsetY = avatarCropData.originalOffsetY + deltaY;
    
    updateAvatarCropTransform();
}

// 停止拖拽
function stopAvatarCropDrag(e) {
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();
    avatarCropData.isDragging = false;
}

// 处理头像裁剪弹窗点击事件
function handleAvatarCropModalClick(e) {
    // 如果点击的是按钮，不阻止事件
    if (e.target.classList.contains('avatar-crop-btn') || 
        e.target.classList.contains('avatar-crop-close') ||
        e.target.closest('.avatar-crop-btn') ||
        e.target.closest('.avatar-crop-close')) {
        return;
    }
    
    // 阻止事件传播到底层
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();
    
    // 如果点击的是弹窗背景，不关闭弹窗
    if (e.target.classList.contains('avatar-crop-modal')) {
        return false;
    }
}

// 更新头像裁剪变换
function updateAvatarCropTransform() {
    const cropImage = document.getElementById('avatarCropImage');
    if (!cropImage) return;
    
    const transform = `translate(-50%, -50%) scale(${avatarCropData.scale}) translate(${avatarCropData.offsetX}px, ${avatarCropData.offsetY}px)`;
    cropImage.style.transform = transform;
}

// 重置头像裁剪
function resetAvatarCrop() {
    console.log('执行重置头像裁剪');
    initializeAvatarCrop();
}

// 应用头像裁剪
function applyAvatarCrop() {
    console.log('执行应用头像裁剪');
    const cropImage = document.getElementById('avatarCropImage');
    if (!cropImage) {
        console.log('未找到裁剪图片元素');
        return;
    }
    
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // 设置画布大小为最终头像尺寸
    canvas.width = 140;
    canvas.height = 140;
    
    // 计算裁剪区域
    const cropSize = 200; // 裁剪框大小
    const imageSize = cropImage.naturalWidth;
    const scale = avatarCropData.scale;
    
    // 计算源图像中的裁剪区域
    const sourceX = (imageSize / 2) - (cropSize / 2 / scale) + (avatarCropData.offsetX / scale);
    const sourceY = (imageSize / 2) - (cropSize / 2 / scale) + (avatarCropData.offsetY / scale);
    const sourceSize = cropSize / scale;
    
    // 绘制裁剪后的图像
    ctx.drawImage(
        cropImage,
        sourceX, sourceY, sourceSize, sourceSize,
        0, 0, 140, 140
    );
    
    // 将画布转换为Blob
    canvas.toBlob(function(blob) {
        // 获取原文件名
        let originalFileName = 'avatar_cropped.png'; // 默认文件名
        if (avatarCropData.image && avatarCropData.image.name) {
            // 保持原文件名，但确保扩展名为.png
            const originalName = avatarCropData.image.name;
            const nameWithoutExt = originalName.substring(0, originalName.lastIndexOf('.'));
            originalFileName = nameWithoutExt + '.png';
        }
        
        // 创建新的File对象，保持原文件名
        const croppedFile = new File([blob], originalFileName, {
            type: 'image/png'
        });
        
        // 更新头像预览
        updateAvatarPreview(croppedFile);
        
        // 关闭裁剪弹窗
        closeAvatarCropModal();
    }, 'image/png', 0.95);
}

// 更新头像预览
function updateAvatarPreview(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
        const preview = document.getElementById('profileAvatarPreview');
        const placeholder = document.getElementById('profileAvatarPlaceholder');
        
        if (preview && placeholder) {
            preview.innerHTML = `<img src="${e.target.result}" alt="头像预览">`;
            preview.style.display = 'flex';
            placeholder.style.display = 'none';
            
            // 更新文件输入框
            const avatarInput = document.getElementById('profileAvatar');
            if (avatarInput) {
                const dataTransfer = new DataTransfer();
                dataTransfer.items.add(file);
                avatarInput.files = dataTransfer.files;
            }
        }
    };
    reader.readAsDataURL(file);
}

