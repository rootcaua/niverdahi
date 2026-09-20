const CARD_URL = "cartao.html";
const GOAL = 50;
const START_LIVES = 3;
const MAGNET_DURATION = 4200;

const gameArea = document.querySelector("#game-area");
const basket = document.querySelector("#basket");
const scoreEl = document.querySelector("#score");
const goalEl = document.querySelector("#goal");
const livesEl = document.querySelector("#lives");
const startGoalEl = document.querySelector("#start-goal");
const startPanel = document.querySelector("#start-panel");
const startButton = document.querySelector("#start-button");
const unlockPanel = document.querySelector("#unlock-panel");
const gameOverPanel = document.querySelector("#game-over-panel");
const retryButton = document.querySelector("#retry-button");

goalEl.textContent = GOAL;
startGoalEl.textContent = `${GOAL} pontos`;

let score = 0;
let lives = START_LIVES;
let shielded = false;
let magnetUntil = 0;
let running = false;
let basketX = 50;
let displayedBasketX = 50;
const BASKET_MAX_SPEED = 190; // max % of screen width the basket can travel per second
let lastSpawn = 0;
let lastTime = 0;
let spawnEvery = 720;
const items = [];

// ---------- audio (no files, just oscillator beeps) ----------
let audioCtx = null;

function ensureAudio() {
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return;
  if (!audioCtx) {
    audioCtx = new AC();
  } else if (audioCtx.state === "suspended") {
    audioCtx.resume();
  }
}

function beep(freq, duration = 0.12, type = "sine", startGain = 0.14, delay = 0) {
  if (!audioCtx) return;
  const t0 = audioCtx.currentTime + delay;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  gain.gain.setValueAtTime(startGain, t0);
  gain.gain.exponentialRampToValueAtTime(0.001, t0 + duration);
  osc.connect(gain).connect(audioCtx.destination);
  osc.start(t0);
  osc.stop(t0 + duration + 0.02);
}

function sfxCatch() {
  beep(660, 0.09, "triangle", 0.12);
}

function sfxBad() {
  beep(160, 0.22, "sawtooth", 0.16);
  beep(110, 0.28, "sawtooth", 0.12, 0.05);
}

function sfxPower(kind) {
  if (kind === "magnet") {
    beep(440, 0.08, "sine", 0.14);
    beep(660, 0.08, "sine", 0.14, 0.08);
    beep(880, 0.12, "sine", 0.14, 0.16);
  } else {
    beep(300, 0.1, "sine", 0.14);
    beep(500, 0.14, "sine", 0.14, 0.09);
  }
}

function sfxWin() {
  [523, 659, 784, 1047].forEach((f, i) => beep(f, 0.16, "triangle", 0.13, i * 0.11));
}

function sfxGameOver() {
  [392, 330, 262].forEach((f, i) => beep(f, 0.22, "sawtooth", 0.12, i * 0.13));
}

function vibrate(pattern) {
  if (navigator.vibrate) navigator.vibrate(pattern);
}

// ---------- helpers ----------
function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function moveBasket(clientX) {
  const rect = gameArea.getBoundingClientRect();
  basketX = clamp(((clientX - rect.left) / rect.width) * 100, 9, 91);
}

function renderLives() {
  livesEl.innerHTML = "";
  for (let i = 0; i < START_LIVES; i += 1) {
    const heart = document.createElement("span");
    heart.className = `life-heart${i < lives ? "" : " lost"}`;
    livesEl.appendChild(heart);
  }
}

function updateBasketState() {
  basket.classList.toggle("shielded", shielded);
  basket.classList.toggle("magnet", performance.now() < magnetUntil);
}

// ---------- spawning ----------
function pickKind(currentScore) {
  const roll = Math.random();
  if (roll < 0.016) return "magnet";
  if (roll < 0.03) return "shield";

  const dangerChance = clamp(0.46 + currentScore * 0.007, 0.46, 0.72);
  if (Math.random() < dangerChance) return "bad";
  return Math.random() > 0.42 ? "heart" : "flower";
}

function spawnItem() {
  const kind = pickKind(score);
  const isBad = kind === "bad";
  const isPower = kind === "magnet" || kind === "shield";
  const size = isBad ? 24 + Math.random() * 16 : isPower ? 30 : 22 + Math.random() * 18;
  const x = 8 + Math.random() * 84;

  const item = document.createElement("span");
  item.className = `falling ${kind}`;
  item.style.left = `${x}%`;
  item.style.top = "-8%";
  item.style.setProperty("--size", `${size}px`);
  item.style.setProperty("--spin", `${Math.random() * 360}deg`);
  gameArea.appendChild(item);

  items.push({
    node: item,
    x,
    y: -8,
    size,
    kind,
    bad: isBad,
    speed: 30 + Math.random() * 20 + Math.max(score, 0) * 0.42,
    wave: Math.random() * 1.3,
    spin: Math.random() > 0.5 ? 1 : -1,
  });
}

function showPop(x, y, text, kind = "good") {
  const pop = document.createElement("span");
  pop.className = `score-pop pop-${kind}`;
  pop.textContent = text;
  pop.style.left = `${x}%`;
  pop.style.top = `${y}%`;
  gameArea.appendChild(pop);
  setTimeout(() => pop.remove(), 750);
}

// ---------- collection ----------
function collectItem(item, index) {
  if (item.kind === "bad") {
    if (shielded) {
      shielded = false;
      showPop(item.x, item.y, "escudo!", "shield");
      sfxPower("shield");
      vibrate(40);
    } else {
      lives -= 1;
      showPop(item.x, item.y, "-1 vida", "bad");
      sfxBad();
      vibrate([60, 40, 60]);
    }
    renderLives();
  } else if (item.kind === "magnet") {
    magnetUntil = performance.now() + MAGNET_DURATION;
    showPop(item.x, item.y, "ímã!", "power");
    sfxPower("magnet");
    vibrate(30);
  } else if (item.kind === "shield") {
    shielded = true;
    showPop(item.x, item.y, "escudo pronto", "power");
    sfxPower("shield");
    vibrate(30);
  } else {
    score += 1;
    showPop(item.x, item.y, "+1", "good");
    sfxCatch();
    scoreEl.textContent = score;
    vibrate(15);
  }

  item.node.remove();
  items.splice(index, 1);
  updateBasketState();

  if (score >= GOAL) {
    win();
    return;
  }

  if (lives <= 0) {
    gameOver();
  }
}

function win() {
  running = false;
  sfxWin();
  vibrate([40, 30, 40, 30, 80]);
  unlockPanel.hidden = false;
  items.forEach((item) => item.node.remove());
  items.length = 0;
}

function gameOver() {
  running = false;
  sfxGameOver();
  vibrate([80, 50, 80]);
  gameOverPanel.hidden = false;
  items.forEach((item) => item.node.remove());
  items.length = 0;
}

// ---------- main loop ----------
function update(time) {
  if (!running) return;

  const delta = lastTime ? (time - lastTime) / 1000 : 0;
  lastTime = time;

  if (time - lastSpawn > spawnEvery) {
    spawnItem();
    lastSpawn = time;
    spawnEvery = Math.max(200, 560 - Math.max(score, 0) * 8.5);
  }

  const magnetActive = performance.now() < magnetUntil;
  updateBasketState();

  const diff = basketX - displayedBasketX;
  const maxStep = BASKET_MAX_SPEED * delta;
  displayedBasketX += Math.abs(diff) <= maxStep ? diff : Math.sign(diff) * maxStep;
  basket.style.left = `${displayedBasketX}%`;

  for (let i = items.length - 1; i >= 0; i -= 1) {
    const item = items[i];
    item.y += item.speed * delta;

    if (magnetActive && item.kind !== "bad" && item.y > 25) {
      item.x += (displayedBasketX - item.x) * Math.min(1, delta * 3.2);
    } else {
      item.x += Math.sin(time / 300 + i + item.wave) * (item.bad ? 0.08 : 0.04);
    }

    item.node.style.top = `${item.y}%`;
    item.node.style.left = `${item.x}%`;
    item.node.style.transform = `translate(-50%, -50%) rotate(${time * 0.08 * item.spin}deg)`;

    const catchWidth = magnetActive && item.kind !== "bad" ? 11 : 7;
    const nearBasket = Math.abs(item.x - displayedBasketX) < catchWidth;
    const nearBottom = item.y > 79 && item.y < 92;

    if (nearBasket && nearBottom) {
      collectItem(item, i);
      continue;
    }

    if (item.y > 110) {
      item.node.remove();
      items.splice(i, 1);
    }
  }

  requestAnimationFrame(update);
}

function startGame() {
  ensureAudio();
  score = 0;
  lives = START_LIVES;
  shielded = false;
  magnetUntil = 0;
  scoreEl.textContent = score;
  renderLives();
  updateBasketState();
  running = true;
  lastTime = 0;
  lastSpawn = 0;
  spawnEvery = 720;
  startPanel.hidden = true;
  unlockPanel.hidden = true;
  gameOverPanel.hidden = true;
  basketX = 50;
  displayedBasketX = 50;
  basket.style.left = "50%";
  requestAnimationFrame(update);
}

startButton.addEventListener("click", startGame);
retryButton.addEventListener("click", startGame);

gameArea.addEventListener("pointerdown", (event) => {
  moveBasket(event.clientX);
});

gameArea.addEventListener("pointermove", (event) => {
  if (event.pressure > 0 || event.pointerType === "touch") {
    moveBasket(event.clientX);
  }
});

document.addEventListener("keydown", (event) => {
  if (!running) return;

  if (event.key === "ArrowLeft") {
    basketX = clamp(basketX - 5, 9, 91);
  }

  if (event.key === "ArrowRight") {
    basketX = clamp(basketX + 5, 9, 91);
  }
});
