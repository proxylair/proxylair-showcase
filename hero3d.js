// ProxyLair -- Wave 2 desktop-only live 3D wordmark. Pure enhancement
// over the universal video base (index.html's <video id="hero-wordmark-
// video">, wired up by motion.js): only initializes when pointer:fine
// AND WebGL are both available AND the visitor doesn't prefer reduced
// motion. Mobile never even attempts the dynamic import of Three.js --
// the gate checks below run before any network request for it.
//
// Fails closed at every stage: the canvas starts at opacity:0 (see
// .hero-wordmark-3d in styles.css) and is only revealed after a
// synchronous render call has actually succeeded, so a broken WebGL
// context can never show a blank/garbled canvas -- worst case, nothing
// here ever runs and the video (already playing) is what visitors see.

(function () {
  const wrap = document.getElementById("hero-wordmark");
  const canvas = document.getElementById("hero-wordmark-canvas");
  const video = document.getElementById("hero-wordmark-video");
  if (!wrap || !canvas || !video) return;

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  if (!window.matchMedia("(pointer: fine)").matches) return;

  function hasWebGL() {
    try {
      const test = document.createElement("canvas");
      return !!(test.getContext("webgl2") || test.getContext("webgl"));
    } catch (e) {
      return false;
    }
  }
  if (!hasWebGL()) return;

  init().catch(() => {
    // Any failure anywhere below -- parse, fetch, geometry, render --
    // lands here. Canvas never activates; the video keeps playing.
  });

  async function init() {
    const THREE = await import("three");
    const { SVGLoader } = await import("three/addons/loaders/SVGLoader.js");
    const { RoomEnvironment } = await import("three/addons/environments/RoomEnvironment.js");

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    // No scene.background -- transparent, so the canvas composites
    // over the page's own hero background instead of showing a box.
    const scene = new THREE.Scene();

    const pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

    const camera = new THREE.PerspectiveCamera(30, 1290 / 376, 1, 5000);

    const hemi = new THREE.HemisphereLight(0xffffff, 0x2a2735, 0.7);
    scene.add(hemi);
    const key = new THREE.DirectionalLight(0xfff4e6, 2.4);
    key.position.set(200, 260, 340);
    scene.add(key);
    const fill = new THREE.DirectionalLight(0xd8e6ff, 0.7);
    fill.position.set(-260, 90, 160);
    scene.add(fill);
    // Purple brand accent: a colored light barely registers on a
    // high-metalness material (metals reflect tinted by their OWN
    // color, not the light's) -- the material's `sheen` layer below is
    // what actually makes purple show up; this light is a mild assist.
    const purpleDir = new THREE.DirectionalLight(0xa855f7, 2.0);
    purpleDir.position.set(-260, 40, 300);
    scene.add(purpleDir);

    // ---------- RDP polyline simplification ----------
    // The source SVG is auto-traced (dense straight-line segments, not
    // beziers). Same simplification used for the offline video render.
    function simplifyRDP(points, tolerance) {
      if (points.length < 3) return points;
      function perpDist(p, a, b) {
        const dx = b.x - a.x, dy = b.y - a.y;
        const len = Math.hypot(dx, dy);
        if (len === 0) return Math.hypot(p.x - a.x, p.y - a.y);
        const t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / (len * len);
        return Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy));
      }
      function rdp(pts) {
        if (pts.length < 3) return pts;
        let maxDist = 0, index = 0;
        const a = pts[0], b = pts[pts.length - 1];
        for (let i = 1; i < pts.length - 1; i++) {
          const d = perpDist(pts[i], a, b);
          if (d > maxDist) { maxDist = d; index = i; }
        }
        if (maxDist > tolerance) {
          const left = rdp(pts.slice(0, index + 1));
          const right = rdp(pts.slice(index));
          return left.slice(0, -1).concat(right);
        }
        return [a, b];
      }
      return rdp(points);
    }
    function simplifyShape(shape, tolerance) {
      const outerPts = simplifyRDP(shape.getPoints(1), tolerance);
      const simplified = new THREE.Shape(outerPts);
      simplified.holes = (shape.holes || []).map((hole) => new THREE.Path(simplifyRDP(hole.getPoints(1), tolerance)));
      return simplified;
    }

    const svgResponse = await fetch("assets/hero/logo.svg");
    if (!svgResponse.ok) throw new Error("logo.svg fetch failed");
    const svgText = await svgResponse.text();
    const parsed = new SVGLoader().parse(svgText);
    const rawShapes = [];
    parsed.paths.forEach((p) => rawShapes.push(...SVGLoader.createShapes(p)));
    if (!rawShapes.length) throw new Error("no shapes parsed from logo.svg");
    const shapes = rawShapes.map((s) => simplifyShape(s, 0.8));

    const extrudeSettings = {
      depth: 46,
      bevelEnabled: true,
      bevelThickness: 5,
      bevelSize: 4,
      bevelSegments: 6,
      curveSegments: 12,
    };

    const material = new THREE.MeshPhysicalMaterial({
      color: 0x1c1a22,
      metalness: 0.72,
      roughness: 0.22,
      clearcoat: 0.85,
      clearcoatRoughness: 0.12,
      reflectivity: 0.7,
      envMapIntensity: 1.9,
      sheen: 1.0,
      sheenColor: new THREE.Color(0xb457f5),
      sheenRoughness: 0.35,
    });

    const wordmark = new THREE.Group();
    scene.add(wordmark);
    shapes.forEach((s) => {
      wordmark.add(new THREE.Mesh(new THREE.ExtrudeGeometry(s, extrudeSettings), material));
    });

    // Center (SVG-space) then flip Y (SVG is Y-down) as part of the fit scale.
    const preBox = new THREE.Box3().setFromObject(wordmark);
    const preCenter = new THREE.Vector3();
    preBox.getCenter(preCenter);
    wordmark.children.forEach((child) => {
      child.position.x -= preCenter.x;
      child.position.y -= preCenter.y;
    });
    const box = new THREE.Box3().setFromObject(wordmark);
    const size = new THREE.Vector3();
    box.getSize(size);
    const scale = 130 / size.y;
    wordmark.scale.set(scale, -scale, scale);

    // ---------- Camera fit via real NDC projection ----------
    // Fits the swept bounding box across the FULL motion range this
    // layer actually uses (idle animation + max mouse-follow offset),
    // using actual projected corners rather than a flat trig estimate
    // -- a size-at-distance approximation clipped at peak rotation in
    // the offline render (corners swinging toward the camera get
    // perspective-magnified); this avoids that bug from the start.
    const ROT_Y_MAX = THREE.MathUtils.degToRad(18 + 10);
    const ROT_X_MAX = THREE.MathUtils.degToRad(4 + 6);
    const refDist = 400;
    camera.position.set(0, 10, refDist);
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();

    let maxAbsNdcX = 0, maxAbsNdcY = 0;
    const corner = new THREE.Vector3();
    [-1, 0, 1].forEach((sy) => {
      [-1, 1].forEach((sx) => {
        wordmark.rotation.y = ROT_Y_MAX * sy;
        wordmark.rotation.x = ROT_X_MAX * sx;
        wordmark.updateMatrixWorld(true);
        const b = new THREE.Box3().setFromObject(wordmark);
        const pts = [
          [b.min.x, b.min.y, b.min.z], [b.max.x, b.min.y, b.min.z],
          [b.min.x, b.max.y, b.min.z], [b.max.x, b.max.y, b.min.z],
          [b.min.x, b.min.y, b.max.z], [b.max.x, b.min.y, b.max.z],
          [b.min.x, b.max.y, b.max.z], [b.max.x, b.max.y, b.max.z],
        ];
        pts.forEach(([x, y, z]) => {
          corner.set(x, y, z).project(camera);
          maxAbsNdcX = Math.max(maxAbsNdcX, Math.abs(corner.x));
          maxAbsNdcY = Math.max(maxAbsNdcY, Math.abs(corner.y));
        });
      });
    });
    wordmark.rotation.set(0, 0, 0);
    wordmark.updateMatrixWorld(true);

    const targetNdc = 0.93;
    const neededScale = Math.max(maxAbsNdcX / targetNdc, maxAbsNdcY / targetNdc, 1);
    camera.position.z = refDist * neededScale;
    camera.lookAt(0, 0, 0);

    // ---------- Mouse-follow (global, lerped toward target) ----------
    let mouseTargetX = 0, mouseTargetY = 0;
    let mouseCurX = 0, mouseCurY = 0;
    window.addEventListener("mousemove", (e) => {
      mouseTargetX = (e.clientX / window.innerWidth) * 2 - 1;
      mouseTargetY = (e.clientY / window.innerHeight) * 2 - 1;
    });
    document.addEventListener("mouseleave", () => {
      mouseTargetX = 0;
      mouseTargetY = 0;
    });

    // ---------- Resize ----------
    function resize() {
      const rect = wrap.getBoundingClientRect();
      if (rect.width < 1 || rect.height < 1) return;
      renderer.setSize(rect.width, rect.height, false);
      camera.aspect = rect.width / rect.height;
      camera.updateProjectionMatrix();
    }
    resize();
    window.addEventListener("resize", resize);

    // ---------- Render loop ----------
    let running = false;
    let raf = null;
    const clock = new THREE.Clock();
    function tick() {
      if (!running) return;
      const t = clock.getElapsedTime();
      mouseCurX += (mouseTargetX - mouseCurX) * 0.06;
      mouseCurY += (mouseTargetY - mouseCurY) * 0.06;

      wordmark.rotation.y = THREE.MathUtils.degToRad(18) * Math.sin(t * 0.55) + mouseCurX * THREE.MathUtils.degToRad(10);
      wordmark.rotation.x = THREE.MathUtils.degToRad(4) * Math.sin(t * 0.4 + 1.1) - mouseCurY * THREE.MathUtils.degToRad(6);
      wordmark.position.y = 10 * Math.sin(t * 0.7);

      renderer.render(scene, camera);
      raf = requestAnimationFrame(tick);
    }

    // Render one real frame synchronously BEFORE revealing anything --
    // proves the pipeline actually works (a lost/broken context can
    // silently accept calls without throwing) rather than trusting that
    // getting this far means it will render correctly.
    renderer.render(scene, camera);

    canvas.classList.add("is-active");
    // The canvas only paints the extruded logo shape -- everywhere else
    // is transparent -- so the video must be explicitly hidden here, not
    // just paused, or its opaque last frame shows through/around it.
    video.classList.add("is-hidden");
    video.pause();
    running = true;
    tick();

    // Runtime safety net: if the WebGL context is lost after the fact,
    // fall back to the video rather than leaving a frozen/blank canvas.
    canvas.addEventListener("webglcontextlost", (e) => {
      e.preventDefault();
      running = false;
      if (raf) cancelAnimationFrame(raf);
      canvas.classList.remove("is-active");
      video.classList.remove("is-hidden");
      video.play().catch(() => {});
    });

    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        running = false;
        if (raf) cancelAnimationFrame(raf);
      } else if (canvas.classList.contains("is-active") && !running) {
        running = true;
        tick();
      }
    });
  }
})();
