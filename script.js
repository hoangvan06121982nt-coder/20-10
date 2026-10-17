/**
 * Ngày mai là 20/10 rồi đấy! 🍀
 * Món quà bí mật từ Hội Con Trai 8B6
 * Interactive Experience Controller v5 (8 Scenes)
 */

document.addEventListener('DOMContentLoaded', () => {
  // --- DOM Elements ---
  const audio = document.getElementById('bg-soundtrack');
  const btnAudioToggle = document.getElementById('btn-audio-toggle');
  const audioStatus = document.getElementById('audio-status');
  const btnRestart = document.getElementById('btn-restart');

  // Scene navigation buttons
  const btnScene1Next = document.getElementById('btn-scene1-next');
  const btnScene2Next = document.getElementById('btn-scene2-next');
  const btnScene3Next = document.getElementById('btn-scene3-next');
  const btnOpenEnvelope = document.getElementById('btn-open-envelope');
  const glowingEnvelopeBox = document.getElementById('glowing-envelope-box');
  const btnScene5Next = document.getElementById('btn-scene5-next');
  const btnScene6Next = document.getElementById('btn-scene6-next');
  const btnScene7Next = document.getElementById('btn-scene7-next');
  const btnMakeWish = document.getElementById('btn-make-wish');
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
  const cloverSvgElem = document.getElementById('clover-svg-elem');
  const wishFeedbackToast = document.getElementById('wish-feedback-toast');

  const lyricsZone = document.getElementById('lyrics-zone');
  const lyricLine1 = document.getElementById('lyric-line-1');
  const lyricLine2 = document.getElementById('lyric-line-2');

  const stages = [
    document.getElementById('stage-scene-1'), // 0: Cảnh 1 - Tiny xuất hiện & giới thiệu
    document.getElementById('stage-scene-2'), // 1: Cảnh 2 - Ngày mai là 20/10
    document.getElementById('stage-scene-3'), // 2: Cảnh 3 - Tiny ngại ngùng, hiệu ứng ngôi sao
    document.getElementById('stage-scene-4'), // 3: Cảnh 4 - Bật mí món quà (phong thư)
    document.getElementById('stage-scene-5'), // 4: Cảnh 5 - Mở thư & gửi lời chúc cô Phú
    document.getElementById('stage-scene-6'), // 5: Cảnh 6 - Lời chúc các bạn nữ 8B6
    document.getElementById('stage-scene-7'), // 6: Cảnh 7 - Video Waguri & khoảnh khắc dễ thương
    document.getElementById('stage-scene-8')  // 7: Cảnh 8 - Kết thúc với cỏ bốn lá
  ];

  // Stages where tapping viewport advances
  const clickableStages = new Set([0, 1, 2, 6]);

  let currentStageIndex = 0;
  let isTransitioning = false;
  let audioPlaying = false;
  let blinkTimer = null;
  let fireflyInterval = null;
  let petalsRunning = false;
  let petalsAnimationId = null;
  let bgStarsAnimId = null;
  let cloverOrbitAnimId = null;
  let audioFadeInterval = null;
  let reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // --- Lyric Cues (for Scene 7 - Waguri) ---
  const lyricCues = [
    { time: 0.0, text: "chỉ biết nói cho em" },
    { time: 1.7, text: "nghe vậy thôi" },
    { time: 3.4, text: "vì đã lỡ yêu em rồi" },
    { time: 6.3, text: "chẳng dám hứa xa xôi" },
    { time: 9.7, text: "người ta nói chẳng ai hiểu" },
    { time: 13.1, text: "về hai tiếng thương yêu" },
    { time: 16.0, text: "chẳng phải cứ bên nhau" },
    { time: 18.1, text: "làm nhau khổ đau là tình yêu?" },
    { time: 22.8, text: "nhiều khi rất yêu nhau mà" },
    { time: 26.0, text: "phải đứng ở rất xa" },
    { time: 29.4, text: "nhìn em hạnh phúc bên ai chẳng phải mình" },
    { time: 33.4, text: "vì mình có làm được đâu" }
  ];

  // =================== AUDIO ENGINE ===================
  function initAudio() {
    if (!audio) return;
    if (audioPlaying) return;
    audio.volume = 0.65;
    const p = audio.play();
    if (p !== undefined) {
      p.then(() => {
        audioPlaying = true;
        if (audioStatus) audioStatus.textContent = "Bật";
      }).catch(() => {
        audioPlaying = false;
        if (audioStatus) audioStatus.textContent = "Tắt";
      });
    }
  }

  function toggleAudio(e) {
    if (e) e.stopPropagation();
    if (!audio) return;
    if (audio.paused) {
      audio.play().then(() => {
        audioPlaying = true;
        if (audioStatus) audioStatus.textContent = "Bật";
      }).catch(() => {});
    } else {
      audio.pause();
      audioPlaying = false;
      if (audioStatus) audioStatus.textContent = "Tắt";
    }
  }
  if (btnAudioToggle) btnAudioToggle.addEventListener('click', toggleAudio);

  function fadeAudioVolume(targetVol, durationMs = 800) {
    if (!audio || !audioPlaying) return;
    if (audioFadeInterval) clearInterval(audioFadeInterval);
    const startVol = audio.volume;
    const diff = targetVol - startVol;
    const steps = 20;
    const stepTime = durationMs / steps;
    let curStep = 0;
    audioFadeInterval = setInterval(() => {
      curStep++;
      const nextVol = startVol + diff * (curStep / steps);
      audio.volume = Math.max(0, Math.min(1, nextVol));
      if (curStep >= steps) {
        clearInterval(audioFadeInterval);
        audioFadeInterval = null;
      }
    }, stepTime);
  }

  let lastLyricIndex = -1;
  if (audio) {
    audio.addEventListener('timeupdate', () => {
      if (currentStageIndex !== 6) return; // Scene 7
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

  // =================== TINY BLINK ENGINE ===================
  function startBlinking() {
    stopBlinking();
    if (reducedMotion) return;
    function triggerBlink() {
      if (tinyFace && !tinyFace.classList.contains('mode-clover') && !tinyFace.classList.contains('mode-wink')) {
        tinyFace.classList.add('blinking');
        setTimeout(() => {
          if (tinyFace) tinyFace.classList.remove('blinking');
        }, 180);
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

    initAudio();

    const prevStage = stages[currentStageIndex];
    if (prevStage) prevStage.classList.remove('active-stage');

    currentStageIndex = index;
    setupSceneSpecifics(index);

    setTimeout(() => {
      const nextStage = stages[index];
      if (nextStage) {
        nextStage.classList.add('active-stage');
        nextStage.scrollTop = 0; // Reset scroll position to top
      }
      isTransitioning = false;
    }, 420);
  }

  function setupSceneSpecifics(idx) {
    // Reset canvas petals if not Scene 6
    if (idx !== 5) {
      if (canvasPetals) canvasPetals.classList.remove('active');
      stopPetals();
    }
    // Reset lyrics if not Scene 7
    if (idx !== 6) {
      if (lyricsZone) lyricsZone.classList.remove('active');
    }
    // Reset fireflies and clover orbit if not Scene 8
    if (idx !== 7) {
      stopFireflies();
      stopCloverOrbit();
    }
    // Pause Waguri if not Scene 7
    if (idx !== 6 && waguriVideo) {
      waguriVideo.pause();
      if (idx === 0) waguriVideo.currentTime = 0;
    }

    // SCENE 1 (Stage 0): Tiny xuất hiện & giới thiệu
    if (idx === 0) {
      if (tinyFace) tinyFace.className = 'tiny-face visible in-scene1';
      startBlinking();
      ambientBackdrop.classList.remove('clover-mode');
      cloverBlackout.classList.remove('active');
      goldFlash.classList.remove('active');
      if (interactionHint) interactionHint.classList.remove('visible');
      fadeAudioVolume(0.65);
      startBgStars();
    }

    // SCENE 2 (Stage 1): Ngày mai là 20/10
    else if (idx === 1) {
      if (tinyFace) tinyFace.className = 'tiny-face visible in-scene2 show-mouth';
      startBlinking();
      if (interactionHint) interactionHint.classList.remove('visible');
    }

    // SCENE 3 (Stage 2): Tiny ngại ngùng, hiệu ứng ngôi sao & lõi phát sáng
    else if (idx === 2) {
      stopBlinking();
      // mode-shy triggers core pulse, stars twinkle, head tilt, blushing & wink
      if (tinyFace) tinyFace.className = 'tiny-face visible in-scene2 mode-shy mode-wink blushing show-mouth';
      if (interactionHint) interactionHint.classList.remove('visible');
    }

    // SCENE 4 (Stage 3): Bật mí món quà (phong thư phát sáng)
    else if (idx === 3) {
      if (tinyFace) tinyFace.className = 'tiny-face visible in-scene3 blushing mode-smile';
      startBlinking();
      if (interactionHint) interactionHint.classList.remove('visible');
    }

    // SCENE 5 (Stage 4): Mở thư & gửi lời chúc cô Phú
    else if (idx === 4) {
      if (tinyFace) tinyFace.className = 'tiny-face visible in-corner-bl blushing';
      startBlinking();
      goldFlash.classList.remove('active');
      if (interactionHint) interactionHint.classList.remove('visible');
    }

    // SCENE 6 (Stage 5): Lời chúc các bạn nữ 8B6 — Petals fall
    else if (idx === 5) {
      if (tinyFace) tinyFace.className = 'tiny-face visible in-corner-bl blushing show-mouth';
      goldFlash.classList.add('active');
      if (canvasPetals) canvasPetals.classList.add('active');
      startPetals();
      if (interactionHint) interactionHint.classList.remove('visible');
    }

    // SCENE 7 (Stage 6): Video Waguri & khoảnh khắc dễ thương
    else if (idx === 6) {
      goldFlash.classList.remove('active');
      if (tinyFace) tinyFace.className = 'tiny-face visible in-waguri blushing mode-smile';
      if (lyricsZone) lyricsZone.classList.add('active');
      if (interactionHint) interactionHint.classList.add('visible');
      fadeAudioVolume(0.42);
      if (waguriVideo) {
        waguriVideo.play().catch(e => {
          console.log('Waguri notice:', e);
          const fb = document.querySelector('.waguri-fallback');
          if (fb) fb.classList.add('show');
        });
      }
    }

    // SCENE 8 (Stage 7): Kết thúc với cỏ bốn lá 🍀
    else if (idx === 7) {
      ambientBackdrop.classList.add('clover-mode');
      cloverBlackout.classList.add('active');
      if (tinyFace) tinyFace.className = 'tiny-face visible in-clover blushing mode-smile';
      stopBlinking();
      fadeAudioVolume(0.65);
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

    const starCount = W < 600 ? 55 : 110;
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

    const count = W <= 600 ? 26 : 50;
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
      if (currentStageIndex !== 7) return; // Scene 8
      const ff = document.createElement('div');
      ff.className = 'clover-firefly';
      const baseLeft = window.innerWidth > 900 ? 25 : 50;
      ff.style.left = (baseLeft + (Math.random() - 0.5) * 30) + '%';
      ff.style.top = (28 + Math.random() * 38) + '%';
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

      const breathe = 0.3 + 0.2 * Math.sin(t * 1.2);
      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 120);
      grad.addColorStop(0, `rgba(79,238,134,${breathe * 0.25})`);
      grad.addColorStop(1, 'rgba(79,238,134,0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(cx, cy, 120, 0, Math.PI * 2);
      ctx.fill();

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
      if (ctx) ctx.clearRect(0, 0, canvasCloverOrbit.width, canvasCloverOrbit.height);
    }
  }

  // =================== WISH BURST INTERACTION ===================
  function triggerWishBurst() {
    if (cloverSvgElem) {
      cloverSvgElem.classList.remove('wishing-burst');
      void cloverSvgElem.offsetWidth;
      cloverSvgElem.classList.add('wishing-burst');
    }

    const emojis = ['🍀', '💗', '✨', '🌸', '💖', '⭐', '🍀'];
    const W = window.innerWidth;
    const H = window.innerHeight;
    const startX = W > 900 ? W * 0.24 : W * 0.5;
    const startY = H * 0.42;

    for (let i = 0; i < 30; i++) {
      const spark = document.createElement('div');
      spark.className = 'flying-wish-spark';
      spark.textContent = emojis[Math.floor(Math.random() * emojis.length)];
      spark.style.left = (startX + (Math.random() - 0.5) * 60) + 'px';
      spark.style.top = (startY + (Math.random() - 0.5) * 60) + 'px';

      const tx = (Math.random() - 0.5) * 280;
      const ty = - (120 + Math.random() * 220);
      spark.style.setProperty('--tx', tx + 'px');
      spark.style.setProperty('--ty', ty + 'px');

      document.body.appendChild(spark);
      setTimeout(() => { if (spark.parentNode) spark.parentNode.removeChild(spark); }, 2200);
    }

    if (wishFeedbackToast) {
      wishFeedbackToast.textContent = '✨ Điều ước may mắn đã được gửi đi! Chúc cô Phú và các bạn nữ 8B6 luôn hạnh phúc! 🍀';
      wishFeedbackToast.classList.add('active');
      setTimeout(() => {
        if (wishFeedbackToast) wishFeedbackToast.classList.remove('active');
      }, 4500);
    }

    if (btnMakeWish) {
      btnMakeWish.innerHTML = 'Đã gửi điều ước! 💖';
      setTimeout(() => {
        if (btnMakeWish) btnMakeWish.innerHTML = 'Gửi thêm điều ước 🍀';
      }, 3500);
    }
  }

  // =================== EVENT LISTENERS ===================

  // Cảnh 1 -> 2
  if (btnScene1Next) btnScene1Next.addEventListener('click', (e) => {
    e.stopPropagation();
    goToStage(1);
  });

  // Cảnh 2 -> 3
  if (btnScene2Next) btnScene2Next.addEventListener('click', (e) => {
    e.stopPropagation();
    goToStage(2);
  });

  // Cảnh 3 -> 4
  if (btnScene3Next) btnScene3Next.addEventListener('click', (e) => {
    e.stopPropagation();
    goToStage(3);
  });

  // Cảnh 4 -> 5 (Mở phong thư 💌)
  function handleOpenEnvelope(e) {
    if (e) e.stopPropagation();
    if (glowingEnvelopeBox) {
      glowingEnvelopeBox.style.transform = 'scale(1.18) rotate(3deg)';
      glowingEnvelopeBox.style.transition = 'transform 0.45s ease';
    }
    setTimeout(() => {
      goToStage(4);
    }, 400);
  }
  if (btnOpenEnvelope) btnOpenEnvelope.addEventListener('click', handleOpenEnvelope);
  if (glowingEnvelopeBox) glowingEnvelopeBox.addEventListener('click', handleOpenEnvelope);

  // Cảnh 5 -> 6 (Xem lá thư tiếp theo)
  if (btnScene5Next) btnScene5Next.addEventListener('click', (e) => {
    e.stopPropagation();
    goToStage(5);
  });

  // Cảnh 6 -> 7 (Còn điều gì nữa nhỉ?)
  if (btnScene6Next) btnScene6Next.addEventListener('click', (e) => {
    e.stopPropagation();
    goToStage(6);
  });

  // Cảnh 7 -> 8 (Đến món quà cỏ bốn lá)
  if (btnScene7Next) btnScene7Next.addEventListener('click', (e) => {
    e.stopPropagation();
    goToStage(7);
  });

  // Gửi một điều ước (Cảnh 8)
  if (btnMakeWish) btnMakeWish.addEventListener('click', (e) => {
    e.stopPropagation();
    triggerWishBurst();
  });

  // Restart buttons
  if (btnRestart) btnRestart.addEventListener('click', restartExperience);
  if (btnReplayClover) btnReplayClover.addEventListener('click', restartExperience);

  // Touch & scroll tracking: NEVER advance stage if user is scrolling!
  let touchStartY = 0;
  let isScrollingTouch = false;

  viewport.addEventListener('touchstart', (e) => {
    if (e.touches && e.touches[0]) {
      touchStartY = e.touches[0].clientY;
      isScrollingTouch = false;
    }
  }, { passive: true });

  viewport.addEventListener('touchmove', (e) => {
    if (e.touches && e.touches[0]) {
      const diffY = Math.abs(e.touches[0].clientY - touchStartY);
      if (diffY > 8) {
        isScrollingTouch = true;
      }
    }
  }, { passive: true });

  // Viewport tap: only advance on tappable stages
  viewport.addEventListener('click', (e) => {
    if (isScrollingTouch) {
      isScrollingTouch = false;
      return; // Do not advance if user was scrolling!
    }
    if (e.target.closest('button, .wish-card, .clover-card-container, .wish-card-container, .mission-card-col, .scene-dialogue-card, .control-btn, .glowing-envelope-wrap, .dialogue-box')) return;
    initAudio();
    if (clickableStages.has(currentStageIndex)) nextStage();
  });

  // Keyboard navigation
  document.addEventListener('keydown', (e) => {
    if (['Space', 'ArrowRight', 'Enter'].includes(e.code)) {
      initAudio();
      if (clickableStages.has(currentStageIndex)) nextStage();
    }
  });

  // =================== INIT ===================
  goToStage(0);
});
