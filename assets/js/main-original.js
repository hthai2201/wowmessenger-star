const MOON_TEXTURE_URL = "/assets/images/moon_color_texture.jpg",
  MOON_DISPLACEMENT_URL = "/assets/images/moon_displacement.jpg",
  WORLD_TEXTURE_URL = "/assets/images/world_texture.jpg",
  preloader = new PreLoader();
let THREE,
  OrbitControls,
  GLTFLoader,
  EffectComposer,
  RenderPass,
  UnrealBloomPass,
  scene,
  camera,
  renderer,
  controls,
  moon,
  mainStar;
preloader.preloadFonts([
  {
    name: "Comfortaa",
    url: "https://fonts.googleapis.com/css2?family=Comfortaa:wght@300;400;500;600;700&display=swap&subset=latin-ext",
  },
]),
  preloader.preloadThreeJS({
    threeJsUrl: "https://unpkg.com/three@0.158.0/build/three.module.js",
    addons: [
      "controls/OrbitControls",
      "loaders/GLTFLoader",
      "postprocessing/EffectComposer",
      "postprocessing/RenderPass",
      "postprocessing/UnrealBloomPass",
    ],
  }),
  preloader.addTexture("moon_texture", MOON_TEXTURE_URL),
  preloader.addTexture("moon_displacement", MOON_DISPLACEMENT_URL),
  preloader.addTexture("world_texture", WORLD_TEXTURE_URL),
  preloader.addBase64Image("demo_moon_sample", "demo_moon_sample"),
  preloader
    .onAllResourcesLoaded(() => {
      console.log("All resources loaded, initializing 3D scene..."),
        (THREE = window._preloadedTHREE),
        import("three/addons/controls/OrbitControls.js").then((e) => {
          (OrbitControls = e.OrbitControls),
            import("three/addons/loaders/GLTFLoader.js").then((e) => {
              (GLTFLoader = e.GLTFLoader),
                Promise.all([
                  import("three/addons/postprocessing/EffectComposer.js"),
                  import("three/addons/postprocessing/RenderPass.js"),
                  import("three/addons/postprocessing/UnrealBloomPass.js"),
                ]).then(([e, t, o]) => {
                  (EffectComposer = e.EffectComposer),
                    (RenderPass = t.RenderPass),
                    (UnrealBloomPass = o.UnrealBloomPass),
                    console.log(
                      "All Three.js modules loaded, initializing scene..."
                    ),
                    init();
                });
            });
        });
    })
    .start();
let initialCameraPosition,
  targetCameraPosition,
  isZoomedToMainStar = !1,
  zoomProgress = 0;
const zoomDuration = 3.6;
let initialMoonRotation,
  targetMoonRotation,
  clock,
  loveText,
  emojiInstancedMesh,
  isMoonRotating = !0,
  moonRotationProgress = 0,
  mainStarRotationProgress = 0,
  lastFrameTime = Date.now(),
  moonSizeRatio = 1 / 3,
  stars = [],
  emojiObjects = [];
const MAX_EMOJI_COUNT = 100,
  DISTANCE_TO_MOON = 300,
  CAMERA_DISTANCE_TO_MAINSTAR = 90,
  STAR_RADIUS = 15,
  MOON_POS_Y = 30,
  MAINSTAR_POS_Y = 80,
  CAMERA_POS_Y = 10,
  CAMERA_LOOK_Y = 10,
  LOVE_TEXT_DISTANCE_TO_MAINSTAR = 26,
  moonTextureURL =
    "https://s3-us-west-2.amazonaws.com/s.cdpn.io/17271/lroc_color_poles_1k.jpg",
  moonDisplacementURL =
    "https://s3-us-west-2.amazonaws.com/s.cdpn.io/17271/ldem_3_8bit.jpg",
  worldURL = "https://s3-us-west-2.amazonaws.com/s.cdpn.io/17271/hipp8_s.jpg";
async function loadImageBase64FromJson(e) {
  try {
    const t = await fetch("assets/imagebase64.json");
    if (!t.ok) throw new Error(`HTTP error! status: ${t.status}`);
    const o = await t.json();
    return o[e]
      ? o[e]
      : (console.warn(`Image '${e}' not found in imagebase64.json`), null);
  } catch (e) {
    return console.error("Error loading image base64 data:", e), null;
  }
}
function getImageBase64(e = "demo_moon_sample") {
  const t = window.PreloaderCache.base64Images[e];
  return t
    ? (console.log(`Using preloaded image from PreloaderCache: ${e}`), t)
    : (console.log(`Image ${e} not preloaded, loading from JSON`),
      loadImageBase64FromJson(e).then((t) => {
        t &&
          ((window.PreloaderCache.base64Images =
            window.PreloaderCache.base64Images || {}),
          (window.PreloaderCache.base64Images[e] = t),
          moon && updateMoonTexture());
      }),
      "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyMDAgMjAwIj48Y2lyY2xlIGN4PSIxMDAiIGN5PSIxMDAiIHI9IjgwIiBmaWxsPSJub25lIiBzdHJva2U9IiNmZmYiIHN0cm9rZS13aWR0aD0iMiIvPjxjaXJjbGUgY3g9IjEwMCIgY3k9IjEwMCIgcj0iNjAiIGZpbGw9Im5vbmUiIHN0cm9rZT0iI2ZmZiIgc3Ryb2tlLXdpZHRoPSIyIi8+PGNpcmNsZSBjeD0iMTAwIiBjeT0iMTAwIiByPSI0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjZmZmIiBzdHJva2Utd2lkdGg9IjIiLz48Y2lyY2xlIGN4PSIxMDAiIGN5PSIxMDAiIHI9IjIwIiBmaWxsPSJub25lIiBzdHJva2U9IiNmZmYiIHN0cm9rZS13aWR0aD0iMiIvPjwvc3ZnPg==");
}
function getMainStarBase64() {
  const e = window.PreloaderCache.base64Images.demo_moon_sample;
  return e
    ? (console.log("Using preloaded image for MainStar from PreloaderCache"), e)
    : (console.log("MainStar image not preloaded, loading from JSON"),
      loadImageBase64FromJson("demo_moon_sample").then((e) => {
        e &&
          ((window.PreloaderCache.base64Images =
            window.PreloaderCache.base64Images || {}),
          (window.PreloaderCache.base64Images.demo_moon_sample = e));
      }),
      "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyMDAgMjAwIj48Y2lyY2xlIGN4PSIxMDAiIGN5PSIxMDAiIHI9IjgwIiBmaWxsPSJub25lIiBzdHJva2U9IiNmZmYiIHN0cm9rZS13aWR0aD0iMiIvPjxjaXJjbGUgY3g9IjEwMCIgY3k9IjEwMCIgcj0iNjAiIGZpbGw9Im5vbmUiIHN0cm9rZT0iI2ZmZiIgc3Ryb2tlLXdpZHRoPSIyIi8+PGNpcmNsZSBjeD0iMTAwIiBjeT0iMTAwIiByPSI0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjZmZmIiBzdHJva2Utd2lkdGg9IjIiLz48Y2lyY2xlIGN4PSIxMDAiIGN5PSIxMDAiIHI9IjIwIiBmaWxsPSJub25lIiBzdHJva2U9IiNmZmYiIHN0cm9rZS13aWR0aD0iMiIvPjwvc3ZnPg==");
}
function updateMoonTexture() {
  if (!moon) return;
  const e = getImageBase64("demo_moon_sample"),
    t = new Image();
  (t.onload = function () {
    const e = document.createElement("canvas");
    (e.width = 512), (e.height = 512);
    const o = e.getContext("2d", { alpha: !0 });
    o.clearRect(0, 0, e.width, e.height),
      void 0 !== o.imageSmoothingEnabled &&
        ((o.imageSmoothingEnabled = !0), (o.imageSmoothingQuality = "high")),
      o.drawImage(t, 0, 0, e.width, e.height);
    const a = new THREE.CanvasTexture(e);
    (a.encoding = THREE.sRGBEncoding),
      moon.material &&
        moon.material.map &&
        (moon.material.map.dispose(),
        (moon.material.map = a),
        (moon.material.needsUpdate = !0));
  }),
    (t.src = e);
}
const DEBUG = !0;
function log(...e) {}
function createQuestionUI() {
  log("Creating Question UI");
  const e = document.createElement("div");
  e.className = "question-container";
  const t = document.createElement("div");
  (t.className = "question-text"),
    (t.textContent = "Ngôi sao có tọa độ [ILY4EV-99] tên là?"),
    e.appendChild(t);
  const o = document.createElement("div");
  o.className = "answer-options";
  ["Sao Thủy", "Sao Mộc", "Sao Kim", "Sao Băng"].forEach((e, t) => {
    const a = document.createElement("div");
    (a.className = "answer-option"),
      (a.textContent = e),
      (a.dataset.answer = e),
      a.addEventListener("click", function () {
        document.querySelectorAll(".answer-option").forEach((e) => {
          e.classList.remove("selected");
        }),
          this.classList.add("selected");
        const e = document.querySelector(".answer-button");
        e.classList.add("visible"), n++, (e.textContent = i[n % 2]);
      }),
      o.appendChild(a);
  }),
    e.appendChild(o);
  const a = document.createElement("button");
  (a.className = "answer-button"),
    (a.textContent = "Chưa chính xác! Click để xem đáp án");
  let n = 0;
  const i = [
    "Chưa chính xác! Click để xem đáp án",
    "Hehe, sai rồi! Click để xem đáp án",
    "Không phải! Click để xem đáp án",
  ];
  a.addEventListener("click", function () {
    (e.style.opacity = "0"),
      (e.style.transition = "opacity 0.3s ease"),
      setTimeout(() => {
        e.parentNode && e.parentNode.removeChild(e);
      }, 300),
      "function" == typeof zoomToMainStar
        ? zoomToMainStar()
        : console.error("zoomToMainStar function not found");
  }),
    e.appendChild(a),
    document.body.appendChild(e),
    log("Question UI created successfully");
}
function createBackgroundStars() {
  const e = document.getElementById("stars");
  for (let t = 0; t < 20; t++) {
    const t = document.createElement("div");
    t.className = "star";
    const o = 0.6 * Math.random() + 0.3;
    (t.style.width = o + "px"),
      (t.style.height = o + "px"),
      (t.style.left = 100 * Math.random() + "%"),
      (t.style.top = 100 * Math.random() + "%"),
      Math.random() < 0.3 && t.classList.add("bright"),
      (t.style.animationDelay = 3 * Math.random() + "s"),
      e.appendChild(t);
  }
}
function init() {
  log("Initializing Three.js scene with Moon focus"),
    (scene = new THREE.Scene()),
    (camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1e3
    )),
    log(
      "Camera created with wider FOV (75 degrees) and farther clipping plane (1000 units)"
    ),
    camera.position.set(0, 30, -30),
    camera.lookAt(0, -10, 60),
    (renderer = new THREE.WebGLRenderer({
      canvas: document.getElementById("webgl-canvas"),
      antialias: !0,
      alpha: !0,
    })),
    renderer.setSize(window.innerWidth, window.innerHeight),
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)),
    log("Renderer created with size:", window.innerWidth, window.innerHeight),
    renderer.setClearColor(0, 0),
    (renderer.outputEncoding = THREE.sRGBEncoding),
    (renderer.toneMapping = THREE.NoToneMapping),
    (renderer.toneMappingExposure = 1),
    (controls = new OrbitControls(camera, renderer.domElement)),
    (controls.enabled = !1),
    (controls.enableRotate = !1),
    (controls.enableZoom = !1),
    (controls.enablePan = !1),
    controls.target.set(0, -10, 60),
    log(
      "Orbit controls initialized but DISABLED - no user interaction allowed"
    );
  const e = renderer.domElement,
    t = (e) => (e.preventDefault(), e.stopPropagation(), !1);
  e.addEventListener("mousedown", t, { passive: !1, capture: !0 }),
    e.addEventListener("mousemove", t, { passive: !1, capture: !0 }),
    e.addEventListener("mouseup", t, { passive: !1, capture: !0 }),
    e.addEventListener("click", t, { passive: !1, capture: !0 }),
    e.addEventListener("dblclick", t, { passive: !1, capture: !0 }),
    e.addEventListener("wheel", t, { passive: !1, capture: !0 }),
    e.addEventListener("contextmenu", t, { passive: !1, capture: !0 }),
    e.addEventListener("touchstart", t, { passive: !1, capture: !0 }),
    e.addEventListener("touchmove", t, { passive: !1, capture: !0 }),
    e.addEventListener("touchend", t, { passive: !1, capture: !0 }),
    e.addEventListener("touchcancel", t, { passive: !1, capture: !0 }),
    e.addEventListener("pointerdown", t, { passive: !1, capture: !0 }),
    e.addEventListener("pointermove", t, { passive: !1, capture: !0 }),
    e.addEventListener("pointerup", t, { passive: !1, capture: !0 }),
    e.addEventListener("pointercancel", t, { passive: !1, capture: !0 }),
    e.addEventListener("gesturestart", t, { passive: !1, capture: !0 }),
    e.addEventListener("gesturechange", t, { passive: !1, capture: !0 }),
    e.addEventListener("gestureend", t, { passive: !1, capture: !0 }),
    log("All interaction events blocked on canvas");
  const o = new THREE.AmbientLight(4210752, 0.3);
  scene.add(o), log("Added ambient light");
  const a = new THREE.DirectionalLight(16777215, 1);
  a.position.set(-100, 10, 50),
    scene.add(a),
    log("Added directional light at position:", a.position);
  const n = new THREE.HemisphereLight(16777215, 16777215, 0.1);
  n.color.setHSL(0.6, 1, 0.6),
    n.groundColor.setHSL(0.095, 1, 0.75),
    n.position.set(0, 0, 0),
    scene.add(n),
    log("Added hemisphere light"),
    createBackgroundStars(),
    registerZoomToMainStarEvent(),
    createMoon(),
    createQuestionUI(),
    createMainStar(),
    create3DStars(),
    (clock = new THREE.Clock()),
    window.addEventListener("resize", onWindowResize),
    initEmojiSystem(),
    initReactions(),
    animate();
}
const moonVertexShader =
    "\n            varying vec2 vUv;\n            varying vec3 vNormal;\n            varying vec3 vViewPosition;\n            \n            void main() {\n                vUv = uv;\n                vNormal = normalize(normalMatrix * normal);\n                vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);\n                vViewPosition = -mvPosition.xyz;\n                gl_Position = projectionMatrix * mvPosition;\n            }\n        ",
  moonFragmentShader =
    "\n            uniform sampler2D moonTexture;\n            uniform float blendOpacity;\n            uniform bool isZoomedToMainStar;\n            \n            varying vec2 vUv;\n            varying vec3 vNormal;\n            varying vec3 vViewPosition;\n            \n            void main() {\n                // Sample the moon texture\n                vec4 moonColor = texture2D(moonTexture, vUv);\n                \n                // Calculate view direction and dot product with normal\n                vec3 viewDir = normalize(vViewPosition);\n                float dotProduct = dot(vNormal, viewDir);\n                \n                // Only blend on the front-facing hemisphere (dot product > 0)\n                // This makes the image visible when looking directly at the moon\n                float blendFactor = step(0.0, dotProduct) * dotProduct * blendOpacity;\n                \n                // Blend the colors\n                vec4 finalColor = mix(moonColor, moonColor, blendFactor);\n                \n                // Apply a yellow tint\n                finalColor.rgb *= vec3(1.0, 0.97, 0.75); // Light yellow tint\n                \n                gl_FragColor = finalColor;\n            }\n        ";
function createMoon() {
  log("Creating moon with realistic textures and custom image blend");
  const e = new THREE.SphereGeometry(15, 60, 60),
    t = new THREE.TextureLoader();
  let o, a;
  log("Using preloaded moon textures..."),
    preloader.getTexture("moon_texture")
      ? ((o = new THREE.Texture(preloader.getTexture("moon_texture"))),
        (o.needsUpdate = !0),
        log("Using preloaded moon texture from PreloaderCache"))
      : ((o = t.load(MOON_TEXTURE_URL, () =>
          log("Moon texture loaded on-demand")
        )),
        log("WARNING: Moon texture was not preloaded properly")),
    preloader.getTexture("moon_displacement")
      ? ((a = new THREE.Texture(preloader.getTexture("moon_displacement"))),
        (a.needsUpdate = !0),
        log("Using preloaded moon displacement map from PreloaderCache"))
      : ((a = t.load(MOON_DISPLACEMENT_URL, () =>
          log("Moon displacement map loaded on-demand")
        )),
        log("WARNING: Moon displacement map was not preloaded properly"));
  const n = new THREE.ShaderMaterial({
      uniforms: { moonTexture: { value: o }, blendOpacity: { value: 1 } },
      vertexShader: moonVertexShader,
      fragmentShader: moonFragmentShader,
      transparent: !1,
      depthWrite: !0,
      depthTest: !0,
    }),
    i = new THREE.MeshPhongMaterial({
      displacementMap: a,
      displacementScale: 0.06,
      bumpMap: a,
      bumpScale: 0.04,
      transparent: !0,
      opacity: 0,
      wireframe: !1,
      depthWrite: !1,
    });
  moon = new THREE.Mesh(e, n);
  const r = new THREE.Mesh(e, i);
  r.scale.set(1.01, 1.01, 1.01),
    moon.add(r),
    moon.position.set(0, 30, 60),
    (moon.rotation.x = THREE.MathUtils.degToRad(3.1415 * 0.02)),
    (moon.rotation.y = THREE.MathUtils.degToRad(3.1415 * 1.54)),
    scene.add(moon);
  const s = new THREE.PointLight(16777181, 0.5, 40);
  s.position.copy(moon.position), scene.add(s), setDarkBackground();
}
function setDarkBackground() {
  log("Setting dark background"), log("Dark background set");
}
function createMainStar() {
  log("Creating MainStar behind the moon");
  const e = new THREE.PlaneGeometry(30, 30);
  log("Creating MainStar with radius:", 15);
  const t = getMainStarBase64();
  let o;
  if (
    (loadImageBase64FromJson("demo_moon_sample").then((e) => {
      e &&
        (function (e) {
          if (!mainStar || !mainStar.material) return;
          const t = new Image();
          (t.onload = function () {
            const e = document.createElement("canvas");
            (e.width = 512), (e.height = 512);
            const o = e.getContext("2d", { alpha: !0 });
            o.clearRect(0, 0, e.width, e.height),
              void 0 !== o.imageSmoothingEnabled &&
                ((o.imageSmoothingEnabled = !0),
                (o.imageSmoothingQuality = "high")),
              o.drawImage(t, 0, 0, e.width, e.height);
            const a = o.getImageData(0, 0, e.width, e.height),
              n = a.data,
              i = 66355.8 / 65739;
            for (let e = 0; e < n.length; e += 4)
              (n[e] = Math.max(0, Math.min(255, i * (n[e] - 128) + 128))),
                (n[e + 1] = Math.max(
                  0,
                  Math.min(255, i * (n[e + 1] - 128) + 128)
                )),
                (n[e + 2] = Math.max(
                  0,
                  Math.min(255, i * (n[e + 2] - 128) + 128)
                ));
            o.putImageData(a, 0, 0);
            const r = new THREE.CanvasTexture(e);
            (r.encoding = THREE.sRGBEncoding),
              mainStar.material.map && mainStar.material.map.dispose(),
              (mainStar.material.map = r),
              (mainStar.material.needsUpdate = !0);
          }),
            (t.src = e);
        })(e);
    }),
    t && t.length > 0)
  ) {
    const e = new Image();
    e.src = t;
    const a = document.createElement("canvas");
    (a.width = 512), (a.height = 512);
    const n = a.getContext("2d");
    (e.onload = () => {
      n.drawImage(e, 0, 0, a.width, a.height),
        (o.image = a),
        (o.needsUpdate = !0);
    }),
      (o = new THREE.CanvasTexture(a));
  } else {
    const e = document.createElement("canvas");
    (e.width = 1024), (e.height = 1024);
    const t = e.getContext("2d");
    t.clearRect(0, 0, e.width, e.height);
    const a = t.createRadialGradient(
      e.width / 2,
      e.height / 2,
      0,
      e.width / 2,
      e.height / 2,
      e.width / 8
    );
    a.addColorStop(0, "#ffffff"),
      a.addColorStop(0.2, "#fffff0"),
      a.addColorStop(0.5, "#ffff99"),
      a.addColorStop(0.8, "#ffee66"),
      a.addColorStop(1, "#ffdd33"),
      (t.fillStyle = a),
      t.beginPath(),
      t.arc(e.width / 2, e.height / 2, e.width / 8, 0, 2 * Math.PI),
      t.fill();
    const n = t.createRadialGradient(
      e.width / 2,
      e.height / 2,
      e.width / 8,
      e.width / 2,
      e.height / 2,
      e.width / 4
    );
    n.addColorStop(0, "#ffdd33"),
      n.addColorStop(0.3, "#ffcc00"),
      n.addColorStop(0.6, "#ff9900"),
      n.addColorStop(0.8, "#ff6600"),
      n.addColorStop(1, "rgba(255, 60, 0, 0.9)"),
      (t.fillStyle = n),
      t.beginPath(),
      t.arc(e.width / 2, e.height / 2, e.width / 4, 0, 2 * Math.PI),
      t.fill(),
      (t.globalCompositeOperation = "lighter");
    for (let o = 0; o < 50; o++) {
      const o = Math.random() * (e.width / 4 - e.width / 8) + e.width / 8,
        a = Math.random() * Math.PI * 2,
        n = e.width / 2 + Math.cos(a) * o,
        i = e.height / 2 + Math.sin(a) * o,
        r = Math.random() * (e.width / 30) + e.width / 60,
        s = 0.4 * Math.random() + 0.6,
        l = t.createRadialGradient(n, i, 0, n, i, r);
      l.addColorStop(0, `rgba(255, 255, 255, ${s})`),
        l.addColorStop(1, "rgba(255, 255, 255, 0)"),
        (t.fillStyle = l),
        t.beginPath(),
        t.arc(n, i, r, 0, 2 * Math.PI),
        t.fill();
    }
    t.globalCompositeOperation = "source-over";
    const i = t.createRadialGradient(
      e.width / 2,
      e.height / 2,
      e.width / 4,
      e.width / 2,
      e.height / 2,
      e.width / 1.5
    );
    i.addColorStop(0, "rgba(255, 230, 110, 0.8)"),
      i.addColorStop(0.2, "rgba(255, 210, 80, 0.6)"),
      i.addColorStop(0.4, "rgba(255, 180, 60, 0.4)"),
      i.addColorStop(0.6, "rgba(255, 150, 30, 0.2)"),
      i.addColorStop(0.8, "rgba(255, 100, 0, 0.1)"),
      i.addColorStop(1, "rgba(255, 50, 0, 0)"),
      (t.fillStyle = i),
      t.beginPath(),
      t.arc(e.width / 2, e.height / 2, e.width / 1.5, 0, 2 * Math.PI),
      t.fill(),
      (t.globalCompositeOperation = "lighter");
    const r = 12,
      s = e.width / 4,
      l = e.width / 1.8;
    for (let o = 0; o < r; o++) {
      const a = (o / r) * Math.PI * 2,
        n = t.createLinearGradient(
          e.width / 2 + Math.cos(a) * s,
          e.height / 2 + Math.sin(a) * s,
          e.width / 2 + Math.cos(a) * l,
          e.height / 2 + Math.sin(a) * l
        );
      n.addColorStop(0, "rgba(255, 255, 180, 0.5)"),
        n.addColorStop(1, "rgba(255, 200, 50, 0)"),
        (t.fillStyle = n),
        t.beginPath(),
        t.moveTo(e.width / 2, e.height / 2);
      const i = (Math.PI / r) * 0.7;
      t.arc(e.width / 2, e.height / 2, l, a - i, a + i),
        t.closePath(),
        t.fill();
    }
    (t.globalCompositeOperation = "source-over"),
      (o = new THREE.CanvasTexture(e));
  }
  const a = new THREE.MeshBasicMaterial({
    map: o,
    transparent: !0,
    side: THREE.DoubleSide,
    depthWrite: !1,
    depthTest: !0,
    opacity: 1,
    alphaTest: 0.01,
    toneMapped: !1,
  });
  log("MainStar material created with depthTest: false, depthWrite: false"),
    (mainStar = new THREE.Mesh(e, a)),
    (mainStar.renderOrder = 9999);
  const n = moon ? moon.position.clone() : new THREE.Vector3(0, 30, 60);
  mainStar.position.set(0, 80, n.z + 300), mainStar.lookAt(camera.position);
  const i = new THREE.PointLight(16178297, 0.5, 8 * Math.abs(300));
  i.position.copy(mainStar.position), scene.add(i);
  const r = new THREE.PointLight(15978573, 0.8, 5 * Math.abs(300));
  r.position.copy(mainStar.position), scene.add(r);
  const s = new THREE.PointLight(15778848, 2, 3 * Math.abs(300));
  s.position.copy(mainStar.position), scene.add(s);
  const l = document.createElement("canvas");
  (l.width = 512), (l.height = 512);
  const d = l.getContext("2d"),
    c = d.createRadialGradient(
      l.width / 2,
      l.height / 2,
      0,
      l.width / 2,
      l.height / 2,
      l.width / 2
    );
  c.addColorStop(0.1, "rgba(255, 255, 180, 0.5)"),
    c.addColorStop(0.3, "rgba(255, 230, 110, 0.3)"),
    c.addColorStop(0, "rgba(255, 255, 180, 0)"),
    c.addColorStop(0.6, "rgba(255, 180, 60, 0.15)"),
    c.addColorStop(1, "rgba(255, 120, 0, 0)"),
    (d.fillStyle = c),
    d.beginPath(),
    d.arc(l.width / 2, l.height / 2, l.width / 2, 0, 2 * Math.PI),
    d.fill();
  const m = new THREE.CanvasTexture(l),
    h = new THREE.SpriteMaterial({
      map: m,
      transparent: !0,
      blending: THREE.AdditiveBlending,
      depthWrite: !1,
      depthTest: !0,
    }),
    g = new THREE.Sprite(h);
  g.scale.set(60, 60, 1),
    g.position.copy(mainStar.position),
    (g.position.z -= 1),
    scene.add(g),
    (mainStar.userData.glowSprite = g),
    (mainStar.userData.pulseTime = 0),
    (mainStar.userData.pulseSpeed = 0.6),
    (mainStar.userData.pulseMin = 0.8),
    (mainStar.userData.pulseMax = 1.1),
    (mainStar.userData.lights = [i, r, s]),
    log("Added enhanced star lighting system with animated glow effect"),
    scene.add(mainStar),
    log("MainStar added to scene"),
    (loveText = createLoveText()),
    loveText.position.set(
      mainStar.position.x,
      mainStar.position.y - 10,
      mainStar.position.z
    ),
    loveText.scale.set(2, 2, 2),
    loveText.lookAt(camera.position),
    (loveText.renderOrder = 999),
    (loveText.visible = !1),
    scene.add(loveText),
    requestAnimationFrame(() => {
      console.log("First frame rendered, dismissing preloader..."),
        preloader.dismiss(300, 800).then(() => {
          console.log("Preloader dismissed");
        });
    });
}
function create3DStars() {
  const e = new THREE.SphereGeometry(0.3, 8, 8),
    t = new THREE.MeshBasicMaterial({ color: 16777215 });
  for (let o = 0; o < 99; o++) {
    const o = new THREE.Mesh(e, t);
    let a, n, i;
    do {
      const e = Math.random() * Math.PI * 2,
        t = (Math.random() * Math.PI) / 2,
        o = 80 + 100 * Math.random();
      (a = o * Math.sin(t) * Math.cos(e)),
        (n = o * Math.sin(t) * Math.sin(e)),
        (i = o * Math.cos(t));
      Math.sqrt(Math.pow(a - 0, 2) + Math.pow(n - 10, 2) + Math.pow(i - 50, 2));
    } while (
      Math.sqrt(
        Math.pow(a - 0, 2) + Math.pow(n - 10, 2) + Math.pow(i - 50, 2)
      ) < 30
    );
    o.position.set(a, n, i),
      (o.userData = {
        originalPosition: o.position.clone(),
        pulseFactor: 0.2 * Math.random() + 0.8,
        pulseSpeed: 2 * Math.random() + 1,
      }),
      scene.add(o),
      stars.push(o);
  }
}
function onWindowResize() {
  (camera.aspect = window.innerWidth / window.innerHeight),
    camera.updateProjectionMatrix(),
    renderer.setSize(window.innerWidth, window.innerHeight);
}
function calculateOptimalDistance(e, t, o) {
  const a = THREE.MathUtils.degToRad(o),
    n = (2 * e) / (t * (2 * Math.tan(a / 2)));
  return log("Calculated optimal distance:", n), n;
}
const fallingStarsVertexShader =
    "\n            uniform float time;\n            uniform float sizeFactor;\n            \n            // Sử dụng các thuộc tính mặc định của Three.js\n            // position, color và size đã được Three.js định nghĩa sẵn\n            attribute float opacity;\n            attribute float delay;\n            attribute float speed;\n            attribute float sizeVariation; // Thêm thuộc tính kích thước ngẫu nhiên\n            \n            varying float vOpacity;\n            varying vec3 vColor;\n            \n            void main() {\n                // Tính toán thời gian có tính đến delay\n                float fallProgress = mod(time * speed + delay, 1.0);\n                \n                // Tạo hiệu ứng uốn lượn khi rơi\n                // Dịch chuyển tuyến tính từ trái -> phải\n                float moveX = -fallProgress * 50.0;\n                float waveX = sin(fallProgress * 6.28) * 5.0;\n                \n                // Vị trí cuối cùng\n                vec3 pos = position;\n                pos.x += waveX + moveX;\n                pos.y -= fallProgress * 50.0; // Rơi xuống 50 đơn vị, phù hợp với khoảng cách từ MainStar.y - 20 đến MainStar.y + 80\n                \n                // Tính toán opacity dựa trên thời gian\n                vOpacity = opacity * (0.5 + 0.5 * sin(time * 3.0 + delay * 10.0));\n                \n                // Truyền màu sắc cho fragment shader\n                vColor = vec3(1.0, 1.0, 1.0); // Màu trắng\n                \n                // Áp dụng vị trí và kích thước\n                vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);\n                \n                // Tính toán kích thước dựa trên khoảng cách từ camera\n                // Khoảng cách càng xa, ngôi sao càng nhỏ\n                float distance = length(mvPosition.xyz);\n                gl_PointSize = sizeFactor * sizeVariation * (500.0 / distance); // Tăng hệ số để ngôi sao lớn hơn\n                \n                gl_Position = projectionMatrix * mvPosition;\n            }\n        ",
  fallingStarsFragmentShader =
    "\n            varying float vOpacity;\n            varying vec3 vColor;\n            \n            void main() {\n                // Tạo hình tròn mượt mà cho ngôi sao\n                vec2 uv = gl_PointCoord.xy;\n                float dist = length(uv - vec2(0.5, 0.5));\n                \n                // Tạo hiệu ứng glow\n                float glow = 0.35 / (dist + 0.1);\n                \n                // Sử dụng màu từ vertex shader với độ sáng thay đổi\n                vec3 color = vColor * glow;\n                \n                // Áp dụng alpha và opacity\n                float alpha = smoothstep(0.5, 0.0, dist) * vOpacity * 1.5;\n                \n                // Kết quả cuối cùng\n                gl_FragColor = vec4(color, alpha);\n            }\n        ";
function createFallingStarsAnimation() {
  const e = 600,
    t = window.innerWidth,
    o = window.innerHeight,
    a = (mainStar && mainStar.position.z, scene),
    n = document.createElement("canvas");
  (n.width = 64), (n.height = 64);
  const i = n.getContext("2d"),
    r = i.createRadialGradient(
      n.width / 2,
      n.height / 2,
      0,
      n.width / 2,
      n.height / 2,
      n.width / 2
    );
  r.addColorStop(0, "rgba(255, 255, 255, 1)"),
    r.addColorStop(0.4, "rgba(255, 255, 255, 0.8)"),
    r.addColorStop(0.8, "rgba(255, 255, 255, 0.2)"),
    r.addColorStop(1, "rgba(255, 255, 255, 0)"),
    (i.fillStyle = r),
    i.beginPath(),
    i.arc(n.width / 2, n.height / 2, n.width / 2, 0, 2 * Math.PI),
    i.fill();
  new THREE.CanvasTexture(n);
  const s = new THREE.ShaderMaterial({
      uniforms: { time: { value: 0 }, sizeFactor: { value: 3 } },
      vertexShader: fallingStarsVertexShader,
      fragmentShader: fallingStarsFragmentShader,
      transparent: !0,
      depthWrite: !1,
      blending: THREE.AdditiveBlending,
      depthTest: !1,
      vertexColors: !1,
    }),
    l = new Float32Array(1800),
    d = new Float32Array(e),
    c = new Float32Array(e),
    m = new Float32Array(e),
    h = new Float32Array(e);
  new THREE.Object3D();
  for (let t = 0; t < e; t++) {
    const e = Math.random() < 0.2,
      o = e ? 0.8 : 0.5,
      a = (Math.random(), 0.3),
      n = (e ? 0.7 : 0.5) + Math.random() * a,
      i = (Math.random(), Math.random(), (camera.fov * Math.PI) / 180),
      r = mainStar.position.z - camera.position.z,
      s = 2 * Math.tan(i / 2) * r,
      g = s * camera.aspect,
      p = mainStar.position.x + 100 * (Math.random() - 0.5),
      u = mainStar.position.y + 80 * Math.random() - 20,
      w = mainStar.position.z - 20 - 40 * Math.random();
    t < 5 &&
      console.log(
        `Visible dimensions at MainStar: width=${g.toFixed(
          2
        )}, height=${s.toFixed(2)}`
      ),
      (l[3 * t] = p),
      (l[3 * t + 1] = u),
      (l[3 * t + 2] = w),
      console.log(
        `Star ${t}: x=${p.toFixed(2)}, y=${u.toFixed(2)}, z=${w.toFixed(2)}`
      ),
      (h[t] = e ? 0.3 * Math.random() + 0.36 : 0.2 * Math.random() + 0.09),
      (d[t] = n),
      (m[t] = e ? 0.1 * Math.random() + 0.03 : 0.03 * Math.random()),
      (c[t] = 2 * Math.random());
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(l, 3)),
    g.setAttribute("opacity", new THREE.BufferAttribute(d, 1)),
    g.setAttribute("delay", new THREE.BufferAttribute(c, 1)),
    g.setAttribute("speed", new THREE.BufferAttribute(m, 1)),
    g.setAttribute("sizeVariation", new THREE.BufferAttribute(h, 1));
  const p = new THREE.Points(g, s);
  (p.frustumCulled = !1),
    (p.renderOrder = 99999),
    p.position.set(0, 0, 0),
    console.log("Adding falling stars to scene:", p),
    console.log("MainStar position:", mainStar.position),
    console.log("Camera position:", camera.position),
    console.log("Falling stars position:", p.position),
    console.log("Star count:", e),
    console.log("Shader material:", s),
    console.log("Geometry attributes:", g.attributes),
    console.log("Sample star positions:");
  for (let e = 0; e < 5; e++)
    console.log(
      `Star ${e}: x=${l[3 * e]}, y=${l[3 * e + 1]}, z=${
        l[3 * e + 2]
      }, opacity=${d[e]}, delay=${c[e]}, speed=${m[e]}`
    );
  a.add(p),
    console.log("Scene children count:", scene.children.length),
    console.log("Scene children:", scene.children),
    (window.fallingStarsObject = p),
    console.log("Falling stars added to scene, parent:", p.parent);
  const u = performance.now() / 1e3;
  return (
    (scene.userData.updateFunctions = scene.userData.updateFunctions || []),
    scene.userData.updateFunctions.push(function () {
      const e = performance.now() / 1e3 - u;
      if (
        (s.uniforms.time && (s.uniforms.time.value = e),
        window.fallingStarsObject &&
          Math.floor(e) > Math.floor(e - 0.1) &&
          (console.log("Falling stars animation time:", e),
          console.log("MainStar position:", mainStar.position),
          console.log("Camera position:", camera.position),
          console.log(
            "Falling stars position:",
            window.fallingStarsObject.position
          ),
          window.fallingStarsObject.geometry &&
            window.fallingStarsObject.geometry.attributes.position))
      ) {
        window.fallingStarsObject.geometry.attributes.position.array;
        const e = (camera.fov * Math.PI) / 180,
          t = 2 * Math.tan(e / 2) * camera.near,
          o = t * camera.aspect,
          a = 2 * Math.tan(e / 2) * camera.far,
          n = a * camera.aspect;
        console.log(
          `[debug star anim] Camera frustum: near(${camera.near}), far(${camera.far}), fov(${camera.fov})`
        ),
          console.log(
            `[debug star anim] Visible at near: width=${o.toFixed(
              2
            )}, height=${t.toFixed(2)}`
          ),
          console.log(
            `[debug star anim] Visible at far: width=${n.toFixed(
              2
            )}, height=${a.toFixed(2)}`
          ),
          console.log(
            `[debug star anim] Visible at MainStar(z=${
              mainStar.position.z
            }): width=${(
              2 *
              Math.tan(e / 2) *
              Math.abs(mainStar.position.z - camera.position.z) *
              camera.aspect
            ).toFixed(2)}, height=${(
              2 *
              Math.tan(e / 2) *
              Math.abs(mainStar.position.z - camera.position.z)
            ).toFixed(2)}`
          );
      }
    }),
    console.log("Added updateFallingStars to scene.userData.updateFunctions"),
    console.log(
      "Current update functions:",
      scene.userData.updateFunctions.length
    ),
    p
  );
}
function zoomToMainStar() {
  console.log("[text love] Bắt đầu zoomToMainStar"),
    (initialCameraPosition = camera.position.clone());
  const e = mainStar.position.clone();
  mainStar.position.set(0, 100, e.z),
    loveText && loveText.position.set(0, mainStar.position.y - 26, e.z),
    (targetCameraPosition = new THREE.Vector3(0, 100, e.z - 90)),
    updateGlowPosition(),
    (camera.zoom = 1.6),
    camera.updateProjectionMatrix(),
    controls && (controls.enabled = !1),
    controls && controls.target.copy(e),
    mainStar.material &&
      ((mainStar.userData.originalOpacity = mainStar.material.opacity || 1),
      (mainStar.material.transparent = !0),
      (mainStar.material.opacity = 0),
      (mainStar.material.needsUpdate = !0),
      mainStar.userData.glowSprite &&
        ((mainStar.userData.glowSprite.material.opacity = 0),
        (mainStar.userData.glowSprite.material.needsUpdate = !0)),
      mainStar.userData.lights &&
        ((mainStar.userData.originalLightIntensities = []),
        mainStar.userData.lights.forEach((e, t) => {
          (mainStar.userData.originalLightIntensities[t] = e.intensity),
            (e.intensity = 0);
        }))),
    loveText &&
      (loveText.position.set(
        mainStar.position.x,
        mainStar.position.y - 26,
        mainStar.position.z
      ),
      loveText.lookAt(camera.position)),
    (isZoomedToMainStar = !0),
    (zoomProgress = 0),
    (zoomProgress = 0.01),
    setTimeout(() => {
      createFallingStarsAnimation();
    }, 100);
}
function updateGlowPosition() {
  mainStar &&
    mainStar.userData.glowSprite &&
    (mainStar.userData.glowSprite.position.copy(mainStar.position),
    (mainStar.userData.glowSprite.position.z -= 1));
}
function animateMainStarGlow(e, t) {
  if (!mainStar || !mainStar.userData) return;
  mainStar.userData.pulseTime += e * mainStar.userData.pulseSpeed;
  const o =
    mainStar.userData.pulseMin +
    ((Math.sin(mainStar.userData.pulseTime) + 1) / 2) *
      (mainStar.userData.pulseMax - mainStar.userData.pulseMin);
  if (mainStar.userData.glowSprite) {
    const e = 60;
    mainStar.userData.glowSprite.scale.set(e * o, e * o, 1);
  }
  mainStar.userData.lights &&
    ((mainStar.userData.lights[0].intensity = 5 + 0.5 * Math.sin(0.5 * t)),
    (mainStar.userData.lights[1].intensity = 3 + 0.3 * Math.sin(1.2 * t)),
    (mainStar.userData.lights[2].intensity = 2 + 0.2 * Math.sin(2.3 * t)));
}
function updateCameraPosition(e, t) {
  if (targetCameraPosition && isZoomedToMainStar && initialCameraPosition) {
    const t = Math.min(e, 0.1);
    if (zoomProgress < 1) {
      (zoomProgress += t / 3.6), zoomProgress > 1 && (zoomProgress = 1);
      const e = easeInOutCubic(zoomProgress);
      if (
        (camera.position.lerpVectors(
          initialCameraPosition,
          targetCameraPosition,
          e
        ),
        camera.lookAt(mainStar.position),
        camera.updateMatrixWorld(),
        mainStar.lookAt(camera.position),
        mainStar.updateMatrixWorld(),
        mainStar.material && mainStar.material.transparent)
      ) {
        const e = 1 - 1 / 3.6;
        if (zoomProgress >= e) {
          const t = (zoomProgress - e) / (1 - e),
            o = 1 - Math.pow(1 - t, 3),
            a = mainStar.userData.originalOpacity || 1;
          (mainStar.material.opacity = o * a),
            (mainStar.material.needsUpdate = !0),
            mainStar.userData.glowSprite &&
              ((mainStar.userData.glowSprite.material.opacity = o),
              (mainStar.userData.glowSprite.material.needsUpdate = !0)),
            mainStar.userData.lights &&
              mainStar.userData.originalLightIntensities &&
              mainStar.userData.lights.forEach((e, t) => {
                const a = mainStar.userData.originalLightIntensities[t] || 0;
                e.intensity = o * a;
              }),
            (loveText.visible = !0);
        }
      }
      if (zoomProgress >= 1) {
        console.log("Animation zoomtomanstar đã hoàn thành"),
          camera.position.copy(targetCameraPosition),
          mainStar.material &&
            ((mainStar.material.opacity =
              mainStar.userData.originalOpacity || 1),
            (mainStar.material.needsUpdate = !0),
            mainStar.userData.glowSprite &&
              ((mainStar.userData.glowSprite.material.opacity = 1),
              (mainStar.userData.glowSprite.material.needsUpdate = !0)),
            mainStar.userData.lights &&
              mainStar.userData.originalLightIntensities &&
              mainStar.userData.lights.forEach((e, t) => {
                e.intensity =
                  mainStar.userData.originalLightIntensities[t] || 0;
              }));
        const e = document.querySelector(".reaction-bar");
        e &&
          (e.classList.add("visible"),
          console.log("Reaction bar is now visible"));
      }
    }
  }
}
function updateMoonRotation(e) {
  if (targetMoonRotation && !isMoonRotating) {
    (moonRotationProgress += e / 3.6),
      moonRotationProgress > 1 && (moonRotationProgress = 1);
    const t = easeInOutCubic(moonRotationProgress);
    initialMoonRotation &&
      ((moon.rotation.x =
        initialMoonRotation.x +
        (targetMoonRotation.x - initialMoonRotation.x) * t),
      (moon.rotation.y =
        initialMoonRotation.y +
        (targetMoonRotation.y - initialMoonRotation.y) * t),
      (moon.rotation.z =
        initialMoonRotation.z +
        (targetMoonRotation.z - initialMoonRotation.z) * t)),
      moonRotationProgress >= 1 &&
        ((moon.rotation.x = targetMoonRotation.x),
        (moon.rotation.y = targetMoonRotation.y),
        (moon.rotation.z = targetMoonRotation.z),
        (moonRotationProgress = 1),
        log("Moon rotation complete"));
  }
}
function updateMoonTransparency(e) {
  moon &&
    moon.material &&
    moon.material.uniforms &&
    ((moon.material.uniforms.blendOpacity.value = Math.max(0, Math.min(1, e))),
    log("Moon transparency updated to:", e));
}
function updateLoveTextColor(e) {
  if (!loveText || !loveText.material || !loveText.material.userData) return;
  const t = loveText.material.userData,
    {
      canvas: o,
      ctx: a,
      color1: n,
      color2: i,
      lines: r,
      centerX: s,
      lineHeight: l,
      padding: d,
      pixelRatio: c,
      fontSize: m,
    } = t;
  if (t.isHolding)
    (t.holdTime += e),
      t.holdTime >= t.holdDuration &&
        ((t.holdTime = 0),
        (t.isHolding = !1),
        (t.transitionProgress = 0),
        (t.targetColor = t.currentColor === n ? i : n));
  else {
    (t.transitionProgress += e / t.transitionDuration),
      t.transitionProgress >= 1 &&
        ((t.transitionProgress = 1),
        (t.currentColor = t.targetColor),
        (t.isHolding = !0),
        (t.holdTime = 0));
    const n = t.transitionProgress,
      i = hexToRgb(t.currentColor),
      h = hexToRgb(t.targetColor),
      g = `rgb(${Math.round(i.r + (h.r - i.r) * n)}, ${Math.round(
        i.g + (h.g - i.g) * n
      )}, ${Math.round(i.b + (h.b - i.b) * n)})`;
    a.setTransform(1, 0, 0, 1, 0, 0),
      a.clearRect(0, 0, o.width, o.height),
      a.scale(c, c),
      (a.font = `bold ${m}px Comfortaa, Arial, "Segoe UI", sans-serif`),
      (a.textAlign = "center"),
      (a.textBaseline = "middle"),
      (a.fillStyle = g),
      (a.shadowColor = "rgba(255, 255, 255, 1.0)");
    let p = d + l / 2;
    for (const e of r)
      (a.shadowBlur = 64),
        a.fillText(e, s, p),
        (a.shadowBlur = 32),
        a.fillText(e, s, p),
        (p += l);
    loveText.material.map.needsUpdate = !0;
  }
}
function hexToRgb(e) {
  e = e.replace(/^#/, "");
  const t = parseInt(e, 16);
  return { r: (t >> 16) & 255, g: (t >> 8) & 255, b: 255 & t };
}
function animate() {
  requestAnimationFrame(animate);
  const e = Date.now(),
    t = (e - lastFrameTime) / 1e3;
  lastFrameTime = e;
  const o = clock ? clock.getElapsedTime() : 0;
  if (
    (updateCameraPosition(t, o),
    updateMoonRotation(t),
    mainStar && animateMainStarGlow(t, o),
    loveText && loveText.visible && updateLoveTextColor(t),
    loveText.lookAt(camera.position),
    isMoonRotating && moon && (moon.rotation.y += 0.2 * t),
    controls && controls.update(),
    scene.userData.updateFunctions)
  )
    for (let e = 0; e < scene.userData.updateFunctions.length; e++)
      scene.userData.updateFunctions[e]();
  renderer.render(scene, camera),
    controls &&
      ((controls.enabled = !(targetCameraPosition && zoomProgress < 1)),
      controls.update()),
    updateEmojiAnimations(t);
  for (let e = 0; e < stars.length; e++) {
    const t = stars[e],
      a = t.userData,
      n = a.pulseFactor + 0.2 * Math.sin(o * a.pulseSpeed);
    t.scale.set(n, n, n),
      (t.position.x = a.originalPosition.x + 0.3 * Math.sin(0.5 * o + e)),
      (t.position.y = a.originalPosition.y + 0.3 * Math.cos(0.5 * o + e));
  }
  renderer.render(scene, camera);
}
function easeInOutCubic(e) {
  const t = Math.min(1, 1.2 * e);
  return 1 - Math.pow(1 - t, 4);
}
function isObjectVisible(e, t) {
  if (!e || !t) return !1;
  const o = e.position.clone(),
    a = new THREE.Vector3(0, 0, -1).applyQuaternion(t.quaternion),
    n = o.sub(t.position),
    i = a.angleTo(n) * (180 / Math.PI);
  return n.dot(a) > 0 && i < 45;
}
function getVisibilityDetails(e, t) {
  if (!e)
    return {
      visible: !1,
      reason: "Object does not exist",
      inFront: !1,
      inFieldOfView: !1,
      angle: "N/A",
      distance: "N/A",
    };
  const o = e.position.clone(),
    a = t.position.clone();
  t.updateMatrixWorld();
  const n = new THREE.Vector3();
  n.setFromMatrixColumn(t.matrixWorld, 2).negate().normalize();
  const i = o.clone().sub(a),
    r = i.length(),
    s = i.clone().normalize().dot(n),
    l = s > 0,
    d = Math.acos(Math.min(Math.max(s, -1), 1)) * (180 / Math.PI),
    c = (t.fov, Math.PI, d < t.fov / 2);
  return {
    visible: (l && c) || !1 === e.frustumCulled,
    inFront: l,
    inFieldOfView: c,
    angle: d.toFixed(2),
    distance: r.toFixed(2),
    dotProduct: s.toFixed(2),
    frustumCulled: e.frustumCulled,
  };
}
function ensureMainStarVisibility() {
  if (!mainStar || !camera || !isZoomedToMainStar) return;
  if (!getVisibilityDetails(mainStar, camera).visible) {
    log(
      "WARNING: MainStar not visible! Adjusting camera position and orientation..."
    );
    moon.position.clone();
    const e = mainStar.position.clone();
    camera.position.set(0, 10, e.z + 3e3),
      camera.lookAt(e),
      camera.updateMatrixWorld();
    const t = new THREE.Vector3();
    t.setFromMatrixColumn(camera.matrixWorld, 2).negate().normalize();
    const o = mainStar.position.clone().sub(camera.position).normalize(),
      a = Math.acos(t.dot(o)) * (180 / Math.PI);
    log(
      "CRITICAL FIX: Camera now positioned IN FRONT OF MainStar looking directly at it"
    ),
      log("This ensures MainStar is in the center of the view"),
      log("New camera position:", camera.position),
      log("Camera is looking at:", e),
      log(
        "Angle between camera direction and direction to MainStar:",
        a.toFixed(2),
        "degrees"
      ),
      log(
        "Distance to MainStar:",
        mainStar.position.distanceTo(camera.position).toFixed(2)
      ),
      a > 10 &&
        (log(
          "WARNING: Camera not looking directly at MainStar. Correcting rotation..."
        ),
        camera.lookAt(mainStar.position),
        camera.updateMatrixWorld()),
      (mainStar.frustumCulled = !1),
      mainStar.material &&
        ((mainStar.material.depthTest = !1),
        (mainStar.material.depthWrite = !1),
        (mainStar.material.transparent = !0),
        (mainStar.material.opacity = 1),
        (mainStar.material.needsUpdate = !0)),
      log(
        "MainStar visibility settings updated: frustumCulled=false, renderOrder=9999, depthTest=false"
      );
  }
}
function getAdaptiveFontSize(e) {
  const t = Math.min(e.length, 100);
  if (t <= 10) return 52;
  const o = 52 - 34 * ((t - 10) / 90);
  return Math.max(18, Math.min(52, Math.round(o)));
}
function isMobileDevice() {
  return (
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    ) || window.innerWidth <= 768
  );
}
function wrapTextByWidth(e, t, o) {
  const a = t.split(" "),
    n = [];
  let i = "";
  for (const t of a) {
    const a = i ? i + " " + t : t;
    e.measureText(a).width > o
      ? i
        ? (n.push(i), (i = t))
        : (n.push(t), (i = ""))
      : (i = a);
  }
  return i && n.push(i), n;
}
function calculateTextLengthFactor(e, t = 18, o = 52, a) {
  const n = Math.min(e.length, 100);
  let i;
  if (n <= 25) i = Math.min(o / a, 1.5);
  else if (n <= 50) {
    i = 1.5 - 0.5 * ((n - 25) / 25);
  } else if (n <= 75) {
    i = 1 - 0.3 * ((n - 50) / 25);
  } else i = Math.max(t / a, 0.6);
  const r = a * i;
  return r > o ? o / a : r < t ? t / a : i;
}
function createLoveText() {
  console.log('[text love] Bắt đầu tạo text "Sao anh yêu em đến thế ❤️"');
  const e = '"Sao" anh yêu em nhiều đến thế ❤️',
    t = window.innerWidth,
    o = window.innerHeight,
    a = Math.min(window.devicePixelRatio, 2);
  let n, i;
  console.log(`[text love] Kích thước viewport: ${t}x${o}`),
    (n = t <= 375 ? 22 : t <= 768 ? 28 : t <= 1024 ? 32 : 36),
    (i = isMobileDevice() ? 0.8 * t : 614.4);
  const r = calculateTextLengthFactor(e, 18, 52, n),
    s = Math.round(n * r),
    l = document.createElement("canvas").getContext("2d", { alpha: !0 });
  l.font = `bold ${s}px Comfortaa, Arial, "Segoe UI", sans-serif`;
  const d = wrapTextByWidth(l, e, Math.min(0.8 * t, 600));
  console.log(`[text love] Text đã được chia thành ${d.length} dòng:`, d);
  let c = 0;
  for (const e of d) {
    const t = l.measureText(e).width;
    c = Math.max(c, t);
  }
  const m = 1.5 * s,
    h = m * d.length,
    g = document.createElement("canvas");
  (g.width = Math.ceil((c + 128) * a)), (g.height = Math.ceil((h + 128) * a));
  const p = g.getContext("2d", { alpha: !0 });
  p.clearRect(0, 0, g.width, g.height),
    p.scale(a, a),
    (p.font = `bold ${s}px Comfortaa, Arial, "Segoe UI", sans-serif`),
    (p.textAlign = "center"),
    (p.textBaseline = "middle");
  const u = "#f8e290",
    w = "#ffffff";
  (p.shadowBlur = 64),
    (p.shadowColor = "rgba(255, 255, 255, 1.0)"),
    (p.fillStyle = u);
  const S = (c + 128) / 2;
  let M = 64 + m / 2;
  for (const e of d)
    (p.shadowBlur = 64),
      p.fillText(e, S, M),
      (p.shadowBlur = 32),
      p.fillText(e, S, M),
      (M += m);
  try {
    const e = g.toDataURL("image/png");
    console.log(
      `[text love] Canvas có dữ liệu: ${
        e.length > 100 ? "Có" : "Không"
      }, độ dài: ${e.length}`
    );
  } catch (e) {
    console.error("[text love] Lỗi khi tạo dataURL:", e);
  }
  const f = new THREE.CanvasTexture(g);
  (f.minFilter = THREE.LinearFilter),
    (f.magFilter = THREE.LinearFilter),
    (f.encoding = THREE.sRGBEncoding),
    (f.generateMipmaps = !1),
    console.log(`[text love] Đã tạo texture: ${f.uuid}`);
  const E = new THREE.MeshBasicMaterial({
    map: f,
    transparent: !0,
    opacity: 1,
    depthWrite: !1,
    depthTest: !1,
    side: THREE.DoubleSide,
  });
  E.userData = {
    canvas: g,
    ctx: p,
    color1: u,
    color2: w,
    currentColor: u,
    targetColor: w,
    transitionProgress: 0,
    holdTime: 0,
    isHolding: !0,
    holdDuration: 3,
    transitionDuration: 3,
    lines: d,
    centerX: S,
    lineHeight: m,
    padding: 64,
    pixelRatio: a,
    fontSize: s,
  };
  const v = g.height / g.width;
  let T;
  T = t <= 768 ? 18 * Math.sqrt(d.length / 2) : 26 * Math.sqrt(d.length / 2);
  const x = T * v,
    b = new THREE.PlaneGeometry(T, x);
  return new THREE.Mesh(b, E);
}
function registerZoomToMainStarEvent() {
  document.getElementById("webgl-canvas").addEventListener("click", () => {
    log("Canvas clicked, zooming to the MainStar"), zoomToMainStar();
  });
}
let reactionArray = [];
function initReactions() {
  document.querySelectorAll(".reaction-item").forEach((e) => {
    e.addEventListener("click", function () {
      addReaction(this.getAttribute("data-emoji")),
        (this.style.transform = "scale(1.2)"),
        setTimeout(() => {
          this.style.transform = "scale(1)";
        }, 200);
    });
  }),
    console.log("Reaction handlers initialized");
}
function addReaction(e) {
  reactionArray.push(e),
    console.log("Added reaction:", e),
    console.log("Current reactions:", reactionArray);
  const t = event.currentTarget.getBoundingClientRect(),
    o = t.left + t.width / 2,
    a = window.innerWidth,
    n = (window.innerHeight, 20 * ((o / a) * 2 - 1));
  console.log("Emoji clicked at screen position:", o),
    console.log("Converted to world position X:", n),
    createEmojiObject(e, n);
}
function initEmojiSystem() {
  const e = new THREE.PlaneGeometry(32, 32),
    t = new THREE.MeshBasicMaterial({
      transparent: !0,
      side: THREE.DoubleSide,
      depthWrite: !1,
      depthTest: !1,
      alphaTest: 0.01,
      blending: THREE.NormalBlending,
      color: 16777215,
      premultipliedAlpha: !0,
      toneMapped: !1,
      fog: !1,
    });
  console.log("Created emoji material template with transparency settings"),
    (window.emojiGeometry = e),
    (window.emojiMaterialTemplate = t),
    (window.emojiTextureCache = window.emojiTextureCache || {}),
    console.log("Emoji texture cache initialized");
  const o = new THREE.Group();
  (o.name = "emojiGroup"),
    (o.renderOrder = 99999),
    mainStar && (o.position.z = mainStar.position.z + 10),
    scene.add(o),
    (window.emojiGroup = o),
    (window.emojiObjects = window.emojiObjects || []),
    console.log("Emoji system initialized with individual meshes"),
    console.log("emojiGroup added to scene:", scene.children.includes(o)),
    console.log(
      "emojiGroup position:",
      o.position.x,
      o.position.y,
      o.position.z
    );
}
function createEmojiTexture(e) {
  if (window.emojiTextureCache && window.emojiTextureCache[e])
    return (
      console.log("Using cached texture for emoji:", e),
      window.emojiTextureCache[e]
    );
  console.log("Creating new texture for emoji:", e);
  const t = document.createElement("canvas");
  (t.width = 256), (t.height = 256);
  const o = t.getContext("2d");
  o.clearRect(0, 0, t.width, t.height),
    (o.font =
      'bold 180px "Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", sans-serif'),
    (o.textAlign = "center"),
    (o.textBaseline = "middle"),
    o.fillText(e, t.width / 2, t.height / 2);
  const a = new THREE.CanvasTexture(t);
  return (
    (a.minFilter = THREE.LinearFilter),
    (a.magFilter = THREE.LinearFilter),
    (a.generateMipmaps = !1),
    (a.colorSpace = THREE.SRGBColorSpace),
    window.emojiTextureCache || (window.emojiTextureCache = {}),
    (window.emojiTextureCache[e] = a),
    console.log("Texture created and cached successfully with color emoji"),
    a
  );
}
function createEmojiObject(e, t = 0) {
  if (
    (console.log("createEmojiObject called with emoji:", e, "at worldX:", t),
    console.log("mainStar exists:", mainStar ? "Yes" : "No"),
    mainStar &&
      console.log(
        "mainStar position:",
        mainStar.position.x,
        mainStar.position.y,
        mainStar.position.z
      ),
    window.emojiObjects || (window.emojiObjects = []),
    window.emojiObjects.length >= 100)
  ) {
    console.log("Maximum emoji count reached, recycling oldest emoji");
    const e = window.emojiObjects.shift();
    e.mesh && e.mesh.parent && e.mesh.parent.remove(e.mesh), (e.active = !1);
  }
  if (
    !window.emojiGroup &&
    (console.error("Emoji system is not initialized! Initializing now..."),
    initEmojiSystem(),
    !window.emojiGroup)
  )
    return console.error("Failed to initialize emoji system!"), null;
  const o = createEmojiTexture(e),
    a = window.emojiMaterialTemplate.clone();
  (a.map = o), (a.needsUpdate = !0);
  const n = new THREE.Mesh(window.emojiGeometry, a);
  n.name = `emoji-${e}-${Date.now()}`;
  const i = THREE.MathUtils.degToRad(camera.fov),
    r = Math.abs((mainStar ? mainStar.position.z + 6 : 0) - camera.position.z),
    s = i / (camera.zoom || 1),
    l = 2 * Math.tan(s / 2) * r,
    d = l / window.innerHeight,
    c = (window.innerHeight / 2) * d;
  console.log("Camera zoom:", camera.zoom),
    console.log("Effective FOV (radians):", s),
    console.log("Distance to camera:", r),
    console.log("Screen height in world units:", l),
    console.log("Half screen height in world units:", c);
  const m = -100;
  console.log("Visible height at distance:", 380),
    console.log("Start Y position:", m),
    console.log("End Y position:", 90),
    console.log("Travel distance:", 190);
  const h = new THREE.Vector3(
    t + 5 * (Math.random() - 0.5),
    m,
    mainStar ? mainStar.position.z + 6 : 0
  );
  n.position.copy(h), window.emojiGroup.add(n);
  const g = {
    active: !0,
    mesh: n,
    position: n.position,
    rotation: n.rotation,
    scale: n.scale,
    opacity: 1,
    emoji: e,
    startTime: Date.now(),
    duration: 1e3 + 1e3 * Math.random(),
    startPosition: h,
    endPosition: new THREE.Vector3(
      t + 10 * (Math.random() - 0.5),
      90,
      mainStar ? mainStar.position.z + 6 : 0
    ),
    rotationSpeed: 0.05 * (Math.random() - 0.5),
  };
  return (
    window.emojiObjects.push(g),
    console.log(
      `Created emoji object: ${e}, total: ${window.emojiObjects.length}`
    ),
    console.log("Mesh added to scene:", n.parent === window.emojiGroup),
    g
  );
}
function updateEmojiAnimations(e) {
  if (
    !window.emojiGroup &&
    (console.log("updateEmojiAnimations: emojiGroup does not exist"),
    initEmojiSystem(),
    !window.emojiGroup)
  )
    return void console.error(
      "updateEmojiAnimations: Failed to initialize emojiGroup!"
    );
  window.emojiObjects || (window.emojiObjects = []);
  const t = Date.now();
  for (let e = window.emojiObjects.length - 1; e >= 0; e--) {
    const o = window.emojiObjects[e];
    if (!o || !o.active || !o.mesh) continue;
    const a = t - o.startTime,
      n = Math.min(1, a / o.duration),
      i = 8 * Math.sin(n * Math.PI * 2);
    o.mesh.position.lerpVectors(o.startPosition, o.endPosition, n),
      (o.mesh.position.x += i);
    const r = THREE.MathUtils.radToDeg(o.rotationSpeed || 0.05),
      s = (2 + 3 * Math.abs(r)) * Math.sin(n * Math.PI);
    if (((o.mesh.rotation.z = THREE.MathUtils.degToRad(s)), n > 0.7)) {
      const e = (n - 0.7) / 0.3,
        t = 1 - e * e * e;
      o.mesh.material.opacity = t;
      const a = 0.5 + 0.5 * t;
      o.mesh.scale.set(a, a, a);
    }
    n >= 1 &&
      ((o.active = !1),
      window.emojiGroup.remove(o.mesh),
      window.emojiObjects.splice(e, 1),
      console.log(
        "Removed completed emoji animation, remaining:",
        window.emojiObjects.length
      ));
  }
}
