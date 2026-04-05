// 立方体效果实现
let scene, camera, renderer, cube, sphere;
let isCubePage = false;

// 初始化立方体场景
function initCube() {
    // 创建场景
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1a1a);

    // 创建相机
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 5;

    // 创建渲染器
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);

    // 创建容器并添加到页面
    const cubeContainer = document.createElement('div');
    cubeContainer.id = 'cube-container';
    cubeContainer.style.position = 'fixed';
    cubeContainer.style.top = '0';
    cubeContainer.style.left = '0';
    cubeContainer.style.width = '100%';
    cubeContainer.style.height = '100%';
    cubeContainer.style.zIndex = '-1';
    cubeContainer.style.opacity = '0';
    cubeContainer.style.transition = 'opacity 0.5s ease';
    document.body.appendChild(cubeContainer);
    cubeContainer.appendChild(renderer.domElement);

    // 创建镜面立方体容器
    const cubeGeometry = new THREE.BoxGeometry(2.5, 2.5, 2.5);
    const mirrorMaterial = new THREE.MeshPhysicalMaterial({
        color: 0xffffff,
        metalness: 0.9,
        roughness: 0.01,
        reflectivity: 1.0,
        transparent: true,
        opacity: 0.8
    });
    cube = new THREE.Mesh(cubeGeometry, mirrorMaterial);
    scene.add(cube);

    // 在立方体内部添加球体
    const sphereGeometry = new THREE.SphereGeometry(1.1, 32, 32);
    const sphereMaterial = new THREE.MeshStandardMaterial({
        color: 0xff00ff,
        metalness: 0.7,
        roughness: 0.2
    });
    const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
    scene.add(sphere);

    // 添加光源
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(1, 1, 1);
    scene.add(directionalLight);

    // 响应窗口大小变化
    window.addEventListener('resize', onWindowResize);

    // 开始动画循环
    animate();
}

// 窗口大小变化处理
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// 动画循环
function animate() {
    requestAnimationFrame(animate);

    if (isCubePage) {
        // 自动旋转
        cube.rotation.x += 0.002;
        cube.rotation.y += 0.004;
        // 球体反向旋转
        if (sphere) {
            sphere.rotation.x -= 0.002;
            sphere.rotation.y -= 0.004;
        }
    }

    renderer.render(scene, camera);
}

// 全局旋转函数
window.rotateCube = function (x, y) {
    if (cube) {
        // 将角度转换为弧度
        const radX = (x * Math.PI) / 180;
        const radY = (y * Math.PI) / 180;

        cube.rotation.x += radX;
        cube.rotation.y += radY;

        // 球体反向旋转以保持相对位置
        if (sphere) {
            sphere.rotation.x -= radX;
            sphere.rotation.y -= radY;
        }
    }
};

// 显示立方体页面
function showCubePage() {
    isCubePage = true;
    const cubeContainer = document.getElementById('cube-container');
    if (cubeContainer) {
        cubeContainer.style.opacity = '1';
    }
}

// 隐藏立方体页面
function hideCubePage() {
    isCubePage = false;
    const cubeContainer = document.getElementById('cube-container');
    if (cubeContainer) {
        cubeContainer.style.opacity = '0';
    }
}

// 实现鼠标控制
function initMouseControl() {
    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };

    document.addEventListener('mousedown', (e) => {
        isDragging = true;
        previousMousePosition = { x: e.clientX, y: e.clientY };
    });

    document.addEventListener('mousemove', (e) => {
        if (isDragging && isCubePage) {
            const deltaMove = {
                x: e.clientX - previousMousePosition.x,
                y: e.clientY - previousMousePosition.y
            };

            // 调用全局旋转函数
            window.rotateCube(deltaMove.y * 0.5, deltaMove.x * 0.5);

            previousMousePosition = { x: e.clientX, y: e.clientY };
        }
    });

    document.addEventListener('mouseup', () => {
        isDragging = false;
    });
}

// 实现页面下拉进入效果
function initScrollEffect() {
    let startY = 0;
    let scrollY = 0;
    let isScrolling = false;

    document.addEventListener('touchstart', (e) => {
        startY = e.touches[0].clientY;
        isScrolling = true;
    }, { passive: true });

    document.addEventListener('touchmove', (e) => {
        if (isScrolling) {
            scrollY = e.touches[0].clientY - startY;

            // 当下拉超过100px时，显示立方体背景
            if (scrollY > 100 && !isCubePage) {
                showCubeBackground();
            } else if (scrollY < 50 && isCubePage) {
                hideCubeBackground();
            }
        }
    }, { passive: true });

    document.addEventListener('touchend', () => {
        isScrolling = false;
    });

    // 鼠标滚轮支持
    document.addEventListener('wheel', (e) => {
        if (e.deltaY > 0 && !isCubePage) {
            // 向下滚动，显示立方体背景
            showCubeBackground();
        } else if (e.deltaY < 0 && isCubePage) {
            // 向上滚动，隐藏立方体背景
            hideCubeBackground();
        }
    }, { passive: true });
}

// 显示立方体背景
function showCubeBackground() {
    isCubePage = true;
    const cubeContainer = document.getElementById('cube-container');
    if (cubeContainer) {
        cubeContainer.style.zIndex = '-1';
        cubeContainer.style.opacity = '1';
    }
}

// 隐藏立方体背景
function hideCubeBackground() {
    isCubePage = false;
    const cubeContainer = document.getElementById('cube-container');
    if (cubeContainer) {
        cubeContainer.style.zIndex = '-1';
        cubeContainer.style.opacity = '0';
    }
}

// 初始化所有功能
function init() {
    initCube();
    initMouseControl();
    initScrollEffect();
    initCubePageToggle();
}

// 初始化立方体页面切换按钮
function initCubePageToggle() {
    const toggleBtn = document.getElementById('cubePageToggle');
    if (toggleBtn) {
        toggleBtn.addEventListener('click', function () {
            if (isCubePage) {
                hideCubePage();
                toggleBtn.innerHTML = '<i class="fas fa-cube"></i> 立方体页面';
            } else {
                showCubePageFull();
                toggleBtn.innerHTML = '<i class="fas fa-arrow-left"></i> 返回主页面';
            }
        });
    }
}

// 显示全屏立方体页面
function showCubePageFull() {
    isCubePage = true;
    const cubeContainer = document.getElementById('cube-container');
    const mainContent = document.getElementById('main-interface');
    const splashScreen = document.getElementById('splash-screen');

    if (cubeContainer) {
        cubeContainer.style.zIndex = '2';
        cubeContainer.style.opacity = '1';
    }

    if (mainContent) {
        mainContent.style.display = 'none';
    }

    if (splashScreen) {
        splashScreen.style.display = 'none';
    }
}

// 隐藏全屏立方体页面
function hideCubePage() {
    isCubePage = false;
    const cubeContainer = document.getElementById('cube-container');
    const mainContent = document.getElementById('main-interface');
    const splashScreen = document.getElementById('splash-screen');

    if (cubeContainer) {
        cubeContainer.style.zIndex = '-1';
        cubeContainer.style.opacity = '0';
    }

    if (mainContent) {
        mainContent.style.display = 'block';
    }

    if (splashScreen) {
        splashScreen.style.display = 'block';
    }
}

// 页面加载完成后初始化
window.addEventListener('DOMContentLoaded', init);