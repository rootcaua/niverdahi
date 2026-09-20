const flowerColors = [
  "#ff9cc3",
  "#ff6f9c",
  "#e51b53",
  "#f6c733",
  "#d9a7ff",
  "#ffbfd2",
  "#d91545",
];

const leafColors = [
  "#ff8db7",
  "#ff6f9c",
  "#ffb3ca",
  "#f24578",
  "#ffc4d6",
  "#e84a82",
];

const heartLeaves = document.querySelector("#heart-leaves");
const heartTree = document.querySelector("#heart-tree");
const flowerBed = document.querySelector("#flower-bed");
const petals = document.querySelector("#petals");

// ---------- densidade adaptativa (menos elementos = menos travamento) ----------
const isSmallScreen = window.matchMedia("(max-width: 760px)").matches;
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const DENSITY = {
  leafFill: isSmallScreen ? 120 : 175,
  leafEdge: isSmallScreen ? 70 : 100,
  blossomEdge: isSmallScreen ? 34 : 46,
  blossomFill: isSmallScreen ? 12 : 18,
  leafScale: isSmallScreen ? 0.86 : 1.16,
  blossomScale: isSmallScreen ? 0.84 : 1.05,
};

// centro do coracao dentro da caixa da copa (em %)
const HEART_CX = 50;
const HEART_CY = 44;

function heartPoint(t) {
  const x = 16 * Math.sin(t) ** 3;
  const y =
    13 * Math.cos(t) -
    5 * Math.cos(2 * t) -
    2 * Math.cos(3 * t) -
    Math.cos(4 * t);

  // a caixa da copa tem proporcao 1.14 : 1, entao estas escalas
  // deixam o coracao com o formato correto (nao achatado)
  return {
    x: HEART_CX + x * 2.62,
    y: HEART_CY - y * 3,
  };
}

function addBlossom(x, y, index, scale = 1) {
  const blossom = document.createElement("span");
  const color = flowerColors[index % flowerColors.length];
  const size = (9 + ((index * 7) % 12)) * scale;

  blossom.className = "blossom";
  blossom.style.left = `${x}%`;
  blossom.style.top = `${y}%`;
  blossom.style.setProperty("--size", `${size}px`);
  blossom.style.setProperty("--color", color);
  blossom.style.setProperty("--turn", `${(index * 41) % 360}deg`);
  blossom.style.setProperty("--delay", `${(index % 26) * 42}ms`);
  blossom.style.setProperty("--speed", `${2.8 + (index % 7) * 0.35}s`);
  return blossom;
}

function addLeaf(x, y, index, scale = 1) {
  const leaf = document.createElement("span");
  const color = leafColors[index % leafColors.length];
  const width = (17 + ((index * 5) % 24)) * scale;
  const height = width * (0.6 + (index % 4) * 0.05);

  leaf.className = "leaf";
  // apenas uma parte das folhas se mexe: bem mais leve para o navegador
  if (!reduceMotion && index % 3 === 0) {
    leaf.classList.add("moving");
  }
  leaf.style.left = `${x}%`;
  leaf.style.top = `${y}%`;
  leaf.style.setProperty("--leaf-width", `${width}px`);
  leaf.style.setProperty("--leaf-height", `${height}px`);
  leaf.style.setProperty("--leaf-color", color);
  leaf.style.setProperty("--opacity", `${0.62 + (index % 5) * 0.07}`);
  leaf.style.setProperty("--turn", `${(index * 37) % 360}deg`);
  leaf.style.setProperty("--float", `${index % 2 === 0 ? 5 : -5}px`);
  leaf.style.setProperty("--tilt", `${index % 2 === 0 ? 13 : -13}deg`);
  leaf.style.setProperty("--delay", `${(index % 34) * 22}ms`);
  leaf.style.setProperty("--speed", `${2.2 + (index % 6) * 0.22}s`);
  return leaf;
}

function buildHeart() {
  const leafFragment = document.createDocumentFragment();
  const flowerFragment = document.createDocumentFragment();

  // miolo: pontos puxados em direcao ao centro do coracao
  for (let i = 0; i < DENSITY.leafFill; i += 1) {
    const t = Math.random() * Math.PI * 2;
    const point = heartPoint(t);
    const pull = 0.06 + Math.sqrt(Math.random()) * 0.9;
    const x = HEART_CX + (point.x - HEART_CX) * pull + (Math.random() - 0.5) * 4;
    const y = HEART_CY + (point.y - HEART_CY) * pull + (Math.random() - 0.5) * 4;
    leafFragment.appendChild(addLeaf(x, y, i, DENSITY.leafScale));
  }

  // contorno
  for (let i = 0; i < DENSITY.leafEdge; i += 1) {
    const t = (Math.PI * 2 * i) / DENSITY.leafEdge;
    const edge = heartPoint(t);
    const x = edge.x + Math.sin(i * 1.7) * 1.4;
    const y = edge.y + Math.cos(i * 1.5) * 1.4;
    leafFragment.appendChild(addLeaf(x, y, i + 420, DENSITY.leafScale * 0.94));
  }

  // florzinhas na borda
  for (let i = 0; i < DENSITY.blossomEdge; i += 1) {
    const t = (Math.PI * 2 * i) / DENSITY.blossomEdge;
    const edge = heartPoint(t);
    const x = edge.x + Math.sin(i * 1.9) * 1.1;
    const y = edge.y + Math.cos(i * 1.7) * 1.1;
    flowerFragment.appendChild(addBlossom(x, y, i, DENSITY.blossomScale));
  }

  // florzinhas espalhadas por dentro
  for (let i = 0; i < DENSITY.blossomFill; i += 1) {
    const t = Math.random() * Math.PI * 2;
    const point = heartPoint(t);
    const pull = 0.22 + Math.sqrt(Math.random()) * 0.64;
    const x = HEART_CX + (point.x - HEART_CX) * pull + (Math.random() - 0.5) * 5;
    const y = HEART_CY + (point.y - HEART_CY) * pull + (Math.random() - 0.5) * 5;
    flowerFragment.appendChild(addBlossom(x, y, i + 160, DENSITY.blossomScale * 0.92));
  }

  heartLeaves.appendChild(leafFragment);
  heartTree.appendChild(flowerFragment);
}

function buildFlowerBed() {
  const fragment = document.createDocumentFragment();
  const flowerLayout = [
    { x: -2, h: 82, s: 34, lean: -10 },
    { x: 3, h: 118, s: 47, lean: 6 },
    { x: 6.5, h: 93, s: 39, lean: -6 },
    { x: 11, h: 146, s: 54, lean: 3 },
    { x: 14.4, h: 127, s: 43, lean: -12 },
    { x: 20.5, h: 74, s: 36, lean: 11 },
    { x: 27, h: 104, s: 42, lean: -8 },
    { x: 31.2, h: 135, s: 50, lean: 7 },
    { x: 35.5, h: 111, s: 37, lean: -4 },
    { x: 41.5, h: 154, s: 56, lean: 2 },
    { x: 46.7, h: 90, s: 44, lean: -13 },
    { x: 53, h: 119, s: 39, lean: 10 },
    { x: 56.8, h: 79, s: 34, lean: -7 },
    { x: 62.6, h: 141, s: 51, lean: 5 },
    { x: 66.1, h: 112, s: 45, lean: -10 },
    { x: 72.8, h: 151, s: 55, lean: 4 },
    { x: 77.4, h: 128, s: 40, lean: -6 },
    { x: 83.5, h: 92, s: 36, lean: 13 },
    { x: 88.2, h: 116, s: 48, lean: -5 },
    { x: 94.4, h: 146, s: 52, lean: 8 },
    { x: 99, h: 103, s: 38, lean: -9 },
    { x: 1.2, h: 66, s: 29, lean: 8 },
    { x: 8.8, h: 102, s: 34, lean: -5 },
    { x: 17.2, h: 91, s: 31, lean: 10 },
    { x: 23.4, h: 126, s: 37, lean: -9 },
    { x: 29.2, h: 81, s: 30, lean: 12 },
    { x: 38.4, h: 132, s: 40, lean: -7 },
    { x: 44.6, h: 96, s: 33, lean: 6 },
    { x: 50.7, h: 143, s: 42, lean: -4 },
    { x: 59.5, h: 101, s: 32, lean: 11 },
    { x: 69.2, h: 88, s: 30, lean: -11 },
    { x: 80.1, h: 138, s: 39, lean: 7 },
    { x: 86.7, h: 77, s: 28, lean: -6 },
    { x: 91.6, h: 132, s: 36, lean: 9 },
    { x: 96.8, h: 84, s: 31, lean: -12 },
  ];

  flowerLayout.forEach((item, i) => {
    const stem = document.createElement("span");
    stem.className = "stem";
    stem.style.setProperty("--left", `${item.x}%`);
    stem.style.setProperty("--height", `${item.h}px`);
    stem.style.setProperty("--lean", `${item.lean}deg`);
    stem.style.setProperty("--flower", `${item.s}px`);
    stem.style.setProperty("--spin", `${i * 31}deg`);
    stem.style.setProperty("--delay", `${i * -0.18}s`);
    stem.style.setProperty("--speed", `${3.4 + (i % 6) * 0.3}s`);
    stem.style.setProperty("--leaf-side", i % 2 === 0 ? "45%" : "-410%");
    stem.style.setProperty("--leaf-top", `${35 + (i % 5) * 11}%`);
    stem.style.setProperty("--leaf-tilt", `${i % 2 === 0 ? 28 : -28}deg`);
    stem.style.setProperty(
      "--head",
      i % 5 === 0 ? "#f04275" : i % 4 === 0 ? "#ffb4ca" : "#ff82ab",
    );
    stem.style.setProperty(
      "--light",
      i % 4 === 0 ? "#ffc4d6" : i % 3 === 0 ? "#ff9cc3" : "#ffb3ca",
    );
    stem.style.setProperty("--deep", i % 5 === 0 ? "#e51b53" : "#f65d91");
    fragment.appendChild(stem);
  });

  flowerBed.appendChild(fragment);
}

function buildPetals() {
  const fragment = document.createDocumentFragment();

  const petalCount = reduceMotion ? 0 : isSmallScreen ? 8 : 12;

  for (let i = 0; i < petalCount; i += 1) {
    const petal = document.createElement("span");
    petal.className = "petal";
    petal.style.setProperty("--left", `${Math.random() * 100}%`);
    petal.style.setProperty("--size", `${9 + Math.random() * 13}px`);
    petal.style.setProperty("--drift", `${-90 + Math.random() * 180}px`);
    petal.style.setProperty("--duration", `${8 + Math.random() * 9}s`);
    petal.style.setProperty("--delay", `${Math.random() * -14}s`);
    fragment.appendChild(petal);
  }

  petals.appendChild(fragment);
}

buildHeart();
buildFlowerBed();
buildPetals();
