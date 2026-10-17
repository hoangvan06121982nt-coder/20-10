/**
 * CHÚC MỪNG NGÀY PHỤ NỮ VIỆT NAM 20/10
 * Interactive Experience Controller
 */

document.addEventListener('DOMContentLoaded', () => {
  // --- DOM Elements ---
  const audio = document.getElementById('bg-soundtrack');
  const btnAudioToggle = document.getElementById('btn-audio-toggle');
  const audioStatus = document.getElementById('audio-status');
  const btnRestart = document.getElementById('btn-restart');
  const btnStart = document.getElementById('btn-start');
  const btnReplayClover = document.getElementById('btn-replay-clover');
  const viewport = document.getElementById('app-viewport');
  const ambientBackdrop = document.getElementById('ambient-backdrop');
  const goldFlash = document.getElementById('gold-flash');
  const cloverBlackout = document.getElementById('clover-blackout');
  const interactionHint = document.getElementById('interaction-hint');

  const tinyFace = document.getElementById('tiny-face');
  const waguriVideo = document.getElementById('waguri-video');
  const canvasPetals = document.getElementById('canvas-petals');
  const cloverFireflyField = document.getElementById('clover-firefly-field');

  const lyricsZone = document.getElementById('lyrics-zone');
  const lyricLine1 = document.getElementById('lyric-line-1');
  const lyricLine2 = document.getElementById('lyric-line-2');

  const stages = [
    document.getElementById('stage-intro'),
    document.getElementById('stage-story-1'),
    document.getElementById('stage-story-2'),
    document.getElementById('stage-story-3'),
    document.getElementById('stage-waguri'),
    document.getElementById('stage-teaser'),
    document.getElementById('stage-clover')
  ];

  let currentStageIndex = 0;
  let isTransitioning = false;
  let audioPlaying = false;
  let blinkTimer = null;
  let fireflyInterval = null;
  let petalsRunning = false;
  let petalsAnimationId = null;

  // --- Synchronized Lyrics Cues ---
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
    { time: 33.4, text: "vì mình có làm được đâu" },
    { time: 35.7, text: "nhường ai khác bên em là" },
    { time: 38.5, text: "nhường đi hết tất cả" },
    { time: 42.0, text: "yêu em chẳng khiến em được vui" },
    { time: 44.9, text: "thế nên anh phải xa" },
    { time: 48.7, text: "càng yêu chỉ thêm thất vọng" },
    { time: 51.8, text: "càng tan nát cõi lòng" },
    { time: 55.0, text: "không được như mong" }
  ];

  // --- AUDIO CONTROLLER ---
  function initAudio() {
    if (!audio) return;
    audio.volume = 0.7;
    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise.then(() => {
        audioPlaying = true;
        if (audioStatus) audioStatus.textContent = "Bật";
      }).catch(err => {
        console.log("Audio autoplay prevented, will start on click:", err);
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
      }).catch(err => console.log(err));
    } else {
      audio.pause();
      audioPlaying = false;
      if (audioStatus) audioStatus.textContent = "Tắt";
    }
  }

  if (btnAudioToggle) {
    btnAudioToggle.addEventListener('click', toggleAudio);
  }

  // Sync Lyrics on audio timeupdate
  let lastLyricIndex = -1;
  if (audio) {
    audio.addEventListener('timeupdate', () => {
      if (currentStageIndex !== 4) return; // Only show in Waguri scene
      const t = audio.currentTime;
      let activeIndex = -1;
      for (let i = lyricCues.length - 1; i >= 0; i--) {
        if (t >= lyricCues[i].time) {
          activeIndex = i;
          break;
        }
      }

      if (activeIndex !== -1 && activeIndex !== lastLyricIndex) {
        lastLyricIndex = activeIndex;
        if (activeIndex % 2 === 0) {
          lyricLine1.textContent = lyricCues[activeIndex].text;
          lyricLine1.style.opacity = '1';
        } else {
          lyricLine2.textContent = lyricCues[activeIndex].text;
          lyricLine2.style.opacity = '1';
        }
      }
    });
  }

  // --- TINY EYE SYSTEM ---
  function startBlinking() {
    stopBlinking();
    function triggerBlink() {
      if (!tinyFace.classList.contains('mode-clover')) {
        tinyFace.classList.add('blinking');
        setTimeout(() => {
          tinyFace.classList.remove('blinking');
        }, 180);
      }
      const nextDelay = 2200 + Math.random() * 2600;
      blinkTimer = setTimeout(triggerBlink, nextDelay);
    }
    blinkTimer = setTimeout(triggerBlink, 1500);
  }

  function stopBlinking() {
    if (blinkTimer) {
      clearTimeout(blinkTimer);
      blinkTimer = null;
    }
  }

  // --- STAGE SWITCHING LOGIC ---
  function goToStage(index) {
    if (index < 0 || index >= stages.length || isTransitioning) return;
    isTransitioning = true;

    const prevStage = stages[currentStageIndex];
    const nextStage = stages[index];

    // Fade out previous stage
    if (prevStage) {
      prevStage.classList.remove('active-stage');
    }

    currentStageIndex = index;

    // Apply scene-specific states
    setupSceneSpecifics(index);

    setTimeout(() => {
      nextStage.classList.add('active-stage');
      isTransitioning = false;
    }, 400);
  }

  function setupSceneSpecifics(stageIdx) {
    // Stage 0: Intro
    if (stageIdx === 0) {
      tinyFace.className = 'tiny-face';
      stopBlinking();
      ambientBackdrop.classList.remove('clover-mode');
      cloverBlackout.classList.remove('active');
      goldFlash.classList.remove('active');
      canvasPetals.classList.remove('active');
      stopPetals();
      stopFireflies();
      lyricsZone.classList.remove('active');
      if (waguriVideo) {
        waguriVideo.pause();
        waguriVideo.currentTime = 0;
      }
      if (interactionHint) interactionHint.classList.remove('visible');
    }

    // Stage 1: Storytelling 1 (Tiny awakens)
    else if (stageIdx === 1) {
      initAudio();
      tinyFace.className = 'tiny-face visible';
      startBlinking();
      canvasPetals.classList.remove('active');
      stopPetals();
      if (interactionHint) interactionHint.classList.add('visible');
    }

    // Stage 2: Storytelling 2 (Cô giáo - Trái tim)
    else if (stageIdx === 2) {
      tinyFace.className = 'tiny-face visible in-split-left';
      canvasPetals.classList.remove('active');
      stopPetals();
      goldFlash.classList.remove('active');
    }

    // Stage 3: Storytelling 3 (Các bạn nữ - Áo dài & Hoa đào rơi)
    else if (stageIdx === 3) {
      tinyFace.className = 'tiny-face visible in-split-left blushing show-mouth';
      goldFlash.classList.add('active');
      canvasPetals.classList.add('active');
      startPetals();
    }

    // Stage 4: Waguri & Main 20/10 Wish
    else if (stageIdx === 4) {
      goldFlash.classList.remove('active');
      canvasPetals.classList.remove('active');
      stopPetals();

      tinyFace.className = 'tiny-face visible in-waguri blushing mode-smile';
      lyricsZone.classList.add('active');

      if (waguriVideo) {
        waguriVideo.play().catch(e => console.log('Waguri play err:', e));
      }
    }

    // Stage 5: Clover Teaser
    else if (stageIdx === 5) {
      lyricsZone.classList.remove('active');
      if (waguriVideo) waguriVideo.pause();

      tinyFace.className = 'tiny-face visible blushing';
      cloverBlackout.classList.remove('active');
      ambientBackdrop.classList.remove('clover-mode');
      stopFireflies();
    }

    // Stage 6: The Four-Leaf Clover Finale
    else if (stageIdx === 6) {
      ambientBackdrop.classList.add('clover-mode');
      cloverBlackout.classList.add('active');

      tinyFace.className = 'tiny-face visible in-clover blushing mode-clover';
      startFireflies();

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
    goToStage(0);
  }

  // --- CANVAS PETALS SIMULATION (Hoa đào rơi) ---
  function startPetals() {
    if (petalsRunning) return;
    petalsRunning = true;

    const ctx = canvasPetals.getContext('2d');
    let width = window.innerWidth;
    let height = window.innerHeight;

    function resizeCanvas() {
      width = window.innerWidth;
      height = window.innerHeight;
      canvasPetals.width = width;
      canvasPetals.height = height;
    }
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const petals = [];
    const petalCount = width <= 600 ? 30 : 60;

    class Petal {
      constructor() {
        this.reset(true);
      }
      reset(initial = false) {
        this.x = Math.random() * width;
        this.y = initial ? Math.random() * height : -30;
        this.size = 10 + Math.random() * 12;
        this.speedY = 1.2 + Math.random() * 2;
        this.speedX = -1 + Math.random() * 2;
        this.angle = Math.random() * Math.PI * 2;
        this.angleSpeed = (Math.random() - 0.5) * 0.04;
        this.opacity = 0.5 + Math.random() * 0.45;
        this.color = Math.random() > 0.4 ? 'rgba(255, 140, 190,' : 'rgba(255, 182, 193,';
      }
      update() {
        this.y += this.speedY;
        this.x += this.speedX + Math.sin(this.angle) * 0.8;
        this.angle += this.angleSpeed;
        if (this.y > height + 20 || this.x < -40 || this.x > width + 40) {
          this.reset();
        }
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

    for (let i = 0; i < petalCount; i++) {
      petals.push(new Petal());
    }

    function animatePetals() {
      if (!petalsRunning) return;
      ctx.clearRect(0, 0, width, height);
      for (const p of petals) {
        p.update();
        p.draw(ctx);
      }
      petalsAnimationId = requestAnimationFrame(animatePetals);
    }
    animatePetals();
  }

  function stopPetals() {
    petalsRunning = false;
    if (petalsAnimationId) {
      cancelAnimationFrame(petalsAnimationId);
      petalsAnimationId = null;
    }
  }

  // --- FIREFLIES FOR CLOVER ---
  function startFireflies() {
    stopFireflies();
    if (!cloverFireflyField) return;

    fireflyInterval = setInterval(() => {
      if (currentStageIndex !== 6) return;
      const firefly = document.createElement('div');
      firefly.className = 'clover-firefly';

      // Emit from around the clover
      const baseLeft = window.innerWidth > 900 ? 25 : 50;
      const randomOffset = (Math.random() - 0.5) * 30;
      const left = baseLeft + randomOffset;
      const top = 35 + Math.random() * 30;

      firefly.style.left = `${left}%`;
      firefly.style.top = `${top}%`;
      const size = 4 + Math.random() * 5;
      firefly.style.width = `${size}px`;
      firefly.style.height = `${size}px`;

      cloverFireflyField.appendChild(firefly);

      setTimeout(() => {
        if (firefly && firefly.parentNode) {
          firefly.parentNode.removeChild(firefly);
        }
      }, 4600);
    }, 280);
  }

  function stopFireflies() {
    if (fireflyInterval) {
      clearInterval(fireflyInterval);
      fireflyInterval = null;
    }
    if (cloverFireflyField) {
      cloverFireflyField.innerHTML = '';
    }
  }

  // --- EVENT LISTENERS ---
  if (btnStart) {
    btnStart.addEventListener('click', (e) => {
      e.stopPropagation();
      goToStage(1);
    });
  }

  if (btnRestart) {
    btnRestart.addEventListener('click', restartExperience);
  }

  if (btnReplayClover) {
    btnReplayClover.addEventListener('click', restartExperience);
  }

  // Viewport tap / click progression
  viewport.addEventListener('click', (e) => {
    // Ignore clicks on buttons or interactive cards
    if (e.target.closest('button') || e.target.closest('.clover-card-container') || e.target.closest('.wish-card-container')) {
      return;
    }
    nextStage();
  });

  // Keyboard navigation (Space / Enter / ArrowRight)
  document.addEventListener('keydown', (e) => {
    if (e.code === 'Space' || e.code === 'ArrowRight' || e.code === 'Enter') {
      nextStage();
    }
  });

  // Initial stage
  goToStage(0);
});
