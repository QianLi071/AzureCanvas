/**
 * message.js — 私信模块
 * 私聊页面、快捷回复、表情包发送
 * 参考抖音私信界面：自己消息靠右，对方消息靠左
 * 通过 window.MessageModule 暴露
 * 依赖：store.js（Store）、render.js（Render）
 */
window.MessageModule = (function () {

  // 当前私聊对象
  let chatTarget = null; // { id, nickname, avatarLetter }

  // 快捷回复预设（日常用语）
  const QUICK_REPLIES = [
    "好的👍", "收到！", "哈哈哈", "在吗？",
    "谢谢你", "辛苦了", "加油！", "晚点回复你"
  ];

  // 自定义快捷回复（从 localStorage 读取）
  let customReplies = [];

  // 表情包列表（文字表情包）
  const EMOJI_STICKERS = [
    "😂", "🥺", "😭", "🤣", "😍", "🙃", "😤", "🥳",
    "👀", "💀", "🫡", "🤡", "😴", "🤯", "🫶", "✌️",
    "🐶", "🐱", "🐸", "🦆", "🐼", "🦊", "🐧", "🦁"
  ];

  // 自动回复设置
  let autoReplyEnabled = false;
  let autoReplyText = "你好！我现在不在，稍后回复你 😊";

  function init() {
    // 加载自定义快捷回复
    try { customReplies = JSON.parse(localStorage.getItem("th_custom_replies")) || []; }
    catch (e) { customReplies = []; }
    try {
      const ar = JSON.parse(localStorage.getItem("th_auto_reply") || "{}");
      autoReplyEnabled = ar.enabled || false;
      autoReplyText = ar.text || autoReplyText;
    } catch(e) {}

    // 发送按钮
    document.getElementById("msgSendBtn").addEventListener("click", sendMsg);

    // 输入框回车发送
    document.getElementById("msgInput").addEventListener("keydown", e => {
      if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMsg(); }
    });

    // 快捷回复面板切换
    document.getElementById("msgQuickBtn").addEventListener("click", e => {
      e.stopPropagation();
      document.getElementById("quickReplyPanel").classList.toggle("open");
      document.getElementById("msgEmojiPanel").classList.remove("open");
    });

    // 表情包面板切换
    document.getElementById("msgEmojiBtn").addEventListener("click", e => {
      e.stopPropagation();
      document.getElementById("msgEmojiPanel").classList.toggle("open");
      document.getElementById("quickReplyPanel").classList.remove("open");
    });

    // 返回按钮
    document.getElementById("msgBackBtn").addEventListener("click", () => {
      document.dispatchEvent(new CustomEvent("th:closeMessage"));
    });

    // 渲染表情包面板
    renderEmojiPanel();
  }

  /**
   * 打开与某用户的私聊
   * @param {string} userId
   * @param {string} nickname
   * @param {string} avatarLetter
   */
  function openChat(userId, nickname, avatarLetter) {
    chatTarget = { id: userId, nickname, avatarLetter };
    document.getElementById("msgTargetName").textContent = nickname;
    document.getElementById("msgTargetAvatar").textContent = avatarLetter || "匿";
    renderChat();
    renderQuickReplies();
    // 显示私信视图
    document.getElementById("messageView").classList.add("active");
    document.getElementById("homeView").classList.add("hidden");
    document.getElementById("detailView").classList.remove("active");
  }

  /** 发送消息 */
  function sendMsg(text, type) {
    if (!chatTarget) return;
    const input = document.getElementById("msgInput");
    const msgText = text || input.value.trim();
    if (!msgText) return;
    Store.sendMessage(chatTarget.id, chatTarget.nickname, chatTarget.avatarLetter, msgText, type || "text");
    if (!text) input.value = "";
    renderChat();
    document.getElementById("quickReplyPanel").classList.remove("open");
    document.getElementById("msgEmojiPanel").classList.remove("open");
    // 自动回复
    if (autoReplyEnabled && autoReplyText) {
      setTimeout(() => {
        Store.sendMessage(chatTarget.id, chatTarget.nickname, chatTarget.avatarLetter, "[自动回复] " + autoReplyText, "text");
        renderChat();
      }, 800);
    }
  }

  /** 渲染聊天气泡 */
  function renderChat() {
    if (!chatTarget) return;
    const thread = Store.getThread(chatTarget.id);
    const msgs = thread ? thread.messages : [];
    const listEl = document.getElementById("msgList");
    const myId = Store.currentUser.id;

    if (msgs.length === 0) {
      listEl.innerHTML = `<div class="msg-empty">发送第一条消息吧 👋</div>`;
    } else {
      listEl.innerHTML = msgs.map(m => {
        const isMine = m.from === myId;
        const bubbleClass = isMine ? "bubble-mine" : "bubble-theirs";
        const avatarText = isMine
          ? Render.escapeHtml(Store.currentUser.avatarLetter || "我")
          : Render.escapeHtml(chatTarget.avatarLetter || "匿");
        const timeStr = Render.formatTime(m.timestamp);
        return `
          <div class="msg-row ${isMine ? "msg-row-mine" : "msg-row-theirs"}">
            ${!isMine ? `<div class="msg-avatar">${avatarText}</div>` : ""}
            <div class="msg-bubble-wrap">
              <div class="msg-bubble ${bubbleClass}">${Render.escapeHtml(m.text)}</div>
              <div class="msg-time">${timeStr}</div>
            </div>
            ${isMine ? `<div class="msg-avatar">${avatarText}</div>` : ""}
          </div>`;
      }).join("");
    }

    // 滚动到底部
    listEl.scrollTop = listEl.scrollHeight;
  }

  /** 渲染快捷回复面板 */
  function renderQuickReplies() {
    const panel = document.getElementById("quickReplyPanel");
    const allReplies = [...QUICK_REPLIES, ...customReplies];
    panel.innerHTML = `
      <div class="quick-reply-title">快捷回复</div>
      <div class="quick-reply-list">
        ${allReplies.map(r => `<button class="quick-reply-item">${Render.escapeHtml(r)}</button>`).join("")}
      </div>
      <div class="quick-reply-add">
        <input type="text" id="customReplyInput" placeholder="添加自定义快捷回复…" maxlength="20">
        <button class="btn btn-sm" id="addCustomReplyBtn">添加</button>
      </div>
      <div class="auto-reply-bar">
        <span class="auto-reply-label">自动回复</span>
        <label class="toggle-switch">
          <input type="checkbox" id="autoReplyToggle" ${autoReplyEnabled ? "checked" : ""}>
          <span class="toggle-slider"></span>
        </label>
        <input class="auto-reply-input" id="autoReplyInput" type="text" value="${Render.escapeHtml(autoReplyText)}" placeholder="自动回复内容…" maxlength="40">
      </div>
    `;
    document.getElementById("addCustomReplyBtn").addEventListener("click", () => {
      const input = document.getElementById("customReplyInput");
      const text = input.value.trim();
      if (!text) return;
      customReplies.push(text);
      localStorage.setItem("th_custom_replies", JSON.stringify(customReplies));
      input.value = "";
      renderQuickReplies();
    });
    panel.querySelectorAll(".quick-reply-item").forEach(btn => {
      btn.addEventListener("click", () => sendMsg(btn.textContent, "text"));
    });
    document.getElementById("autoReplyToggle").addEventListener("change", e => {
      autoReplyEnabled = e.target.checked;
      localStorage.setItem("th_auto_reply", JSON.stringify({ enabled: autoReplyEnabled, text: autoReplyText }));
    });
    document.getElementById("autoReplyInput").addEventListener("input", e => {
      autoReplyText = e.target.value;
      localStorage.setItem("th_auto_reply", JSON.stringify({ enabled: autoReplyEnabled, text: autoReplyText }));
    });
  }

  /** 渲染表情包面板 */
  function renderEmojiPanel() {
    const panel = document.getElementById("msgEmojiPanel");
    panel.innerHTML = `
      <div class="quick-reply-title">表情包</div>
      <div class="emoji-sticker-grid">
        ${EMOJI_STICKERS.map(e => `<span class="emoji-sticker">${e}</span>`).join("")}
      </div>
    `;
    panel.querySelectorAll(".emoji-sticker").forEach(s => {
      s.addEventListener("click", () => sendMsg(s.textContent, "emoji"));
    });
  }

  return { init, openChat, renderChat };
})();
