// 模态框操作
window.modal = {
    // 添加地图相关操作
    add: {
        open() {
            // 每次打开时，都从sessionStorage加载草稿，确保数据恢复
            const addMapForm = document.querySelector('.add-map-form');
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
                    document.querySelector('.add-map-form .file-preview').innerHTML = '';
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
    const addMapForm = document.querySelector('.add-map-form');
    const loadingMask = document.getElementById('loadingMask');
    
    // ===================================
    //  草稿处理函数
    // ===================================
    const DRAFT_KEY_PREFIX = 'add_map_draft_';

    function saveDraft() {
        if (!addMapForm) return;
        const formData = new FormData(addMapForm);
        for (let [key, value] of formData.entries()) {
            if (key !== 'image' && value) {
                sessionStorage.setItem(DRAFT_KEY_PREFIX + key, value);
            }
        }
    }

    function loadDraft() {
        if (!addMapForm) return;
        for (let i = 0; i < sessionStorage.length; i++) {
            const key = sessionStorage.key(i);
            if (key.startsWith(DRAFT_KEY_PREFIX)) {
                const formKey = key.replace(DRAFT_KEY_PREFIX, '');
                const element = addMapForm.elements[formKey];
                const value = sessionStorage.getItem(key);
                if (element && value) {
                    element.value = value;
                }
            }
        }
    }

    function clearDraft() {
        if (!addMapForm) return;
        const keysToRemove = [];
        for (let i = 0; i < sessionStorage.length; i++) {
            const key = sessionStorage.key(i);
            if (key.startsWith(DRAFT_KEY_PREFIX)) {
                keysToRemove.push(key);
            }
        }
        keysToRemove.forEach(key => sessionStorage.removeItem(key));
        addMapForm.reset();
        const preview = addMapForm.querySelector('.file-preview');
        if (preview) preview.innerHTML = '';
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
    //  表单处理
    // ===================================
    if (addMapForm) {
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

            // 更新按钮的激活状态
            const params = new URL(url).searchParams;
            const region = params.get('region') || '';
            const type = params.get('type') || '';

            document.querySelectorAll('.region-btn').forEach(btn => {
                btn.classList.toggle('active', btn.dataset.value === region);
            });
    
            document.querySelectorAll('.type-btn').forEach(btn => {
                btn.classList.toggle('active', btn.dataset.value === type);
            });

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

        filterForm.querySelectorAll('.region-btn, .type-btn').forEach(button => {
            button.addEventListener('click', () => {
                const inputId = button.classList.contains('region-btn') ? 'regionInput' : 'typeInput';
                document.getElementById(inputId).value = button.dataset.value;
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
             if (event.target.matches('.clear-filter-btn')) {
                event.preventDefault();
                applyFilters(event.target.href);
                
                // Bug修复：手动重置表单项
                const levelSelect = document.getElementById('levelSelect');
                if (levelSelect) levelSelect.selectedIndex = 0;
                
                const searchInput = document.querySelector('.search-input[name="search"]');
                if (searchInput) searchInput.value = '';
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

