/**
 * NHIEM VU BI MAT 20/10 — HOI CON TRAI 8B6
 * Interactive Experience Controller v3
 */

document.addEventListener('DOMContentLoaded', () => {
  // --- DOM Elements ---
  const audio = document.getElementById('bg-soundtrack');
  const btnAudioToggle = document.getElementById('btn-audio-toggle');
  const audioStatus = document.getElementById('audio-status');
  const btnRestart = document.getElementById('btn-restart');
  const btnStart = document.getElementById('btn-start');
  const btnMissionStart = document.getElementById('btn-mission-start');
  const btnStage2Next = document.getElementById('btn-stage2-next');
  const btnStage3Next = document.getElementById('btn-stage3-next');
  const btnOpenClover = document.getElementById('btn-open-clover');
  const btnReplayClover = document.getElementById('btn-replay-clover');

  const viewport = document.getElementById('app-viewport');
  const ambientBackdrop = document.getElementById('ambient-backdrop');
  const goldFlash = document.getElementById('gold-flash');
  const cloverBlackout = document.getElementById('clover-blackout');
  const interactionHint = document.getElementById('interaction-hint');

  const tinyFace = document.getElementById('tiny-face');
  const waguriVideo = document.getElementById('waguri-video');
  const canvasPetals = document.getElementById('canvas-petals');
  const canvasBgStars = document.getElementById('canvas-bg-stars');
  const canvasCloverOrbit = document.getElementById('canvas-clover-orbit');
  const cloverFireflyField = document.getElementById('clover-firefly-field');

  const lyricsZone = document.getElementById('lyrics-zone');
  const lyricLine1 = document.getElementById('lyric-line-1');
  const lyricLine2 = document.getElementById('lyric-line-2');

  const stages = [
    document.getElementById('stage-intro'),      // 0
    document.getElementById('stage-story-1'),    // 1
    document.getElementById('stage-story-2'),    // 2
    document.getElementById('stage-story-3'),    // 3
    document.getElementById('stage-waguri'),      // 4
    document.getElementById('stage-teaser'),     // 5
    document.getElementById('stage-clover')      // 6
  ];

  // Stages where clicking the background advances to next scene
  const clickableStages = new Set([0, 1, 4]);

  let currentStageIndex = 0;
  let isTransitioning = false;
  let audioPlaying = false;
  let blinkTimer = null;
  let fireflyInterval = null;
  let petalsRunning = false;
  let petalsAnimationId = null;
  let bgStarsAnimId = null;
  let cloverOrbitAnimId = null;
  let reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // --- Lyric Cues ---
  const lyricCues = [
    { time: 0.0, text: "chi biet noi cho em" },
    { time: 1.7, text: "nghe vay thoi" },
    { time: 3.4, text: "vi da lo yeu em roi" },
    { time: 6.3, text: "chang dam hua xa xoi" },
    { time: 9.7, text: "nguoi ta noi chang ai hieu" },
    { time: 13.1, text: "ve hai tieng thuong yeu" },
    { time: 16.0, text: "chang phai cu ben nhau" },
    { time: 18.1, text: "lam nhau kho dau la tinh yeu?" },
    { time: 22.8, text: "nhieu khi rat yeu nhau ma" },
    { time: 26.0, text: "phai dung o rat xa" },
    { time: 29.4, text: "nhin em hanh phuc ben ai chang phai minh" },
    { time: 33.4, text: "vi minh co lam duoc dau" }
  ];

  // =================== AUDIO ===================
  function initAudio() {
    if (!audio) return;
    audio.volume = 0.65;
    const p = audio.play();
    if (p !== undefined) {
      p.then(() => { audioPlaying = true; if (audioStatus) audioStatus.textContent = "Bat"; })
       .catch(() => { audioPlaying = false; if (audioStatus) audioStatus.textContent = "Tat"; });
    }
  }

  function toggleAudio(e) {
    if (e) e.stopPropagation();
    if (!audio) return;
    if (audio.paused) {
      audio.play().then(() => { audioPlaying = true; if (audioStatus) audioStatus.textContent = "Bat"; }).catch(() => {});
    } else {
      audio.pause();
      audioPlaying = false;
      if (audioStatus) audioStatus.textContent = "Tat";
    }
  }
  if (btnAudioToggle) btnAudioToggle.addEventListener('click', toggleAudio);

  let lastLyricIndex = -1;
  if (audio) {
    audio.addEventListener('timeupdate', () => {
      if (currentStageIndex !== 4) return;
      const t = audio.currentTime;
      let activeIndex = -1;
      for (let i = lyricCues.length - 1; i >= 0; i--) {
        if (t >= lyricCues[i].time) { activeIndex = i; break; }
      }
      if (activeIndex !== -1 && activeIndex !== lastLyricIndex) {
        lastLyricIndex = activeIndex;
        if (activeIndex % 2 === 0) {
          if (lyricLine1) { lyricLine1.textContent = lyricCues[activeIndex].text; lyricLine1.style.opacity = '1'; }
        } else {
          if (lyricLine2) { lyricLine2.textContent = lyricCues[activeIndex].text; lyricLine2.style.opacity = '1'; }
        }
      }
    });
  }

  // =================== TINY BLINK ===================
  function startBlinking() {
    stopBlinking();
    if (reducedMotion) return;
    function triggerBlink() {
      if (tinyFace && !tinyFace.classList.contains('mode-clover')) {
        tinyFace.classList.add('blinking');
        setTimeout(() => tinyFace.classList.remove('blinking'), 180);
      }
      blinkTimer = setTimeout(triggerBlink, 2200 + Math.random() * 2600);
    }
    blinkTimer = setTimeout(triggerBlink, 1500);
  }

  function stopBlinking() {
    if (blinkTimer) { clearTimeout(blinkTimer); blinkTimer = null; }
  }

  // =================== STAGE MANAGEMENT ===================
  function goToStage(index) {
    if (index < 0 || index >= stages.length || isTransitioning) return;
    isTransitioning = true;

    const prevStage = stages[currentStageIndex];
    if (prevStage) prevStage.classList.remove('active-stage');

    currentStageIndex = index;
    setupSceneSpecifics(index);

    setTimeout(() => {
      const nextStage = stages[index];
      if (nextStage) nextStage.classList.add('active-stage');
      isTransitioning = false;
    }, 420);
  }

  function setupSceneSpecifics(idx) {
    // Reset shared states
    if (idx !== 3) {
      canvasPetals.classList.remove('active');
      stopPetals();
    }
    if (idx !== 4) {
      lyricsZone.classList.remove('active');
    }
    if (idx !== 6) {
      stopFireflies();
      stopCloverOrbit();
    }
    if (idx !== 4 && waguriVideo) {
      waguriVideo.pause();
      if (idx === 0) waguriVideo.currentTime = 0;
    }

    // STAGE 0: Intro — no Tiny, no particles
    if (idx === 0) {
      if (tinyFace) tinyFace.className = 'tiny-face';
      stopBlinking();
      ambientBackdrop.classList.remove('clover-mode');
      cloverBlackout.classList.remove('active');
      goldFlash.classList.remove('active');
      if (interactionHint) interactionHint.classList.remove('visible');
      startBgStars();
    }

    // STAGE 1: Tiny greets — Tiny is at bottom-center, dialogue is right side
    else if (idx === 1) {
      initAudio();
      if (tinyFace) tinyFace.className = 'tiny-face visible in-stage1';
      startBlinking();
      if (interactionHint) interactionHint.classList.remove('visible');
      ambientBackdrop.classList.remove('clover-mode');
    }

    // STAGE 2: Mission 01 Teacher — Tiny is small, bottom-left corner
    else if (idx === 2) {
      if (tinyFace) tinyFace.className = 'tiny-face visible in-corner-bl blushing';
      startBlinking();
      goldFlash.classList.remove('active');
      if (interactionHint) interactionHint.classList.remove('visible');
    }

    // STAGE 3: Mission 02 Girls — petals fall, Tiny is small bottom-left
    else if (idx === 3) {
      if (tinyFace) tinyFace.className = 'tiny-face visible in-corner-bl blushing show-mouth';
      goldFlash.classList.add('active');
      canvasPetals.classList.add('active');
      startPetals();
      if (interactionHint) interactionHint.classList.remove('visible');
    }

    // STAGE 4: Waguri — Tiny small at top-left of wish card area
    else if (idx === 4) {
      goldFlash.classList.remove('active');
      if (tinyFace) tinyFace.className = 'tiny-face visible in-waguri blushing mode-smile';
      lyricsZone.classList.add('active');
      if (interactionHint) interactionHint.classList.add('visible');
      if (waguriVideo) {
        waguriVideo.play().catch(e => {
          console.log('Waguri play err:', e);
          const fb = document.querySelector('.waguri-fallback');
          if (fb) fb.classList.add('show');
        });
      }
    }

    // STAGE 5: Teaser — Tiny is in middle, special position
    else if (idx === 5) {
      if (tinyFace) tinyFace.className = 'tiny-face visible in-teaser blushing';
      startBlinking();
      cloverBlackout.classList.remove('active');
      ambientBackdrop.classList.remove('clover-mode');
      if (interactionHint) interactionHint.classList.remove('visible');
    }

    // STAGE 6: Clover finale — Tiny at safe top-right corner only
    else if (idx === 6) {
      ambientBackdrop.classList.add('clover-mode');
      cloverBlackout.classList.add('active');
      if (tinyFace) tinyFace.className = 'tiny-face visible in-clover blushing mode-clover';
      stopBlinking();
      startFireflies();
      startCloverOrbit();
      if (interactionHint) interactionHint.classList.remove('visible');
    }
  }

  function nextStage() {
    if (currentStageIndex < stages.length - 1) {
      goToStage(currentStageIndex + 1);
    }
  }

  function restartExperience(e) {
    if (e) e.stopPropagation();
    // Reset lyric state
    lastLyricIndex = -1;
    if (lyricLine1) { lyricLine1.textContent = ''; lyricLine1.style.opacity = '0'; }
    if (lyricLine2) { lyricLine2.textContent = ''; lyricLine2.style.opacity = '0'; }
    goToStage(0);
  }

  // =================== CANVAS: BG STARS ===================
  function startBgStars() {
    if (!canvasBgStars || reducedMotion) return;
    stopBgStars();
    const canvas = canvasBgStars;
    const ctx = canvas.getContext('2d');
    let W = window.innerWidth, H = window.innerHeight;
    const dpr = window.devicePixelRatio || 1;

    function resize() {
      W = window.innerWidth; H = window.innerHeight;
      canvas.width = W * dpr; canvas.height = H * dpr;
      canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
      ctx.scale(dpr, dpr);
    }
    resize();
    window.addEventListener('resize', resize);

    const starCount = W < 600 ? 60 : 120;
    const stars = Array.from({ length: starCount }, () => ({
      x: Math.random() * W, y: Math.random() * H,
      r: 0.5 + Math.random() * 1.5,
      alpha: 0.3 + Math.random() * 0.7,
      speed: 0.001 + Math.random() * 0.003,
      phase: Math.random() * Math.PI * 2
    }));

    let t = 0;
    function draw() {
      bgStarsAnimId = requestAnimationFrame(draw);
      ctx.clearRect(0, 0, W, H);
      t += 0.016;
      for (const s of stars) {
        const a = s.alpha * (0.6 + 0.4 * Math.sin(t * s.speed * 60 + s.phase));
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,240,220,${a})`;
        ctx.fill();
      }
    }
    draw();
  }

  function stopBgStars() {
    if (bgStarsAnimId) { cancelAnimationFrame(bgStarsAnimId); bgStarsAnimId = null; }
  }

  // =================== CANVAS: FALLING PETALS ===================
  function startPetals() {
    if (petalsRunning || reducedMotion) return;
    petalsRunning = true;
    const ctx = canvasPetals.getContext('2d');
    let W = window.innerWidth, H = window.innerHeight;
    const dpr = window.devicePixelRatio || 1;

    function resize() {
      W = window.innerWidth; H = window.innerHeight;
      canvasPetals.width = W * dpr; canvasPetals.height = H * dpr;
      canvasPetals.style.width = W + 'px'; canvasPetals.style.height = H + 'px';
      ctx.scale(dpr, dpr);
    }
    resize();
    window.addEventListener('resize', resize);

    const count = W <= 600 ? 28 : 55;
    class Petal {
      constructor() { this.reset(true); }
      reset(init = false) {
        this.x = Math.random() * W;
        this.y = init ? Math.random() * H : -30;
        this.size = 8 + Math.random() * 12;
        this.vy = 1.0 + Math.random() * 1.8;
        this.vx = -0.8 + Math.random() * 1.6;
        this.angle = Math.random() * Math.PI * 2;
        this.spin = (Math.random() - 0.5) * 0.04;
        this.opacity = 0.45 + Math.random() * 0.45;
        this.color = Math.random() > 0.45 ? 'rgba(255,130,190,' : 'rgba(240,180,210,';
      }
      update() {
        this.y += this.vy;
        this.x += this.vx + Math.sin(this.angle) * 0.7;
        this.angle += this.spin;
        if (this.y > H + 20 || this.x < -50 || this.x > W + 50) this.reset();
      }
      draw(c) {
        c.save();
        c.translate(this.x, this.y);
        c.rotate(this.angle);
        c.fillStyle = `${this.color}${this.opacity})`;
        c.beginPath();
        c.moveTo(0, 0);
        c.bezierCurveTo(this.size * 0.6, -this.size * 0.5, this.size * 0.8, this.size * 0.5, 0, this.size);
        c.bezierCurveTo(-this.size * 0.8, this.size * 0.5, -this.size * 0.6, -this.size * 0.5, 0, 0);
        c.fill();
        c.restore();
      }
    }
    const petals = Array.from({ length: count }, () => new Petal());

    function animate() {
      if (!petalsRunning) return;
      ctx.clearRect(0, 0, W, H);
      for (const p of petals) { p.update(); p.draw(ctx); }
      petalsAnimationId = requestAnimationFrame(animate);
    }
    animate();
  }

  function stopPetals() {
    petalsRunning = false;
    if (petalsAnimationId) { cancelAnimationFrame(petalsAnimationId); petalsAnimationId = null; }
    const ctx = canvasPetals && canvasPetals.getContext('2d');
    if (ctx) ctx.clearRect(0, 0, canvasPetals.width, canvasPetals.height);
  }

  // =================== FIREFLIES ===================
  function startFireflies() {
    stopFireflies();
    if (!cloverFireflyField || reducedMotion) return;
    fireflyInterval = setInterval(() => {
      if (currentStageIndex !== 6) return;
      const ff = document.createElement('div');
      ff.className = 'clover-firefly';
      const baseLeft = window.innerWidth > 900 ? 25 : 50;
      ff.style.left = (baseLeft + (Math.random() - 0.5) * 28) + '%';
      ff.style.top = (30 + Math.random() * 35) + '%';
      const sz = 3 + Math.random() * 5;
      ff.style.width = sz + 'px'; ff.style.height = sz + 'px';
      cloverFireflyField.appendChild(ff);
      setTimeout(() => { if (ff.parentNode) ff.parentNode.removeChild(ff); }, 4800);
    }, 260);
  }

  function stopFireflies() {
    if (fireflyInterval) { clearInterval(fireflyInterval); fireflyInterval = null; }
    if (cloverFireflyField) cloverFireflyField.innerHTML = '';
  }

  // =================== CLOVER ORBIT PARTICLES ===================
  function startCloverOrbit() {
    if (!canvasCloverOrbit || reducedMotion) return;
    stopCloverOrbit();
    const canvas = canvasCloverOrbit;
    const ctx = canvas.getContext('2d');
    let W = window.innerWidth, H = window.innerHeight;
    const dpr = window.devicePixelRatio || 1;

    function resize() {
      W = window.innerWidth; H = window.innerHeight;
      canvas.width = W * dpr; canvas.height = H * dpr;
      canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
      ctx.scale(dpr, dpr);
    }
    resize();

    // Clover center is roughly 25% from left on desktop, 50% on mobile
    const getCX = () => W > 900 ? W * 0.24 : W * 0.5;
    const getCY = () => H * 0.42;

    const orbitParticles = Array.from({ length: 28 }, (_, i) => ({
      angle: (i / 28) * Math.PI * 2,
      radius: 55 + Math.random() * 45,
      speed: 0.003 + Math.random() * 0.005,
      size: 1.5 + Math.random() * 2.5,
      alpha: 0.4 + Math.random() * 0.5,
      hue: 120 + Math.random() * 60
    }));

    let t = 0;
    function draw() {
      cloverOrbitAnimId = requestAnimationFrame(draw);
      ctx.clearRect(0, 0, W, H);
      t += 0.016;
      const cx = getCX(), cy = getCY();

      // Breathe glow
      const breathe = 0.3 + 0.2 * Math.sin(t * 1.2);
      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 120);
      grad.addColorStop(0, `rgba(79,238,134,${breathe * 0.25})`);
      grad.addColorStop(1, 'rgba(79,238,134,0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(cx, cy, 120, 0, Math.PI * 2);
      ctx.fill();

      // Orbit particles
      for (const p of orbitParticles) {
        p.angle += p.speed;
        const px = cx + Math.cos(p.angle) * p.radius;
        const py = cy + Math.sin(p.angle) * p.radius * 0.55;
        const a = p.alpha * (0.5 + 0.5 * Math.sin(t * 2 + p.angle));
        ctx.beginPath();
        ctx.arc(px, py, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${p.hue},90%,70%,${a})`;
        ctx.fill();
      }
    }
    draw();
  }

  function stopCloverOrbit() {
    if (cloverOrbitAnimId) { cancelAnimationFrame(cloverOrbitAnimId); cloverOrbitAnimId = null; }
    if (canvasCloverOrbit) {
      const ctx = canvasCloverOrbit.getContext('2d');
      ctx.clearRect(0, 0, canvasCloverOrbit.width, canvasCloverOrbit.height);
    }
  }

  // =================== EVENT LISTENERS ===================

  // Button: Start (Stage 0 -> 1)
  if (btnStart) btnStart.addEventListener('click', (e) => { e.stopPropagation(); goToStage(1); });

  // Button: Mission Start (Stage 1 -> 2)
  if (btnMissionStart) btnMissionStart.addEventListener('click', (e) => { e.stopPropagation(); goToStage(2); });

  // Button: Stage 2 Next (Stage 2 -> 3)
  if (btnStage2Next) btnStage2Next.addEventListener('click', (e) => { e.stopPropagation(); goToStage(3); });

  // Button: Stage 3 Next (Stage 3 -> 4)
  if (btnStage3Next) btnStage3Next.addEventListener('click', (e) => { e.stopPropagation(); goToStage(4); });

  // Button: Open Clover (Stage 5 -> 6)
  if (btnOpenClover) btnOpenClover.addEventListener('click', (e) => { e.stopPropagation(); goToStage(6); });

  // Button: Restart
  if (btnRestart) btnRestart.addEventListener('click', restartExperience);
  if (btnReplayClover) btnReplayClover.addEventListener('click', restartExperience);

  // Viewport tap: only advance on tappable stages
  viewport.addEventListener('click', (e) => {
    if (e.target.closest('button, .wish-card, .clover-card-container, .wish-card-container, .mission-card-col')) return;
    if (clickableStages.has(currentStageIndex)) nextStage();
  });

  // Keyboard
  document.addEventListener('keydown', (e) => {
    if (['Space', 'ArrowRight', 'Enter'].includes(e.code)) {
      if (clickableStages.has(currentStageIndex)) nextStage();
    }
  });

  // =================== INIT ===================
  goToStage(0);
});
