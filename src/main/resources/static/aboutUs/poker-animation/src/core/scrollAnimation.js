import { gsapWithCSS } from "../../node_modules/gsap/index.js";
import { ScrollTrigger } from "../../node_modules/gsap/ScrollTrigger.js";

gsapWithCSS.registerPlugin(ScrollTrigger);

export class ScrollAnimation {
    constructor(options = {}) {
        this.cardDeck = null;
        this.currentState = 0;
        this.options = {
            trigger: ".poker-section", // 触发器改为卡牌专用的 section
            start: "top top",
            end: "bottom bottom",
            ...options
        };
    }

    init(cardDeck) {
        this.cardDeck = cardDeck;

        ScrollTrigger.create({
            trigger: this.options.trigger,
            start: this.options.start,
            end: this.options.end,
            onUpdate: (self) => {
                const p = self.progress;

                // 背景渐变：从深蓝到纯蓝
                if (p > 0.1 && p < 0.9) {
                    const bgProg = (p - 0.1) / 0.8;
                    document.body.style.backgroundColor = `rgb(0, ${Math.floor(15 * (1 - bgProg))}, ${Math.floor(51 + (204 * bgProg))})`;
                }

                // 1. 展开螺旋阶段 (0% - 20%)
                if (p <= 0.2) {
                    const expandProg = p / 0.2;
                    this.cardDeck.setShuffleSpiralProgress(expandProg);
                    this.cardDeck.isIdleAnimationEnabled = false;
                } 
                // 2. 回收至正下方 (20% - 40%)
                else if (p > 0.2 && p <= 0.4) {
                    const collectProg = (p - 0.2) / 0.2;
                    this.cardDeck.collectSpiral(collectProg);
                    this.cardDeck.isIdleAnimationEnabled = false;
                }
                // 3. 正下方展开为扇形 (40% - 60%)
                else if (p > 0.4 && p <= 0.6) {
                    const fanProg = (p - 0.4) / 0.2;
                    this.cardDeck.expandFanFromBottom(fanProg, 0);
                    this.cardDeck.isIdleAnimationEnabled = false;
                }
                // 4. 扇形放大 (60% - 70%)
                else if (p > 0.6 && p <= 0.7) {
                    const zoomProg = (p - 0.6) / 0.1;
                    this.cardDeck.expandFanFromBottom(1.0, zoomProg);
                    this.cardDeck.isIdleAnimationEnabled = false;
                }
                // 5. 扇形中央史诗抽出 (70% - 85%)
                else if (p > 0.7 && p <= 0.85) {
                    const drawProg = (p - 0.7) / 0.15;
                    this.cardDeck.drawMainCards(drawProg);
                    this.cardDeck.isIdleAnimationEnabled = false;
                }
                // 6. 翻转与终极展示 (85% - 100%)
                else if (p > 0.85) {
                    this.cardDeck.isIdleAnimationEnabled = true;
                    if (this.currentState !== 2) {
                        this.currentState = 2;
                        this.cardDeck.flipMainCards();
                        this.cardDeck.finalZoomIn();
                    }
                }

                // 重置状态
                if (p < 0.82 && this.currentState === 2) {
                    this.currentState = 1;
                }
                if (p < 0.75 && this.currentState === 1) {
                    this.currentState = 0;
                }
            }
        });
    }

    triggerFanSequence() {
        if (this.isAnimating || this.currentState === 2) return;
        
        this.isAnimating = true;
        this.currentState = 2; 

        const tl = gsapWithCSS.timeline({ 
            onComplete: () => {
                this.isAnimating = false; // 只有这里播完，上面的 scroll 锁定才会解除
            } 
        });

        const state = { move: 0, spread: 0 };

        // 1. 移动到角落[cite: 8]
        tl.to(state, {
            move: 1,
            duration: 0.8,
            onUpdate: () => this.cardDeck.moveToCorner(state.move)
        })
        // 2. 预备发牌[cite: 8]
        .add(() => {
            this.cardDeck.dealToSmallDeck();
        }, "+=0.1")
        // 3. 扇形展开[cite: 8]
        .to(state, {
            spread: 1,
            duration: 1.2,
            delay: 0.8,
            ease: "back.out(1.2)",
            onUpdate: () => this.cardDeck.fanSpread(state.spread)
        })
        // 4. 发三张并淡出[cite: 8]
        .add(() => {
            const issuedCards = this.cardDeck.dealThreeCards();
            gsapWithCSS.delayedCall(0.4, () => {
                this.cardDeck.fadeOutDeck(issuedCards);
            });
        }, "+=0.3");
    }
}