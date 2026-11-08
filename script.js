// PERSONALIZAÇÃO: mude os textos principais no arquivo index.html.
// PÉTALAS: altere PETAL_COUNT para escolher quantas aparecem no fundo.
const PETAL_COUNT = 18;

const petalsContainer = document.getElementById("petals");
const questionStage = document.getElementById("questionStage");
const resultStage = document.getElementById("resultStage");
const arena = document.getElementById("buttonArena");
const yesButton = document.getElementById("yesButton");
const noButton = document.getElementById("noButton");
const revealButton = document.getElementById("revealButton");
const secretMessage = document.getElementById("secretMessage");
const restartButton = document.getElementById("restartButton");
const confetti = document.getElementById("confetti");

// Elementos decorativos não interativos.
for (let i = 0; i < PETAL_COUNT; i++) {
  const petal = document.createElement("span");
  petal.className = "petal";
  petal.style.left = `${Math.random() * 100}%`;
  petal.style.animationDuration = `${10 + Math.random() * 11}s`;
  petal.style.animationDelay = `${-Math.random() * 18}s`;
  petal.style.opacity = `${0.23 + Math.random() * 0.3}`;
  petal.style.scale = `${0.65 + Math.random() * 0.75}`;
  petalsContainer.appendChild(petal);
}

let lastDodge = 0;
const SAFE_GAP = 12; // Distância mínima entre o “Não” e o “Sim”.

// O botão “Não” sempre vai para dentro da arena e nunca cobre o “Sim”.
function dodgeNoButton(pointerX, pointerY, force = false) {
  const now = Date.now();
  if (!force && now - lastDodge < 290) return;

  const area = arena.getBoundingClientRect();
  const yes = yesButton.getBoundingClientRect();
  const no = noButton.getBoundingClientRect();
  const padding = 7;
  const width = noButton.offsetWidth;
  const height = noButton.offsetHeight;

  // Limites da arena, recortados também pela parte visível da tela.
  const minX = Math.max(padding, -area.left + padding);
  const maxX = Math.min(arena.clientWidth - width - padding,
    window.innerWidth - area.left - width - padding);
  const minY = Math.max(padding, -area.top + padding);
  const maxY = Math.min(arena.clientHeight - height - padding,
    window.innerHeight - area.top - height - padding);
  if (maxX < minX || maxY < minY) return;

  const yesBox = {
    left: yes.left - area.left - SAFE_GAP,
    right: yes.right - area.left + SAFE_GAP,
    top: yes.top - area.top - SAFE_GAP,
    bottom: yes.bottom - area.top + SAFE_GAP
  };
  const currentX = no.left - area.left;
  const currentY = no.top - area.top;

  function valid(x, y) {
    // Não pode ocupar o retângulo do “Sim”, nem a margem de segurança.
    const overlapsYes = x < yesBox.right && x + width > yesBox.left &&
      y < yesBox.bottom && y + height > yesBox.top;
    return !overlapsYes;
  }

  let best = null;
  let bestScore = -Infinity;

  // Amostras + malha de segurança: escolhe um lugar longe do cursor/dedo.
  const candidates = [];
  for (let i = 0; i < 95; i++) {
    candidates.push({
      x: minX + Math.random() * (maxX - minX),
      y: minY + Math.random() * (maxY - minY)
    });
  }
  for (let x = minX; x <= maxX; x += 12) {
    for (let y = minY; y <= maxY; y += 12) candidates.push({ x, y });
  }
  candidates.push({ x: maxX, y: maxY }, { x: minX, y: maxY });

  for (const candidate of candidates) {
    const { x, y } = candidate;
    if (!valid(x, y)) continue;
    const distanceFromPointer = Math.hypot(area.left + x + width / 2 - pointerX,
      area.top + y + height / 2 - pointerY);
    const distanceFromOld = Math.hypot(x - currentX, y - currentY);
    const score = distanceFromPointer + 0.22 * distanceFromOld;
    if (score > bestScore) { bestScore = score; best = candidate; }
  }

  if (!best) return;
  // Salta instantaneamente: assim não atravessa o botão “Sim” durante uma animação.
  noButton.style.left = `${best.x}px`;
  noButton.style.top = `${best.y}px`;
  noButton.classList.remove("dodging");
  void noButton.offsetWidth; // Reinicia a pequena animação de aparição.
  noButton.classList.add("dodging");
  lastDodge = now;
}

// COMPUTADOR: foge antes que o ponteiro chegue ao botão.
window.addEventListener("pointermove", (event) => {
  if (questionStage.hidden || event.pointerType === "touch") return;
  const rect = noButton.getBoundingClientRect();
  const dx = Math.max(rect.left - event.clientX, 0, event.clientX - rect.right);
  const dy = Math.max(rect.top - event.clientY, 0, event.clientY - rect.bottom);
  if (Math.hypot(dx, dy) < 68) dodgeNoButton(event.clientX, event.clientY);
}, { passive: true });

// CELULAR: o toque faz o botão mudar de lugar, sem registrar resposta negativa.
noButton.addEventListener("pointerdown", (event) => {
  event.preventDefault();
  event.stopPropagation();
  dodgeNoButton(event.clientX, event.clientY, true);
});

// Segurança caso o navegador ainda produza um clique depois do toque.
noButton.addEventListener("click", (event) => {
  event.preventDefault();
  const rect = noButton.getBoundingClientRect();
  dodgeNoButton(rect.left + rect.width / 2, rect.top + rect.height / 2, true);
});

// SIM: substitui a primeira tela pela continuação personalizada.
yesButton.addEventListener("click", () => {
  questionStage.hidden = true;
  resultStage.hidden = false;
  launchConfetti();
  document.getElementById("resultTitle").focus({ preventScroll: true });
});

// Segunda interação: revela um bilhete dentro da segunda tela.
revealButton.addEventListener("click", () => {
  secretMessage.hidden = false;
  revealButton.hidden = true;
});

// Permite rever tudo sem recarregar nem prender ninguém na página.
restartButton.addEventListener("click", () => {
  resultStage.hidden = true;
  questionStage.hidden = false;
  secretMessage.hidden = true;
  revealButton.hidden = false;
  confetti.replaceChildren();
  noButton.style.left = "";
  noButton.style.top = "";
  yesButton.focus({ preventScroll: true });
});

function launchConfetti() {
  confetti.replaceChildren();
  for (let i = 0; i < 24; i++) {
    const piece = document.createElement("span");
    piece.className = "confetti-piece";
    piece.style.left = `${Math.random() * 100}%`;
    piece.style.animationDelay = `${Math.random() * 0.8}s`;
    piece.style.animationDuration = `${1.8 + Math.random() * 1.4}s`;
    confetti.appendChild(piece);
  }
}
