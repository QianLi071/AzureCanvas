import { CanvasTexture, TextureLoader } from "three";
import { CARD_APPEARANCE } from "../config/cardConfig.js";

function createCardTexture(cardData, quality = 8, isBack = false) {
	const { width, height } = CARD_APPEARANCE;
	const canvas = document.createElement("canvas");
	const ctx = canvas.getContext("2d");
	const scale = 256 * quality;
	canvas.width = width * scale;
	canvas.height = height * scale;

    console.log(`🎴 createCardTexture 调用:`, {
        isBack,
        isTeamMember: cardData.isTeamMember,
        isCustom: cardData.isCustom,
        customText: cardData.customText,
        nickname: cardData.nickname
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
        ctx.fillText("♠︎ ♥︎ ♣︎ ♦︎", canvas.width / 2, canvas.height / 2);
    } else if (cardData.isTeamMember) {
        return createTeamMemberTexture(cardData, quality);
    } else if (cardData.isCustom) {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "#333";
        ctx.font = `bold ${40 * quality}px "Inter"`;
        ctx.textAlign = "center";
        ctx.fillText(cardData.customText || "NEW INFO", canvas.width / 2, canvas.height / 2);
    } else {
        ctx.fillStyle = cardData.isJoker ? cardData.subType === "big" ? "#2a0a0a" : "#2a1a0a" : "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.strokeStyle = cardData.isJoker ? cardData.subType === "big" ? "#ef4444" : "#f59e0b" : cardData.color === "#cc0000" ? "#cc0000" : "#333333";
        ctx.lineWidth = 8 * quality;
        ctx.strokeRect(6 * quality, 6 * quality, canvas.width - 12 * quality, canvas.height - 12 * quality);
        ctx.fillStyle = cardData.isJoker ? cardData.subType === "big" ? "#ef4444" : "#f59e0b" : cardData.color;
        ctx.font = `bold ${cardData.isJoker ? 50 * quality : cardData.rank === "10" ? 55 * quality : 65 * quality}px "Inter", "Segoe UI", system-ui, sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        let displayText = cardData.isJoker ? cardData.displayText : cardData.text;
        ctx.fillText(displayText, canvas.width / 2, canvas.height / 2);
        if (!cardData.isJoker) {
            ctx.font = `${28 * quality}px monospace`;
            ctx.fillStyle = cardData.color;
            ctx.fillText(cardData.suit + cardData.rank, 30 * quality, 45 * quality);
        }
    }

	const texture = new CanvasTexture(canvas);
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

    // 只做 Y 轴翻转（修正文字上下颠倒），不做 X 轴镜像
    // 这样头像仍在上方，名字在下方，但文字方向正确
    ctx.translate(0, canvas.height);
    ctx.scale(1, -1);

    const padding = 20 * quality;
    
    // 渐变背景
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, '#1a1a2e');
    gradient.addColorStop(1, '#16213e');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 边框
    ctx.strokeStyle = 'rgba(100, 200, 255, 0.5)';
    ctx.lineWidth = 3 * quality;
    ctx.strokeRect(padding, padding, canvas.width - padding * 2, canvas.height - padding * 2);

    // 头像区域（圆形裁剪）- 翻转后坐标系：Y=0在底部，Y=height在顶部
    // 所以要把内容放在较大的Y值处，才能显示在视觉上方
    const avatarSize = 80 * quality;
    const avatarX = (canvas.width - avatarSize) / 2;
    const avatarY = canvas.height - 115 * quality; // 靠近顶部（翻转后的"上方"）
    
    ctx.save();
    ctx.beginPath();
    ctx.arc(canvas.width / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
    ctx.closePath();
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

    // 昵称 - 在头像下方（翻转坐标系中，下方=Y值更小）
    ctx.fillStyle = '#ffffff';
    ctx.font = `bold ${24 * quality}px "Inter", sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText(memberData.nickname || 'Team Member', canvas.width / 2, avatarY - 20 * quality);

    // 哲学文字 - 在昵称下方
    ctx.fillStyle = 'rgba(200, 220, 255, 0.9)';
    ctx.font = `${14 * quality}px "Inter", sans-serif`;
    ctx.textAlign = 'center';
    
    const philosophy = memberData.philosophy || '';
    const maxWidth = canvas.width - padding * 3;
    wrapText(ctx, philosophy, canvas.width / 2, avatarY - 50 * quality, maxWidth, 18 * quality);

    const texture = new CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
}

function drawDefaultAvatar(ctx, x, y, radius, quality, initial) {
    // 默认圆形头像背景
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
    gradient.addColorStop(0, '#667eea');
    gradient.addColorStop(1, '#764ba2');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();

    // 首字母
    ctx.fillStyle = '#ffffff';
    ctx.font = `bold ${radius}px "Inter", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(initial.charAt(0).toUpperCase(), x, y);
}

function wrapText(context, text, x, y, maxWidth, lineHeight) {
    if (!text) return;
    
    const words = text.split('');
    let line = '';
    let testLine = '';
    let lineCount = 0;
    const maxLines = 3;

    for (let n = 0; n < words.length; n++) {
        testLine = line + words[n];
        const metrics = context.measureText(testLine);
        const testWidth = metrics.width;

        if (testWidth > maxWidth && n > 0) {
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