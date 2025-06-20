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
        const preview = isEdit ? 
            event.target.closest('.file-upload').querySelector(previewSelector) :
            document.querySelector(previewSelector);
        
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
    addForm.onsubmit = function(e){
        e.preventDefault();
        const formData = new FormData(this);
        fetch('/map/add', {
            method: 'POST',
            body: formData,
            headers: {'X-Requested-With': 'XMLHttpRequest'}
        })
        .then(res=>res.json())
        .then(data=>{
            if(data.success){
                this.reset();
                document.querySelector('#addModal .file-preview').innerHTML = '';
                showSuccessModal('添加成功，等待管理员审核！');
                window.modal.add.close();
            }else{
                showErrorModal(data.msg||'申请失败');
            }
        })
        .catch(()=>showErrorModal('网络错误'));
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

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    // 初始化图片预览功能
    window.imagePreview.init();

    // 初始化模态框外部点击关闭
    window.addEventListener('click', window.modal.handleOutsideClick);

    // 恢复滚动位置
    const scrollY = sessionStorage.getItem('mainpage_scrollY');
    if(scrollY) {
        window.scrollTo(0, parseInt(scrollY));
        sessionStorage.removeItem('mainpage_scrollY');
    }

    // 搜索框自动聚焦并光标移到末尾（无论有无内容）
    let searchInput = document.querySelector('.search-input');
    if(searchInput) {
        searchInput.focus();
        // 将光标移到末尾
        const val = searchInput.value;
        searchInput.value = '';
        searchInput.value = val;
    }

    // 搜索输入仅回车提交，彻底避免输入法被打断
    if(searchInput) {
        searchInput.addEventListener('keydown', function(e) {
            if(e.key === 'Enter') {
                e.preventDefault();
                recordScrollAndSubmit(document.querySelector('.filter-section'));
            }
        });
    }

    // 封装筛选前记录滚动位置的函数
    function recordScrollAndSubmit(form) {
        sessionStorage.setItem('mainpage_scrollY', window.scrollY);
        form.submit();
    }
    // 地图大区按钮自动提交
    document.querySelectorAll('.region-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            document.getElementById('regionInput').value = this.getAttribute('data-value');
            recordScrollAndSubmit(document.querySelector('.filter-section'));
        });
    });
    // 地图类型按钮自动提交
    document.querySelectorAll('.filter-option').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            if(document.getElementById('typeInput')){
                document.getElementById('typeInput').value = this.textContent.trim();
            }
            recordScrollAndSubmit(document.querySelector('.filter-section'));
        });
    });
    // 难度下拉和搜索输入自动提交也加上滚动记录
    const levelSelect = document.getElementById('levelSelect');
    if(levelSelect){
        levelSelect.addEventListener('change', function(){
            recordScrollAndSubmit(document.querySelector('.filter-section'));
        });
    }
});

// 全局函数，供HTML直接调用
window.openAddModal = function() { window.modal.add.open(); }
window.closeAddModal = function() { window.modal.add.close(); }
window.closeEditModal = function() {
    window.modal.edit.close();
    editModalOriginalData = null;
    // 再次确保彻底清空input和预览（只操作弹窗内）
    const imgInput = document.getElementById('editMapImage');
    if(imgInput) imgInput.value = '';
    const preview = document.getElementById('editMapImagePreview');
    if(preview) preview.innerHTML = '<p class="current-image-text">当前图片：</p><img class="edit-modal-image-preview" src="" alt="当前地图预览图">';
}

window.openAdviceBox = function() {
    document.getElementById('adviceModal').style.display = 'flex';
    document.getElementById('adviceForm').style.display = '';
    document.getElementById('adviceSuccessMsg').style.display = 'none';
    document.getElementById('adviceContent').value = '';
    document.getElementById('adviceContent').focus();
}
window.closeAdviceBox = function() {
    document.getElementById('adviceModal').style.display = 'none';
}
window.submitAdvice = function(e) {
    e.preventDefault();
    var content = document.getElementById('adviceContent').value.trim();
    if (!content) {
        alert('请填写建议内容');
        return;
    }
    fetch('/advice/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content })
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            document.getElementById('adviceForm').style.display = 'none';
            document.getElementById('adviceSuccessMsg').style.display = '';
        } else {
            alert(data.msg || '提交失败');
        }
    })
    .catch(() => alert('网络错误'));
}

// 图片上传限制检测函数
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