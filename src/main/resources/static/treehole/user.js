/**
 * user.js — 用户模块
 * 负责右上角头像按钮的渲染与同步
 * 支持从 API 获取用户头像（UUID 格式 → /resource/{uuid}）
 */
window.UserModule = (function () {

  function init() {
    fetchCurrentUser();
  }

  /**
   * 将 avatar UUID 转换为完整的资源 URL
   * @param {string} avatar - UUID 格式的头像标识
   * @returns {string|null} 完整的头像 URL 或 null
   */
  function resolveAvatarUrl(avatar) {
    if (!avatar) return null;
    // 如果已经是完整 URL，直接返回
    if (avatar.startsWith('http://') || avatar.startsWith('https://') || avatar.startsWith('/')) {
      return avatar;
    }
    // 假设是 UUID 格式，转换为 /resources/{uuid}
    return '/resources/' + avatar;
  }

  async function fetchCurrentUser() {
    try {
      const res = await fetch("https://api.szsummer.com/api/users/me", { credentials: "include" });
      if (res.ok) {
        const u = await res.json();

        // 处理头像 URL：支持 avatar 字段（UUID 格式）
        const avatarUrl = resolveAvatarUrl(u.avatar || u.avatarUrl);

        Store.updateUser({
          id: u.userId || u.id,
          nickname: u.username || u.nickname,
          avatarUrl: avatarUrl,
          avatarLetter: u.username ? u.username.substring(0, 1) : "我",
          uuid: u.userId || u.id  // 保存用户 UUID 用于后续跳转
        });
      } else {
        // 如果未登录且当前在需要权限的页面，重定向
        const protectedPages = ['publish.html', 'settings.html', 'favorites.html'];
        const currentPage = window.location.pathname.split('/').pop();
        if (protectedPages.includes(currentPage)) {
          window.location.href = "../login/index.html?redirect=" + encodeURIComponent(window.location.pathname);
        }
      }
    } catch (e) {
      console.warn("fetchCurrentUser failed:", e);
    }
    renderUserBadge();
  }

  function renderUserBadge() {
    const btn = document.getElementById("userAvatarBtn");
    if (!btn) return;
    const u = Store.currentUser;
    if (u.avatarUrl) {
      btn.textContent = "";
      btn.style.backgroundImage = `url(${u.avatarUrl})`;
      btn.style.backgroundSize = "cover";
      btn.style.backgroundPosition = "center";
    } else {
      const letter = u.avatarLetter || u.nickname ? u.nickname.substring(0, 1) : "我";
      btn.textContent = letter;
      btn.style.backgroundImage = "linear-gradient(135deg, #ff9a9e 0%, #fecfef 50%, #fecfef 100%)";
      btn.style.backgroundSize = "auto";
    }
  }

  function openSettings() {
    window.location.href = "settings.html";
  }

  return { init, renderUserBadge, openSettings, resolveAvatarUrl };
})();
