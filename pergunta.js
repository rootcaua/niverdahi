const btnSim = document.querySelector("#btn-sim");
const btnNao = document.querySelector("#btn-nao");
const buttonStack = document.querySelector("#button-stack");
const warningText = document.querySelector("#warning-text");
const reveal = document.querySelector("#reveal");
const bgHearts = document.querySelector("#bg-hearts");

const naoMessages = ["tem certeza?", "tem certeza mesmo?"];
const particleColors = ["#ff75a5", "#e92364", "#f5c72d", "#ffb3ca"];
const scaleSteps = [0.87, 0.72];

let naoClicks = 0;

// ---------- floating background hearts ----------
function buildBackgroundHearts() {
  const fragment = document.createDocumentFragment();

  for (let i = 0; i < 14; i += 1) {
    const heart = document.createElement("span");
    heart.className = "bg-heart";
    heart.style.setProperty("--left", `${Math.random() * 100}%`);
    heart.style.setProperty("--size", `${8 + Math.random() * 10}px`);
    heart.style.setProperty("--duration", `${9 + Math.random() * 8}s`);
    heart.style.setProperty("--delay", `${Math.random() * -14}s`);
    heart.style.setProperty("--drift", `${-40 + Math.random() * 80}px`);
    heart.style.setProperty(
      "--color",
      particleColors[i % particleColors.length]
    );
    fragment.appendChild(heart);
  }

  bgHearts.appendChild(fragment);
}

// ---------- "não" button behavior ----------
function showWarning(text) {
  warningText.textContent = text;
  warningText.hidden = false;
}

function shakeNao() {
  btnNao.classList.remove("shake");
  void btnNao.offsetWidth; // força reinício da animação
  btnNao.classList.add("shake");
}

function explodeNao() {
  const rect = btnNao.getBoundingClientRect();
  const stackRect = buttonStack.getBoundingClientRect();
  const originX = rect.left - stackRect.left + rect.width / 2;
  const originY = rect.top - stackRect.top + rect.height / 2;

  for (let i = 0; i < 18; i += 1) {
    const particle = document.createElement("span");
    particle.className = "particle-heart";
    const angle = (Math.PI * 2 * i) / 18 + Math.random() * 0.3;
    const distance = 42 + Math.random() * 46;
    particle.style.left = `${originX}px`;
    particle.style.top = `${originY}px`;
    particle.style.setProperty("--size", `${6 + Math.random() * 6}px`);
    particle.style.setProperty("--tx", `${Math.cos(angle) * distance}px`);
    particle.style.setProperty("--ty", `${Math.sin(angle) * distance}px`);
    particle.style.setProperty(
      "--particle-color",
      particleColors[i % particleColors.length]
    );
    buttonStack.appendChild(particle);
    setTimeout(() => particle.remove(), 650);
  }

  btnNao.remove();
  btnSim.classList.add("pulse");
  showWarning("já que você não tem escolha... clique no sim <3");
}

btnNao.addEventListener("click", () => {
  naoClicks += 1;

  if (naoClicks <= scaleSteps.length) {
    btnNao.style.setProperty("--scale", scaleSteps[naoClicks - 1]);
    shakeNao();
    showWarning(naoMessages[naoClicks - 1]);
  } else {
    explodeNao();
  }
});

btnSim.addEventListener("click", () => {
  buttonStack.hidden = true;
  warningText.hidden = true;
  reveal.hidden = false;
});

buildBackgroundHearts();
