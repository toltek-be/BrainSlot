/* =========================
   FIREWORKS
========================= */

const canvas = document.getElementById('fireworks-canvas');
const ctx = canvas.getContext('2d');

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

class Particle {
  constructor(x, y, color) {
    this.x = x;
    this.y = y;
    this.color = color;
    this.velocity = {
      x: (Math.random() - 0.5) * 8,
      y: (Math.random() - 0.5) * 8
    };
    this.alpha = 1;
    this.decay = Math.random() * 0.015 + 0.015;
  }

  draw() {
    ctx.save();
    ctx.globalAlpha = this.alpha;
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  update() {
    this.velocity.y += 0.1;
    this.x += this.velocity.x;
    this.y += this.velocity.y;
    this.alpha -= this.decay;
  }
}

class Firework {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.targetY = Math.random() * canvas.height;
    this.velocity = { x: 0, y: -28 };
    this.exploded = false;
    this.particles = [];
    this.color = `hsl(${Math.random() * 360}, 100%, 50%)`;
  }

  draw() {
    if (!this.exploded) {
      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.arc(this.x, this.y, 3, 0, Math.PI * 2);
      ctx.fill();
    } else {
      this.particles.forEach(p => p.draw());
    }
  }

  update() {
    if (!this.exploded) {
      this.velocity.y += 0.05;
      this.y += this.velocity.y;
      if (this.y <= this.targetY) this.explode();
    } else {
      this.particles.forEach(p => p.update());
      this.particles = this.particles.filter(p => p.alpha > 0);
    }
  }

  explode() {
    this.exploded = true;
    for (let i = 0; i < 50; i++) {
      this.particles.push(new Particle(this.x, this.y, this.color));
    }
  }
}

let fireworks = [];
let lastFireworkTime = 0;

function animateFireworks() {
  ctx.fillStyle = 'rgba(13, 15, 29, 0.1)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const now = Date.now();
  if (now - lastFireworkTime > 800) {
    fireworks.push(new Firework(Math.random() * canvas.width, canvas.height));
    lastFireworkTime = now;
  }

  fireworks.forEach((fw, i) => {
    fw.update();
    fw.draw();
    if (fw.exploded && fw.particles.length === 0) fireworks.splice(i, 1);
  });

  requestAnimationFrame(animateFireworks);
}
animateFireworks();

/* =========================
   SLOT MACHINE
========================= */

const NUM_IMAGES = 59;
const ICON_HEIGHT = 120;

let leftValue = '01';
let rightValue = '01';

class Reel {
  constructor(element, isLeft) {
    this.element = element;
    this.strip = element.querySelector('.reel-strip');
    this.isLeft = isLeft;

    this.currentIndex = 0;
    this.currentTranslate = 0;

    this.isDragging = false;
    this.startY = 0;
    this.startTranslate = 0;

    this.init();
  }

  init() {
    const directory = this.isLeft
      ? 'assets/images/png/left'
      : 'assets/images/png/right';

    for (let i = 0; i < NUM_IMAGES * 6; i++) {
      const icon = document.createElement('div');
      icon.className = 'icon';
      const n = ((i % NUM_IMAGES) + 1).toString().padStart(2, '0');
      icon.innerHTML = `<img src="${directory}/${n}.png" alt="${n}" draggable="false">`;
      this.strip.appendChild(icon);
    }

    const questionIcon = document.createElement('div');
    questionIcon.className = 'icon question-mark';
    questionIcon.textContent = '?';
    this.strip.appendChild(questionIcon);

    this.currentTranslate = -(NUM_IMAGES * ICON_HEIGHT);
    this.updateTransform();

    this.element.addEventListener('pointerdown', this.handleStart.bind(this));
    document.addEventListener('pointermove', this.handleMove.bind(this));
    document.addEventListener('pointerup', this.handleEnd.bind(this));
    document.addEventListener('pointercancel', this.handleEnd.bind(this));
  }

  handleStart(e) {
    if (this.element.classList.contains('animating')) return;
    if (e.button !== undefined && e.button !== 0) return;

    this.isDragging = true;
    this.startY = e.clientY;
    this.startTranslate = this.currentTranslate;

    this.element.setPointerCapture(e.pointerId);
    this.element.style.cursor = 'grabbing';
  }

  handleMove(e) {
    if (!this.isDragging) return;

    e.preventDefault();
    const diff = e.clientY - this.startY;
    this.currentTranslate = this.startTranslate + diff;
    this.updateTransform();
  }

  handleEnd(e) {
    if (!this.isDragging) return;

    this.isDragging = false;

    if (this.element.hasPointerCapture(e.pointerId)) {
        this.element.releasePointerCapture(e.pointerId);
    }

    this.element.style.cursor = 'grab';

    const index = Math.round(-this.currentTranslate / ICON_HEIGHT);
    this.snapToIndex(index);
  }

  snapToIndex(index) {
    const min = NUM_IMAGES;
    const max = NUM_IMAGES * 2 - 1;

    if (index < min) index = max - (min - index);
    if (index > max) index = min + (index - max);

    this.currentIndex = index;
    this.currentTranslate = -index * ICON_HEIGHT;

    this.strip.style.transition = 'transform 0.3s ease-out';
    this.updateTransform();

    setTimeout(() => {
      this.strip.style.transition = '';
      this.checkAndResetPosition();
    }, 300);

    this.updateValue();
  }

  checkAndResetPosition() {
    if (this.currentIndex < NUM_IMAGES || this.currentIndex >= NUM_IMAGES * 2) {
      const visual = ((this.currentIndex - NUM_IMAGES) % NUM_IMAGES + NUM_IMAGES) % NUM_IMAGES;
      this.currentIndex = NUM_IMAGES + visual;
      this.currentTranslate = -this.currentIndex * ICON_HEIGHT;
      this.strip.style.transition = 'none';
      this.updateTransform();
      requestAnimationFrame(() => (this.strip.style.transition = ''));
    }
  }

  updateTransform() {
    this.strip.style.transform = `translateY(${this.currentTranslate + ICON_HEIGHT * 0.5}px)`;
  }

  updateValue() {
    const visual = ((this.currentIndex - NUM_IMAGES) % NUM_IMAGES + NUM_IMAGES) % NUM_IMAGES;
    const value = (visual + 1).toString().padStart(2, '0');

    if (this.isLeft) leftValue = value;
    else rightValue = value;
  }

  animateTo(targetValue) {
    return new Promise(resolve => {
      const targetIndex = NUM_IMAGES + (targetValue - 1);
      const questionIndex = NUM_IMAGES * 3;

      this.element.classList.add('animating');

      this.currentTranslate -= (questionIndex - this.currentIndex) * ICON_HEIGHT;
      this.strip.style.transition = 'transform 1.5s cubic-bezier(.41,-0.01,.63,1.09)';
      this.updateTransform();

      setTimeout(() => {
        this.currentIndex = targetIndex;
        this.currentTranslate = -this.currentIndex * ICON_HEIGHT;
        this.strip.style.transition = 'none';
        this.updateTransform();

        requestAnimationFrame(() => {
          this.element.classList.remove('animating');
          this.strip.style.transition = '';
          this.updateValue();
          resolve();
        });
      }, 1500);
    });
  }
}

/* =========================
   INIT
========================= */

const reel1 = new Reel(document.getElementById('reel1'), true);
const reel2 = new Reel(document.getElementById('reel2'), false);

let isSpinning = false;

document.getElementById('animate-btn').addEventListener('click', async () => {
  if (isSpinning) return;
  isSpinning = true;

  const t1 = Math.floor(Math.random() * NUM_IMAGES) + 1;
  const t2 = Math.floor(Math.random() * NUM_IMAGES) + 1;

  await Promise.all([
    reel1.animateTo(t1),
    reel2.animateTo(t2)
  ]);

  isSpinning = false;
});

document.addEventListener('keydown', (e) => {
  if (e.code === 'Space' && !isSpinning) {
    e.preventDefault();
    document.getElementById('animate-btn').click();
  }
});

window.addEventListener('load', () => {
  setTimeout(() => {
    document.getElementById('animate-btn').click();
  }, 500);
});
