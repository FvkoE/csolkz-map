let pendingRejectId = null;
let pendingRejectBtn = null;
function openRejectModal(id, btn) {
    pendingRejectId = id;
    pendingRejectBtn = btn;
    document.getElementById('rejectReasonInput').value = '';
    document.getElementById('rejectModal').style.display = 'flex';
}
function closeRejectModal() {
    document.getElementById('rejectModal').style.display = 'none';
    pendingRejectId = null;
    pendingRejectBtn = null;
}
function confirmRejectReason() {
    const reason = document.getElementById('rejectReasonInput').value.trim();
    if (!reason) { alert('请填写拒绝理由'); return; }
    reviewUploadApply(pendingRejectId, 'reject', pendingRejectBtn, reason);
    closeRejectModal();
}
function reviewUploadApply(id, action, btn, reason) {
    let payload = { action: action };
    if (action === 'reject') payload['reject_reason'] = reason || '';
    fetch(`/admin/upload_apply/review/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            btn.closest('tr').remove();
        } else {
            alert('操作失败：' + (data.msg || '未知错误'));
        }
    })
    .catch(() => alert('请求失败'));
} 