// 图片校验
function validateImageFile(file) {
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp'];
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (!allowedTypes.includes(file.type)) {
        return false;
    }
    if (file.size > maxSize) {
        return false;
    }
    return true;
}

// 图片压缩
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

// 图片预览
function handleImageInput(inputElement, previewSelector) {
    const file = inputElement.files[0];
    const preview = document.querySelector(previewSelector);
    if (!file || !preview) return;
    const reader = new FileReader();
    reader.onload = function(e) {
        preview.innerHTML = `<img src="${e.target.result}" alt="预览图" style="max-width:100%;max-height:100%;object-fit:contain;">`;
    };
    reader.readAsDataURL(file);
    // 可选：压缩图片后再替换inputElement.files
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

// 头像裁剪相关（简化版，需页面有对应HTML结构）
function openAvatarCropModal(imageFile, options = {}) {
    const modal = document.getElementById('avatarCropModal');
    const cropImage = document.getElementById('avatarCropImage');
    if (!modal || !cropImage) {
        alert('页面缺少裁剪弹窗相关元素');
        return;
    }
    const imageUrl = URL.createObjectURL(imageFile);
    cropImage.src = imageUrl;
    modal.style.display = 'block';

    // 绑定关闭事件
    modal.querySelector('.avatar-crop-close')?.addEventListener('click', function() {
        modal.style.display = 'none';
        URL.revokeObjectURL(imageUrl);
    });

    // 绑定应用事件
    modal.querySelector('.avatar-crop-apply')?.onclick = function() {
        // 获取裁剪参数
        // 这里假设你有全局变量 cropCircleDiameter, avatarCropData, 并且cropImage已加载
        // 你可以根据实际情况调整
        const canvasSize = window.cropCircleDiameter || 200;
        const canvas = document.createElement('canvas');
        canvas.width = canvasSize;
        canvas.height = canvasSize;
        const ctx = canvas.getContext('2d');
        // 获取裁剪参数
        const scale = window.avatarCropData?.scale || 1;
        const offsetX = window.avatarCropData?.offsetX || 0;
        const offsetY = window.avatarCropData?.offsetY || 0;
        const imgW = cropImage.naturalWidth;
        const imgH = cropImage.naturalHeight;
        // 计算图片原始像素下，圆心在图片上的坐标
        const centerX = imgW / 2 - offsetX / scale;
        const centerY = imgH / 2 - offsetY / scale;
        // 计算采样区域（正方形，边长=canvasSize/scale）
        const sourceSize = canvasSize / scale;
        const sourceX = centerX - sourceSize / 2;
        const sourceY = centerY - sourceSize / 2;
        // 在canvas中心画圆形
        ctx.save();
        ctx.beginPath();
        ctx.arc(canvasSize / 2, canvasSize / 2, canvasSize / 2, 0, 2 * Math.PI);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(
            cropImage,
            sourceX, sourceY, sourceSize, sourceSize,
            0, 0, canvasSize, canvasSize
        );
        ctx.restore();
        // 导出图片
        canvas.toBlob(function(blob) {
            if (typeof options.onCrop === 'function' && blob) {
                const croppedFile = new File([blob], 'avatar_cropped.png', {type: 'image/png'});
                options.onCrop(croppedFile);
            }
            modal.style.display = 'none';
            URL.revokeObjectURL(imageUrl);
        }, 'image/png', 0.95);
    };
}

// 导出为全局变量，便于其它页面直接调用
window.validateImageFile = validateImageFile;
window.compressImage = compressImage;
window.handleImageInput = handleImageInput;
window.openAvatarCropModal = openAvatarCropModal; 

// 处理后的图像位置说明：
// 1. compressImage函数：压缩后的图像通过callback回调函数返回，存储在内存中的Blob对象
// 2. handleImageInput函数：压缩后的图像替换了原始inputElement.files，同时预览显示在preview元素中
// 3. openAvatarCropModal函数：裁剪后的图像通过options.onCrop回调函数返回，作为File对象传递给调用者