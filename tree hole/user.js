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
    const avatarImg = localStorage.getItem("th_avatar_img");
    if (avatarImg) {
      btn.textContent = "";
      btn.style.backgroundImage = `url(${avatarImg})`;
      btn.style.backgroundSize = "cover";
      btn.style.backgroundPosition = "center";
      btn.style.background = `url(${avatarImg}) center/cover`;
    } else {
      btn.textContent = u.avatarLetter || "我";
      btn.style.backgroundImage = "";
      btn.style.background = u.avatarColor || "#555";
    }
  }

  function openSettings() {
    window.location.href = "settings.html";
  }

  return { init, renderUserBadge, openSettings };
})();
