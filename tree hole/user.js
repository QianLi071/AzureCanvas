/**
 * user.js — 用户模块
 * 仅负责右上角头像按钮的渲染与同步
 */
window.UserModule = (function () {

  function init() {
    renderUserBadge();
  }

  function renderUserBadge() {
    const btn = document.getElementById("userAvatarBtn");
    if (!btn) return;
    const u = Store.currentUser;
    btn.textContent = u.avatarLetter || "我";
    btn.style.background = u.avatarColor || "#555";
  }

  // openSettings kept for compatibility but now navigates to settings.html
  function openSettings() {
    window.location.href = "settings.html";
  }

  return { init, renderUserBadge, openSettings };
})();
