import { __toESM } from "../_virtual/_rolldown/runtime.js";
/* empty css            */
import { AmbientLight,Clock, Color, DirectionalLight, PerspectiveCamera, Scene, Vector2 } from "three";
import { WebGLRenderer } from "../node_modules/three/build/three.module.js";
import { require_matter } from "../node_modules/matter-js/build/matter.js";
import { gsapWithCSS } from "../node_modules/gsap/index.js";
import { generateFullDeck } from "./config/cardConfig.js";
import { getPerformanceConfig } from "./utils/performance.js";
import { CardDeck } from "./core/cardDeck.js";
import { ScrollAnimation } from "./core/scrollAnimation.js";

// 导入后处理模块（用于 UnrealBloom 光晕效果）
import { EffectComposer } from "https://unpkg.com/three@0.160.0/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "https://unpkg.com/three@0.160.0/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "https://unpkg.com/three@0.160.0/examples/jsm/postprocessing/UnrealBloomPass.js";

//#region src/main.js
var import_matter = /* @__PURE__ */ __toESM(require_matter(), 1);
async function startAnimation() {
	const perf = getPerformanceConfig();
	const deckData = generateFullDeck();
	const scene = new Scene();
	scene.background = new Color('#000F33');
	const camera = new PerspectiveCamera(45, window.innerWidth / window.innerHeight, .1, 1e3);
	camera.position.set(0, 15, .1);
	camera.lookAt(0, 0, 0);
	const renderer = new WebGLRenderer({ antialias: perf.antialias });
	renderer.setSize(window.innerWidth, window.innerHeight);
	renderer.setPixelRatio(window.devicePixelRatio);
	document.getElementById("canvas-container").appendChild(renderer.domElement);
	const ambientLight = new AmbientLight(16777215, 1);
	scene.add(ambientLight);
	const topLight = new DirectionalLight(16777215, .5);
	topLight.position.set(0, 20, 0);
	scene.add(topLight);
	const engine = import_matter.default.Engine.create();
// 初始化卡牌逻辑
	const cardDeck = new CardDeck(scene, camera, engine);
	
	// 预加载团队成员头像
	await cardDeck.preloadTeamAvatars();
	
	cardDeck.initCards(deckData);
    
    // 设置后处理管线（UnrealBloom 光晕效果）
    const composer = new EffectComposer(renderer);
    
    // 基础渲染通道
    const renderPass = new RenderPass(scene, camera);
    composer.addPass(renderPass);
    
    // UnrealBloomPass 光晕效果
    const bloomPass = new UnrealBloomPass(
        new Vector2(window.innerWidth, window.innerHeight),
        0.0,     // strength（初始为0，由 cardDeck 动态控制）
        0.4,     // radius
        0.85     // threshold
    );
    composer.addPass(bloomPass);
    
    // 将 bloomPass 引用传递给 cardDeck 以便动态控制
    cardDeck.setBloomPass(bloomPass);
    
    // 全量切换至 CSS Scroll-Driven Animation (SDA) 驱动，移除旧的 ScrollAnimation 类初始化
	// new ScrollAnimation().init(cardDeck);

	// 获取 CSS 变量驱动的进度
	const proxy = document.getElementById('poker-proxy');
	
	const clock = new Clock();
	function animate() {
		requestAnimationFrame(animate);
		import_matter.default.Engine.update(engine, 16);
		
		// 读取 CSS 变量并同步到滚动逻辑
		const progress = parseFloat(getComputedStyle(proxy).getPropertyValue('--poker-progress')) || 0;
		cardDeck.updateFromCSSProgress(progress);

		// 更新卡牌律动动画
		const dt = clock.getDelta();
		cardDeck.updateIdleAnimation(dt);
		
		composer.render(); // 使用后处理管线渲染（包含 bloom 效果）
	}
	animate();
	window.addEventListener("resize", () => {
		camera.aspect = window.innerWidth / window.innerHeight;
		camera.updateProjectionMatrix();
		renderer.setSize(window.innerWidth, window.innerHeight);
		composer.setSize(window.innerWidth, window.innerHeight); // 同步更新后处理管线
	});

    // 原始测试按钮逻辑已保留但建议仅用于本地调试[cite: 6]
	const btnSpiral = document.getElementById("btnSpiral");
	const btnReset = document.getElementById("btnReset");
	if (btnSpiral) btnSpiral.onclick = () => {
		gsapWithCSS.to(animState, {
			progress: 1,
			duration: 2.5,
			ease: "power2.inOut",
			onUpdate: () => {
				cardDeck.setShuffleSpiralProgress(animState.progress);
			}
		});
	};
	if (btnReset) btnReset.onclick = () => {
		gsapWithCSS.to(animState, {
			progress: 0,
			duration: 2,
			ease: "expo.inOut",
			onUpdate: () => {
				cardDeck.setShuffleSpiralProgress(animState.progress);
			},
			onComplete: () => {
				window.scrollTo({
					top: 0,
					behavior: "auto"
				});
			}
		});
	};
	const btnFan = document.getElementById("btnFan");
	const btnDeal = document.getElementById("btnDeal");
	if (btnFan) btnFan.onclick = () => {
		const tl = gsapWithCSS.timeline();
		const state = {
			move: 0,
			spread: 0
		};
		tl.to(state, {
			move: 1,
			duration: .8,
			onUpdate: () => cardDeck.moveToCorner(state.move)
		}).add(() => {
			cardDeck.dealToSmallDeck();
		}, "+=0.1").to(state, {
			spread: 1,
			duration: 1.2,
			delay: .8,
			ease: "back.out(1.2)",
			onUpdate: () => cardDeck.fanSpread(state.spread)
		}).add(() => {
			const issuedCards = cardDeck.dealThreeCards();
			gsapWithCSS.delayedCall(.4, () => {
				cardDeck.fadeOutDeck(issuedCards);
			});
		}, "+=0.3");
	};
	if (btnDeal) btnDeal.onclick = () => cardDeck.dealThreeCards();
}
startAnimation().catch((err) => console.error("初始化失败:", err)).then((e) => {console.log("success")});
//#endregion