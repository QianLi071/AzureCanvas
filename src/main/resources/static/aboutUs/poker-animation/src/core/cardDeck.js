import { __toESM } from "../../_virtual/_rolldown/runtime.js";
import { BoxGeometry, MathUtils, Mesh, MeshStandardMaterial, Vector3, TextureLoader } from "three";
import { require_matter } from "../../node_modules/matter-js/build/matter.js";
import { gsapWithCSS } from "../../node_modules/gsap/index.js";
import { CARD_APPEARANCE } from "../config/cardConfig.js";
import { getPerformanceConfig } from "../utils/performance.js";
import { createCardTexture } from "./cardGenerator.js";

var import_matter = /* @__PURE__ */ __toESM(require_matter(), 1);
var perf = getPerformanceConfig();

var CardDeck = class {
    constructor(scene, camera, engine, options = {}) {
        this.scene = scene;
        this.camera = camera;
        this.engine = engine;
        this.world = engine.world;
        this.options = {
            width: CARD_APPEARANCE.width * 1.5, // 整体放大 1.5 倍
            height: CARD_APPEARANCE.height * 1.5,
            depth: CARD_APPEARANCE.depth * 1.5,
            stackSpacing: CARD_APPEARANCE.stackSpacing,
            textureQuality: perf.textureQuality,
            ...options
        };
        this.cardsMesh = [];
        this.cardsBodies = [];
        
        // --- 核心参数：恢复第一版螺旋速度 ---
        this.spiralTurns = 3.5; 
        this.spiralSpacing = 1.2;
        
        this.isLocked = false; // 播放完禁止回滚的标识位
        this.stackBaseY = 0;

        // 记录四张主角牌
        this.mainCards = [];
        this.idleTime = 0;
        this.isIdleAnimationEnabled = false;
    }

    /**
     * 螺旋位置计算
     */
    getPointOnSpiral(t) {
        const angle = t * Math.PI * 2 * this.spiralTurns;
        const radius = t * (this.spiralTurns * this.spiralSpacing);
        return { x: Math.cos(angle) * radius, z: Math.sin(angle) * radius, angle };
    }

    /**
     * 更新螺旋进度 (支持平滑展开)
     */
    setShuffleSpiralProgress(p) {
        if (this.isLocked) return;
        const total = this.cardsMesh.length;
        if (total === 0) return;
        
        // 缓入缓出
        const easedP = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;

        this.cardsMesh.forEach(card => card.visible = true);
        
        for (let i = 0; i < total; i++) {
            const mesh = this.cardsMesh[i];
            const targetT = (total - 1 - i) / (total - 1);
            const currentT = Math.min(targetT, easedP);
            const pos = this.getPointOnSpiral(currentT);
            const y = (easedP < targetT) ? i * 0.05 : i * 0.001;
            mesh.position.set(pos.x, y, pos.z);
            mesh.rotation.set(Math.PI / 2, 0, -pos.angle);
        }
    }

    /**
     * 排队回收螺旋至正下方 (最多 5 张牌同时移动，直线轨迹)
     */
    collectSpiral(p) {
        if (this.isLocked) return;
        const total = this.cardsMesh.length;
        if (total === 0) return;

        const bottomZ = 6;
        const targetPos = { x: 0, z: bottomZ };
        
        // 限制并行数量为 5
        // 我们需要重新定义每个卡牌在 p [0, 1] 轴上的活跃区间
        const activeCount = 5;
        const windowSize = activeCount / total; // 每个窗口在 p 轴上的占比
        
        for (let i = 0; i < total; i++) {
            const mesh = this.cardsMesh[i];
            const targetT = (total - 1 - i) / (total - 1);
            
            // 计算该卡牌开始动作的 p 值
            // 我们希望 i=0 (最外圈) 先动。
            const startP = (i / total) * (1.0 - windowSize);
            const endP = startP + windowSize;
            
            let cardProg = 0;
            if (p > startP) {
                cardProg = Math.max(0, Math.min(1, (p - startP) / windowSize));
                // 使用缓入缓出函数
                cardProg = cardProg < 0.5 ? 2 * cardProg * cardProg : 1 - Math.pow(-2 * cardProg + 2, 2) / 2;
            }
            
            const spiralPos = this.getPointOnSpiral(targetT);
            
            mesh.position.x = MathUtils.lerp(spiralPos.x, targetPos.x, cardProg);
            mesh.position.z = MathUtils.lerp(spiralPos.z, targetPos.z, cardProg);
            mesh.position.y = MathUtils.lerp(i * 0.001, i * 0.02, cardProg);
            mesh.rotation.z = MathUtils.lerp(-spiralPos.angle, 0, cardProg);
        }
    }

    /**
     * 视图正下方单张展开为扇形
     */
    expandFanFromBottom(progress) {
        const bottomZ = 6;
        const radius = 8;
        const arcAngle = Math.PI * 0.3;
        const startAngle = -arcAngle / 2;
        const total = this.cardsMesh.length;
        const scale = 1.5;

        // 缓入缓出
        const easedP = progress < 0.5 ? 2 * progress * progress : 1 - Math.pow(-2 * progress + 2, 2) / 2;

        this.cardsMesh.forEach((mesh, i) => {
            const angle = (startAngle + (i / (total - 1)) * arcAngle) * easedP;
            const x = Math.sin(angle) * radius;
            const z = bottomZ - (Math.cos(angle) * radius) + radius; 
            
            mesh.position.set(x, i * 0.01, z);
            mesh.rotation.set(Math.PI / 2, 0, angle);
            mesh.scale.set(scale, scale, scale);
        });
    }

    /**
     * 初始化牌堆
     */
    initCards(cardsData) {
        this.sharedGeometry = new BoxGeometry(this.options.width, this.options.height, this.options.depth);
        const loader = new TextureLoader();
        const cardBackTex = loader.load('card.png'); // 使用 card.png 作为背面
        const cardFrontTex = createCardTexture({ isCustom: true, customText: "INFO" }, this.options.textureQuality);

        cardsData.forEach((data, index) => {
            const materials = [
                new MeshStandardMaterial({ color: 0xffffff }), 
                new MeshStandardMaterial({ color: 0xffffff }),
                new MeshStandardMaterial({ color: 0xffffff }),
                new MeshStandardMaterial({ color: 0xffffff }),
                new MeshStandardMaterial({ map: cardFrontTex, transparent: true }), 
                new MeshStandardMaterial({ map: cardBackTex, transparent: true })  
            ];

            const mesh = new Mesh(this.sharedGeometry, materials);
            mesh.rotation.set(-Math.PI / 2, 0, 0);
            this.scene.add(mesh);
            this.cardsMesh.push(mesh);
            
            const body = import_matter.default.Bodies.rectangle(0, 0, this.options.width, this.options.height, { isStatic: true });
            this.cardsBodies.push(body);
        });

        // 取最后五张作为主角牌（保证对称）
        this.mainCards = this.cardsMesh.slice(-5);
        import_matter.default.World.add(this.world, this.cardsBodies);
    }

    /**
     * 初始状态：四张牌重叠在中心
     */
    prepareMainCards() {
        this.mainCards.forEach((card, idx) => {
            card.position.set(0, idx * 0.05, 0);
            card.rotation.set(Math.PI / 2, 0, 0); // 背面朝上
            card.visible = true;
        });
        // 隐藏其他干扰牌
        this.cardsMesh.forEach(card => {
            if (!this.mainCards.includes(card)) card.visible = false;
        });
    }

    /**
     * 扇形散开动画
     */
    spreadMainCards(progress) {
        const radius = 6;
        const total = this.mainCards.length;
        const startAngle = -Math.PI * 0.15;
        const endAngle = Math.PI * 0.15;

        this.mainCards.forEach((card, i) => {
            const angle = MathUtils.lerp(0, startAngle + (i / (total - 1)) * (endAngle - startAngle), progress);
            const x = Math.sin(angle) * radius * progress;
            const z = (1.0 - Math.cos(angle)) * radius * progress;
            
            card.position.x = x;
            card.position.z = z;
            card.rotation.z = angle;
        });
    }

    /**
     * 左右翻转动画 (Y轴翻转)
     */
    flipMainCards() {
        this.mainCards.forEach((card, idx) => {
            gsapWithCSS.to(card.rotation, {
                y: Math.PI, // 左右翻转 180 度
                duration: 1.2,
                delay: idx * 0.15,
                ease: "power2.inOut"
            });
        });
    }

    /**
     * 5 张牌整体抽出至中心后，再缓慢散开 (仿图 1 -> 图 2 模式)
     */
    drawMainCards(progress) {
        const bottomZ = 6;
        const finalY = 2;
        const finalZ = -2;
        const baseScale = 1.5;

        // 缓入缓出
        const easeInOutCubic = (t) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
        const easedP = easeInOutCubic(progress);

        this.mainCards.forEach((card, idx) => {
            // 对称布局：idx 0,1,2,3,4 映射到 -2, -1, 0, 1, 2
            const offsetIdx = idx - 2;
            
            // 图 2 模式的散开参数
            const spreadX = offsetIdx * 3.5; // X 轴拉开距离
            const spreadZ = -Math.abs(offsetIdx) * 0.8; // 两侧牌向后偏移，形成弧度
            const spreadRotZ = offsetIdx * 0.15; // 两侧牌产生微小倾斜

            let targetX, targetY, targetZ, targetRotZ;

            // 阶段一：0.0 - 0.4 整体叠在一起抽出到屏幕中央 (对应图 1)
            if (easedP <= 0.4) {
                const subProg = easedP / 0.4;
                targetX = 0;
                targetY = MathUtils.lerp(0.5, finalY, subProg);
                targetZ = MathUtils.lerp(bottomZ, finalZ, subProg);
                targetRotZ = 0;
            } 
            // 阶段二：0.4 - 1.0 在中央缓慢散开至图 2 模式
            else {
                const subProg = (easedP - 0.4) / 0.6;
                targetX = MathUtils.lerp(0, spreadX, subProg);
                targetY = finalY;
                targetZ = MathUtils.lerp(finalZ, finalZ + spreadZ, subProg);
                targetRotZ = MathUtils.lerp(0, spreadRotZ, subProg);
            }
            
            card.position.set(targetX, targetY, targetZ);
            card.scale.set(baseScale, baseScale, baseScale);
            card.rotation.set(Math.PI / 2, 0, targetRotZ); 
        });
    }

    /**
     * 由 CSS Scroll-Driven Animation 驱动的整体更新逻辑
     */
    updateFromCSSProgress(p) {
        if (this.isLocked) return;

        // 阶段 1: 展开螺旋 (0% - 20%)
        if (p <= 0.2) {
            this.setShuffleSpiralProgress(p / 0.2);
            this.isIdleAnimationEnabled = false;
        } 
        // 阶段 2: 排队收回至底堆 (20% - 45%) - 增加时长以体现排队感
        else if (p > 0.2 && p <= 0.45) {
            this.collectSpiral((p - 0.2) / 0.25);
            this.isIdleAnimationEnabled = false;
        }
        // 阶段 3: 底堆展开为扇形 (45% - 65%)
        else if (p > 0.45 && p <= 0.65) {
            this.expandFanFromBottom((p - 0.45) / 0.2);
            this.isIdleAnimationEnabled = false;
        }
        // 阶段 4: 5张牌整体抽出至中心后慢慢散开 (65% - 85%)
        else if (p > 0.65 && p <= 0.85) {
            this.drawMainCards((p - 0.65) / 0.2);
            this.isIdleAnimationEnabled = false;
        }
        // 阶段 5: 左右翻转与展示 (85% - 100%)
        else if (p > 0.85) {
            this.isIdleAnimationEnabled = true;
            this.mainCards.forEach((card, idx) => {
                const flipProg = Math.max(0, Math.min(1, (p - 0.85 - idx * 0.02) / 0.1));
                card.rotation.y = flipProg * Math.PI;
            });
            
            const zoomProg = (p - 0.85) / 0.15;
            const finalScale = 1.5 * (1.0 + zoomProg * 0.2); 
            this.mainCards.forEach(card => card.scale.set(finalScale, finalScale, finalScale));
        }
    }

    /**
     * 律动起伏动画：仅上下，幅度减小，无旋转
     */
    updateIdleAnimation(dt) {
        if (!this.isIdleAnimationEnabled) return;
        this.idleTime += dt;
        this.mainCards.forEach((card, i) => {
            // 幅度减小到 0.03，仅修改 y 坐标
            const wave = Math.sin(this.idleTime * 1.5 + i * 0.8) * 0.03;
            card.position.y = (i * 0.05) + wave; 
            // 移除旋转扰动
        });
    }

    /**
     * 移动到角落并彻底翻面
     */
    moveToCorner(progress) {
        if (this.isLocked) return;
        const cornerX = -8;
        const cornerZ = 4;
        this.cardsMesh.forEach((mesh, i) => {
            const lagAmount = i * 0.005;
            const dynamicProgress = Math.max(0, Math.min(1, progress - lagAmount));
            const targetPos = new Vector3(cornerX, i * 0.015, cornerZ);
            
            mesh.position.lerpVectors(mesh.position.clone(), targetPos, dynamicProgress);
            // 翻转：从正面(-PI/2)到背面(PI/2)[cite: 2]
            mesh.rotation.x = MathUtils.lerp(mesh.rotation.x, Math.PI / 2, dynamicProgress);
            mesh.rotation.z = MathUtils.lerp(mesh.rotation.z, 0, dynamicProgress);
        });
    }

    /**
     * 发牌到小堆：确保位置对齐扇形顶点
     */
    dealToSmallDeck() {
        const hearts = this.cardsMesh.slice(0, 13);
        const syncZ = 2.0; // 对应 fanSpread(0) 的坐标点
        hearts.forEach((card, idx) => {
            gsapWithCSS.to(card.position, {
                x: 0, y: idx * 0.02, z: syncZ,
                duration: 0.4, delay: idx * 0.05, ease: "power2.out"
            });
            gsapWithCSS.to(card.rotation, { x: Math.PI / 2, z: 0, duration: 0.4, delay: idx * 0.05 });
        });
    }

    /**
     * 扇形展开：公式重构
     * 圆心在前 (Z=10)，公式：Z = Center - R * cos(theta)
     */
    fanSpread(progress = 1) {
        if (this.isLocked) return;
        const totalHearts = 13;
        const hearts = this.cardsMesh.slice(0, totalHearts);
        const radius = 8;
        const arcAngle = Math.PI * 0.4;
        const startAngle = -arcAngle / 2;
        
        // 圆心设在卡牌前方（靠近相机）
        const centerZBase = 10; 

        hearts.forEach((mesh, i) => {
            const angle = (startAngle + (i / (totalHearts - 1)) * arcAngle) * progress;
            const x = Math.sin(angle) * radius;
            // 凸起计算：因为圆心在前，减去cos偏移让中间向后缩，边缘向后缩得更多，
            // 最终在背面朝上的视角下形成向玩家凸出的弧线[cite: 2]
            const z = centerZBase - (Math.cos(angle) * radius);
            
            mesh.position.set(x, i * 0.02, z);
            // 修正旋转角方向
            mesh.rotation.set(Math.PI / 2, 0, angle); 
        });
    }

    /**
     * 发出三张主角牌：锁定并禁止回滚
     */
    dealThreeCards() {
        this.isLocked = true; // 锁定状态，禁止上滑回滚[cite: 2]
        const topThree = this.cardsMesh.slice(0, 13).slice(-3).reverse();
        const customTexts = ["CONTENT 1", "CONTENT 2", "CONTENT 3"];

        topThree.forEach((card, idx) => {
            // 动态更换牌面纹理
            const newFront = createCardTexture({ isCustom: true, customText: customTexts[idx] }, this.options.textureQuality);
            card.material[4].map = newFront;
            card.material[4].needsUpdate = true;

            const tl = gsapWithCSS.timeline({ delay: idx * 0.3 });
            tl.to(card.position, {
                x: (idx - 1) * 3.5, y: 1.5, z: -1,
                duration: 1, ease: "expo.inOut"
            })
            .to(card.scale, { x: 2.5, y: 2.5, z: 2.5, duration: 1 }, "<")
            .to(card.rotation, {
                x: -Math.PI / 2, // 翻转回正面朝上[cite: 2]
                y: 0,
                z: Math.PI * 2,
                duration: 1.2,
                ease: "back.out(1.2)"
            }, "<");
        });
        return topThree;
    }

    /**
     * 背景卡牌淡出逻辑
     */
    fadeOutDeck(excludeCards = []) {
        this.cardsMesh.forEach((mesh) => {
            if (!excludeCards.includes(mesh)) {
                mesh.material.forEach(mat => {
                    gsapWithCSS.to(mat, {
                        opacity: 0,
                        duration: 0.8,
                        onComplete: () => { mesh.visible = false; }
                    });
                });
            }
        });
    }
};

export { CardDeck };