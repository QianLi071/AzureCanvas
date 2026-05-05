import { CanvasTexture, TextureLoader } from "three";
import { CARD_APPEARANCE } from "../config/cardConfig.js";

function createCardTexture(cardData, quality = 8, isBack = false) {
    const { width, height } = CARD_APPEARANCE;
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const scale = 256 * quality;
    canvas.width = width * scale;
    canvas.height = height * scale;

    // 统一重置坐标系
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    
    // --- 核心修改：实现左右反转 ---
    // 将原点移到右侧，然后将 X 轴缩放设为 -1
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    // ---------------------------

    console.log(`🎴 createCardTexture 调用:`, {
        isBack,
        isTeamMember: cardData.isTeamMember
    });

    if (isBack) {
        ctx.fillStyle = "#2c3e50";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.strokeStyle = "#ecf0f1";
        ctx.lineWidth = 10 * quality;
        ctx.strokeRect(10 * quality, 10 * quality, canvas.width - 20 * quality, canvas.height - 20 * quality);
        ctx.fillStyle = "#34495e";
        ctx.font = `${40 * quality}px serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("♠︎ ♥︎ ♣︎ ♦︎", canvas.width / 2, canvas.height / 2);
    } else if (cardData.isTeamMember) {
        // 主角牌逻辑在下面单独处理，但也会继承这里的镜像
        return createTeamMemberTexture(cardData, quality);
    } else if (cardData.isCustom) {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "#333";
        ctx.font = `bold ${40 * quality}px "Inter"`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(cardData.customText || "NEW INFO", canvas.width / 2, canvas.height / 2);
    } else {
        // 普通牌绘制逻辑
        ctx.fillStyle = cardData.isJoker ? (cardData.subType === "big" ? "#2a0a0a" : "#2a1a0a") : "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.strokeStyle = cardData.isJoker ? (cardData.subType === "big" ? "#ef4444" : "#f59e0b") : (cardData.color === "#cc0000" ? "#cc0000" : "#333333");
        ctx.lineWidth = 8 * quality;
        ctx.strokeRect(6 * quality, 6 * quality, canvas.width - 12 * quality, canvas.height - 12 * quality);
        
        ctx.fillStyle = cardData.isJoker ? (cardData.subType === "big" ? "#ef4444" : "#f59e0b") : cardData.color;
        ctx.font = `bold ${cardData.isJoker ? 50 * quality : (cardData.rank === "10" ? 55 * quality : 65 * quality)}px "Inter", sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        
        let displayText = cardData.isJoker ? cardData.displayText : cardData.text;
        ctx.fillText(displayText, canvas.width / 2, canvas.height / 2);
        
        if (!cardData.isJoker) {
            ctx.font = `${28 * quality}px monospace`;
            ctx.fillStyle = cardData.color;
            ctx.textAlign = "left";
            ctx.textBaseline = "top";
            // 这里的 30*quality 会因为上面的 scale(-1,1) 自动出现在视觉上的左侧
            ctx.fillText(cardData.suit + cardData.rank, 30 * quality, 30 * quality);
        }
    }

    const texture = new CanvasTexture(canvas);
    texture.flipY = false; 
    texture.needsUpdate = true;
    return texture;
}

function createTeamMemberTexture(memberData, quality = 3) {
    const { width, height } = CARD_APPEARANCE;
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const scale = 256 * quality;
    canvas.width = width * scale;
    canvas.height = height * scale;

    // --- 核心修改：实现左右反转 ---
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    // ---------------------------

    const padding = 20 * quality;
    
    // 背景渐变
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#1a1a2e');
    gradient.addColorStop(1, '#16213e');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 边框
    ctx.strokeStyle = 'rgba(100, 200, 255, 0.5)';
    ctx.lineWidth = 3 * quality;
    ctx.strokeRect(padding, padding, canvas.width - padding * 2, canvas.height - padding * 2);

    // 头像区域
    const avatarSize = 80 * quality;
    const avatarX = (canvas.width - avatarSize) / 2;
    const avatarY = 50 * quality;
    
    ctx.save();
    ctx.beginPath();
    ctx.arc(canvas.width / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
    ctx.clip();

    if (memberData.avatarImage || memberData.avatarUrl) {
        const img = memberData.avatarImage || new Image();
        if (!memberData.avatarImage) {
            img.crossOrigin = 'anonymous';
            img.src = memberData.avatarUrl;
        }
        try {
            if (img.complete && img.naturalWidth > 0) {
                ctx.drawImage(img, avatarX, avatarY, avatarSize, avatarSize);
            } else {
                drawDefaultAvatar(ctx, canvas.width / 2, avatarY + avatarSize / 2, avatarSize / 2, quality, memberData.nickname || '?');
            }
        } catch (e) {
            drawDefaultAvatar(ctx, canvas.width / 2, avatarY + avatarSize / 2, avatarSize / 2, quality, memberData.nickname || '?');
        }
    } else {
        drawDefaultAvatar(ctx, canvas.width / 2, avatarY + avatarSize / 2, avatarSize / 2, quality, memberData.nickname || '?');
    }
    ctx.restore();

    // 昵称
    ctx.fillStyle = '#ffffff';
    ctx.font = `bold ${24 * quality}px "Inter", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(memberData.nickname || 'Team Member', canvas.width / 2, avatarY + avatarSize + 20 * quality);

    // 哲学文字
    ctx.fillStyle = 'rgba(200, 220, 255, 0.9)';
    ctx.font = `${14 * quality}px "Inter", sans-serif`;
    ctx.textAlign = 'center';
    
    const philosophy = memberData.philosophy || '';
    const maxWidth = canvas.width - padding * 3;
    wrapText(ctx, philosophy, canvas.width / 2, avatarY + avatarSize + 65 * quality, maxWidth, 18 * quality);

    const texture = new CanvasTexture(canvas);
    texture.flipY = false; 
    texture.needsUpdate = true;
    return texture;
}

function drawDefaultAvatar(ctx, x, y, radius, quality, initial) {
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
    gradient.addColorStop(0, '#667eea');
    gradient.addColorStop(1, '#764ba2');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = `bold ${radius}px "Inter", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    // 注意：文字在镜像后的 Canvas 中会自动左右翻转回来，保持可读
    ctx.fillText(initial.charAt(0).toUpperCase(), x, y);
}

function wrapText(context, text, x, y, maxWidth, lineHeight) {
    if (!text) return;
    const words = text.split('');
    let line = '';
    let lineCount = 0;
    const maxLines = 3;

    for (let n = 0; n < words.length; n++) {
        let testLine = line + words[n];
        const metrics = context.measureText(testLine);
        if (metrics.width > maxWidth && n > 0) {
            context.fillText(line, x, y + lineCount * lineHeight);
            line = words[n];
            lineCount++;
            if (lineCount >= maxLines) {
                context.fillText('...', x, y + lineCount * lineHeight);
                return;
            }
        } else {
            line = testLine;
        }
    }
    context.fillText(line, x, y + lineCount * lineHeight);
}

export { createCardTexture };