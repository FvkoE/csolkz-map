// 模态框操作
window.modal = {
    // 添加地图相关操作
    add: {
        open() {
            document.getElementById('addModal').style.display = 'flex';
        },
        close() {
            document.getElementById('addModal').style.display = 'none';
            // 清空表单
            document.querySelector('.add-map-form').reset();
            document.querySelector('.file-preview').innerHTML = '';
        }
    },
    // 修改地图相关操作
    edit: {
        open(mapId, name, author, region, difficulty, image) {
            document.getElementById('editModal').style.display = 'flex';
            // 填充表单数据
            document.getElementById('editMapId').value = mapId;
            document.getElementById('editMapName').value = name;
            document.getElementById('editMapAuthor').value = author;
            document.getElementById('editMapRegion').value = region;
            document.getElementById('editMapDifficulty').value = difficulty;
        },
        close() {
            document.getElementById('editModal').style.display = 'none';
            document.querySelector('.edit-map-form').reset();
            // 新增：强制清空图片input和预览区
            const imgInput = document.getElementById('editMapImage');
            if(imgInput) imgInput.value = '';
            const preview = document.getElementById('editMapImagePreview');
            if(preview) preview.innerHTML = '<p class="current-image-text">当前图片：</p><img class="edit-modal-image-preview" src="" alt="当前地图预览图">';
        }
    },
    // 点击模态框外部关闭处理
    handleOutsideClick(event) {
        if (event.target.classList.contains('modal')) {
            if (event.target.id === 'addModal') {
                window.modal.add.close();
            } else if (event.target.id === 'editModal') {
                window.modal.edit.close();
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

// 添加地图表单AJAX
const addForm = document.querySelector('.add-map-form');
if(addForm){
    const loadingMask = document.getElementById('loadingMask');
    const showLoading = () => { if(loadingMask) loadingMask.style.display = 'flex'; };
    const hideLoading = () => { if(loadingMask) loadingMask.style.display = 'none'; };

    addForm.onsubmit = function(e){
        e.preventDefault();
        showLoading(); // 显示加载动画
        const formData = new FormData(this);
        fetch('/map/add', {
            method: 'POST',
            body: formData,
            headers: {'X-Requested-With': 'XMLHttpRequest'}
        })
        .then(res=>res.json())
        .then(data=>{
            hideLoading(); // 隐藏加载动画
            if(data.success){
                // 清理特定字段，而不是重置整个表单
                document.getElementById('mapName').value = '';
                document.getElementById('mapAuthor').value = '';
                document.getElementById('mapImage').value = '';
                document.querySelector('#addModal .file-preview').innerHTML = '';

                // 提示成功，但不关闭窗口，方便继续添加
                showSuccessModal('申请成功！您可以继续添加。');
            }else{
                showErrorModal(data.msg||'申请失败');
            }
        })
        .catch(()=>{
            hideLoading(); // 隐藏加载动画
            showErrorModal('网络错误');
        });
    }
}

// 记录编辑弹窗原始数据
let editModalOriginalData = null;

// 修改 openEditModal，记录原始数据
window.openEditModal = function(mapId, name, author, region, difficulty, image) {
    window.modal.edit.open(mapId, name, author, region, difficulty, image);
    editModalOriginalData = {
        mapId, name, author, region, difficulty, image,
        imageFile: null
    };
    const imgInput = document.getElementById('editMapImage');
    if(imgInput) imgInput.value = '';
    let imgSrc = image;
    if(imgSrc && !/^https?:\/\//.test(imgSrc)) {
        imgSrc = '/static/' + imgSrc.replace(/^\/*/, '');
    }
    const preview = document.getElementById('editMapImagePreview');
    if(preview) {
        preview.innerHTML = '<p class="current-image-text">当前图片：</p><img class="edit-modal-image-preview" src="'+imgSrc+'" alt="当前地图预览图">';
    }
};

// 监听图片input变化，记录是否有新图
const editImgInput = document.getElementById('editMapImage');
if(editImgInput){
    editImgInput.addEventListener('change', function(e){
        if(editModalOriginalData) {
            editModalOriginalData.imageFile = e.target.files[0] || null;
        }
    });
}

// 判断表单是否有变动
function isEditFormChanged() {
    if(!editModalOriginalData) return true;
    const name = document.getElementById('editMapName').value;
    const author = document.getElementById('editMapAuthor').value;
    const region = document.getElementById('editMapRegion').value;
    const difficulty = document.getElementById('editMapDifficulty').value;
    // 只要有一项不同或有新图片
    if(name !== editModalOriginalData.name) return true;
    if(author !== editModalOriginalData.author) return true;
    if(region !== editModalOriginalData.region) return true;
    if(difficulty !== editModalOriginalData.difficulty) return true;
    if(editModalOriginalData.imageFile) return true;
    return false;
}

// 拦截编辑表单提交
const editForm = document.querySelector('.edit-map-form');
if(editForm){
    editForm.onsubmit = function(e){
        if(!isEditFormChanged()){
            showErrorModal('请先修改信息后再提交！');
            e.preventDefault();
            return;
        }
        e.preventDefault();
        const mapId = document.getElementById('editMapId').value;
        const formData = new FormData(this);
        fetch(`/map/edit/${mapId}`, {
            method: 'POST',
            body: formData,
            headers: {'X-Requested-With': 'XMLHttpRequest'}
        })
        .then(res => {
            // 尝试解析JSON，失败也视为成功（兼容后端重定向）
            return res.json().catch(()=>({success:true, force:true}));
        })
        .then(data=>{
            if(data.success){
                this.reset();
                showSuccessModal('修改申请已提交，等待管理员审核！');
                window.modal.edit.close();
            }else{
                showErrorModal(data.msg||'修改申请失败');
            }
        })
        .catch(()=>{
            // 如果请求本身没报错，也直接刷新页面（防止误判）
            window.location.reload();
        });
    }
}


document.addEventListener('DOMContentLoaded', function() {
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
    if (addForm) {
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

function openAddModal() {
    const modal = document.getElementById('addModal');
    if(modal) modal.style.display = 'flex';
}
function closeAddModal() {
    const modal = document.getElementById('addModal');
    if(!modal) return;
    modal.style.display = 'none';
    const form = modal.querySelector('.add-map-form');
    if (form) form.reset();
    const preview = modal.querySelector('#addMapImagePreview');
    if (preview) preview.innerHTML = '';
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

