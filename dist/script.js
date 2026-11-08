const sceneNames = [
  "Alerta para Keyla",
  "El gran anuncio",
  "Te quiero a pesar de…",
  "El efecto Keyla",
  "Diagnóstico oficial",
  "Las 21 velas",
  "Feliz vuelta al sol",
  "Intruso en el monitor",
  "Activar cumpleaños",
];

const scenes = [...document.querySelectorAll(".scene")];
const progressLabel = document.querySelector("#progressLabel");
const progressFill = document.querySelector("#progressFill");
const sceneName = document.querySelector("#sceneName");
const backButton = document.querySelector("#backButton");
const forwardButton = document.querySelector("#forwardButton");
const soundToggle = document.querySelector("#soundToggle");
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

let currentScene = 0;
let muted = false;
let audioContext;

function getAudioContext() {
  if (!audioContext) {
    const AudioCtor = window.AudioContext || window.webkitAudioContext;
    if (AudioCtor) audioContext = new AudioCtor();
  }
  if (audioContext?.state === "suspended") audioContext.resume();
  return audioContext;
}

function trumpet({ finale = false } = {}) {
  if (muted) return;
  const context = getAudioContext();
  if (!context) return;
  const now = context.currentTime;
  const notes = finale ? [261.63, 329.63, 392, 523.25] : [392, 493.88, 587.33];
  notes.forEach((frequency, index) => {
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const filter = context.createBiquadFilter();
    oscillator.type = "sawtooth";
    oscillator.frequency.setValueAtTime(frequency, now);
    oscillator.frequency.exponentialRampToValueAtTime(frequency * 1.012, now + .16);
    filter.type = "lowpass";
    filter.frequency.value = 1450;
    gain.gain.setValueAtTime(.0001, now + index * .035);
    gain.gain.exponentialRampToValueAtTime(finale ? .075 : .045, now + .045 + index * .035);
    gain.gain.exponentialRampToValueAtTime(.0001, now + (finale ? 1.45 : .85));
    oscillator.connect(filter).connect(gain).connect(context.destination);
    oscillator.start(now + index * .035);
    oscillator.stop(now + (finale ? 1.5 : .9));
  });
}

function sadTrombone() {
  if (muted) return;
  const context = getAudioContext();
  if (!context) return;
  const now = context.currentTime;
  [293.66, 261.63, 220, 196].forEach((frequency, index) => {
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = "sawtooth";
    oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(.0001, now + index * .17);
    gain.gain.exponentialRampToValueAtTime(.04, now + index * .17 + .02);
    gain.gain.exponentialRampToValueAtTime(.0001, now + index * .17 + .25);
    oscillator.connect(gain).connect(context.destination);
    oscillator.start(now + index * .17);
    oscillator.stop(now + index * .17 + .27);
  });
}

const confettiCanvas = document.querySelector("#confetti");
const confettiContext = confettiCanvas.getContext("2d");
let confettiPieces = [];
let confettiFrame;

function sizeCanvas() {
  confettiCanvas.width = window.innerWidth * window.devicePixelRatio;
  confettiCanvas.height = window.innerHeight * window.devicePixelRatio;
  confettiContext.setTransform(window.devicePixelRatio, 0, 0, window.devicePixelRatio, 0, 0);
}

function confettiBurst({ count = 70, x = .5, y = .2, spread = 1 } = {}) {
  if (prefersReducedMotion.matches) return;
  const colors = ["#ff4f91", "#2878ff", "#ffd63d", "#ee3e33", "#0d7a63", "#ffffff"];
  for (let i = 0; i < count; i += 1) {
    confettiPieces.push({
      x: window.innerWidth * x,
      y: window.innerHeight * y,
      vx: (Math.random() - .5) * 14 * spread,
      vy: -Math.random() * 9 - 4,
      gravity: .2 + Math.random() * .12,
      rotation: Math.random() * Math.PI,
      rotationSpeed: (Math.random() - .5) * .3,
      size: 6 + Math.random() * 9,
      color: colors[Math.floor(Math.random() * colors.length)],
      life: 1,
    });
  }
  if (!confettiFrame) drawConfetti();
}

function drawConfetti() {
  confettiContext.clearRect(0, 0, window.innerWidth, window.innerHeight);
  confettiPieces = confettiPieces.filter(piece => piece.life > 0 && piece.y < window.innerHeight + 40);
  confettiPieces.forEach(piece => {
    piece.x += piece.vx;
    piece.y += piece.vy;
    piece.vy += piece.gravity;
    piece.rotation += piece.rotationSpeed;
    piece.life -= .007;
    confettiContext.save();
    confettiContext.globalAlpha = Math.max(piece.life, 0);
    confettiContext.translate(piece.x, piece.y);
    confettiContext.rotate(piece.rotation);
    confettiContext.fillStyle = piece.color;
    confettiContext.fillRect(-piece.size / 2, -piece.size / 3, piece.size, piece.size * .66);
    confettiContext.restore();
  });
  if (confettiPieces.length) {
    confettiFrame = requestAnimationFrame(drawConfetti);
  } else {
    confettiFrame = null;
  }
}

function celebrateSmall(event) {
  const rect = event?.currentTarget?.getBoundingClientRect();
  const x = rect ? (rect.left + rect.width / 2) / window.innerWidth : .5;
  const y = rect ? rect.top / window.innerHeight : .45;
  confettiBurst({ count: 45, x, y, spread: .7 });
  trumpet();
}

function showScene(index, { celebrate = false } = {}) {
  const nextIndex = Math.max(0, Math.min(index, scenes.length - 1));
  if (nextIndex === currentScene && scenes[nextIndex].classList.contains("active")) return;
  const previous = scenes[currentScene];
  const next = scenes[nextIndex];
  previous.classList.add("leaving");
  previous.classList.remove("active");

  window.setTimeout(() => {
    previous.hidden = true;
    previous.classList.remove("leaving");
    next.hidden = false;
    requestAnimationFrame(() => next.classList.add("active"));
    next.querySelector("h1, h2")?.focus({ preventScroll: true });
  }, prefersReducedMotion.matches ? 0 : 360);

  currentScene = nextIndex;
  progressLabel.textContent = `${String(currentScene + 1).padStart(2, "0")} / ${String(scenes.length).padStart(2, "0")}`;
  progressFill.style.width = `${((currentScene + 1) / scenes.length) * 100}%`;
  sceneName.textContent = sceneNames[currentScene];
  backButton.disabled = currentScene === 0;
  forwardButton.disabled = currentScene === scenes.length - 1;
  if (celebrate) {
    confettiBurst({ count: 65, x: .5, y: .28 });
    trumpet();
  }
  if (currentScene === 2) startLoveCarousel(); else stopLoveCarousel();
  if (currentScene === 7) startMonitorScene(); else resetMonitorTimers();
}

// Escena del monitor: mensaje, intruso y papelera
const monitorStage = document.querySelector("#monitorStage");
const monitorMessage = document.querySelector("#monitorMessage");
const monitorNext = document.querySelector("#monitorNext");
const monitorStatus = document.querySelector("#monitorStatus");
const intruderWindow = document.querySelector("#intruderWindow");
const intruderTyped = document.querySelector("#intruderTyped");
const monitorAlert = document.querySelector("#monitorAlert");
const animatedCursor = document.querySelector("#animatedCursor");
const trashCan = document.querySelector("#trashCan");
const trashBurst = document.querySelector("#trashBurst");
const activateFromMonitor = document.querySelector("#activateFromMonitor");
const sincereMessage = "Keyla, gracias por hacer que hasta los días normales tengan algo especial. Que tus 21 estén llenos de personas que te hagan sentir en casa, aventuras inolvidables y muchas historias cuestionables. Te quiero muchísimo.";
const intruderMessage = "uhm, escuche que eda tu cumpleañozz y te queria saludad...";
let monitorTimers = [];
let monitorStarted = false;
let intruderTriggered = false;

function resetMonitorTimers() {
  monitorTimers.forEach(window.clearTimeout);
  monitorTimers = [];
}

function typeText(target, text, { speed = 28, limit = text.length, done } = {}) {
  target.textContent = "";
  let index = 0;
  const tick = () => {
    target.textContent = text.slice(0, index);
    index += 1;
    if (index <= limit) monitorTimers.push(window.setTimeout(tick, speed));
    else done?.();
  };
  tick();
}

function triggerIntruder() {
  if (intruderTriggered) return;
  intruderTriggered = true;
  resetMonitorTimers();
  monitorNext.hidden = true;
  intruderWindow.classList.add("visible");
  intruderWindow.setAttribute("aria-hidden", "false");
  monitorAlert.classList.add("visible");
  monitorStatus.textContent = "Alerta: alguien está intentando colarse…";
  const limit = prefersReducedMotion.matches ? intruderMessage.length : Math.floor(intruderMessage.length * .66);
  typeText(intruderTyped, intruderMessage, { speed: 38, limit, done: () => {
    monitorStatus.textContent = "Intruso detectado. Activando protocolo de limpieza.";
    if (prefersReducedMotion.matches) finishIntruder();
    else monitorTimers.push(window.setTimeout(runCursorSequence, 650));
  }});
}

function runCursorSequence() {
  animatedCursor.classList.add("moving");
  monitorTimers.push(window.setTimeout(() => {
    intruderWindow.classList.add("closing");
    monitorStatus.textContent = "Cerrando mensaje sospechoso…";
  }, 700));
  monitorTimers.push(window.setTimeout(() => {
    trashCan.classList.add("open");
    monitorStatus.textContent = "Enviando intruso a la papelera…";
  }, 1400));
  monitorTimers.push(window.setTimeout(() => {
    trashCan.classList.add("exploded");
    trashBurst.classList.add("visible");
    finishIntruder();
  }, prefersReducedMotion.matches ? 0 : 2100));
}

function finishIntruder() {
  animatedCursor.classList.remove("moving");
  monitorStatus.innerHTML = "<strong>Intruso bloqueado.</strong><br />La fiesta puede continuar.";
  monitorStage.classList.add("clear");
  activateFromMonitor.hidden = false;
  confettiBurst({ count: 120, x: .5, y: .4, spread: 1.2 });
  trumpet();
}

function startMonitorScene() {
  if (monitorStarted) return;
  monitorStarted = true;
  intruderTriggered = false;
  monitorStage.classList.remove("clear");
  intruderWindow.classList.remove("visible", "closing");
  monitorAlert.classList.remove("visible");
  trashCan.classList.remove("open", "exploded");
  trashBurst.classList.remove("visible");
  activateFromMonitor.hidden = true;
  monitorNext.hidden = true;
  monitorStatus.textContent = "El mensaje está llegando…";
  typeText(monitorMessage, sincereMessage, { speed: prefersReducedMotion.matches ? 0 : 14, done: () => {
    monitorStatus.textContent = "Mensaje recibido. Puedes leerlo un momento.";
    monitorNext.hidden = false;
    if (!prefersReducedMotion.matches) monitorTimers.push(window.setTimeout(triggerIntruder, 5000));
  }});
}

monitorNext.addEventListener("click", triggerIntruder);
activateFromMonitor.addEventListener("click", event => { celebrateSmall(event); showScene(8); });

document.querySelectorAll(".js-next").forEach(button => {
  button.addEventListener("click", event => {
    celebrateSmall(event);
    showScene(currentScene + 1);
  });
});

backButton.addEventListener("click", () => showScene(currentScene - 1));
forwardButton.addEventListener("click", event => { celebrateSmall(event); showScene(currentScene + 1); });

soundToggle.addEventListener("click", () => {
  muted = !muted;
  soundToggle.setAttribute("aria-pressed", String(muted));
  soundToggle.setAttribute("aria-label", muted ? "Activar sonidos" : "Silenciar sonidos");
  if (!muted) trumpet();
});

// Carrusel de frases
const loveCards = [...document.querySelectorAll(".love-card")];
const loveDots = document.querySelector("#loveDots");
const lovePause = document.querySelector("#lovePause");
const loveCarousel = document.querySelector("#loveCarousel");
let loveIndex = 0;
let loveTimer;
let lovePaused = false;

loveCards.forEach((_, index) => {
  const dot = document.createElement("button");
  dot.type = "button";
  dot.setAttribute("aria-label", `Mostrar frase ${index + 1}`);
  dot.addEventListener("click", () => { setLoveCard(index, true); restartLoveCarousel(); });
  loveDots.append(dot);
});

function setLoveCard(index, userInitiated = false) {
  loveIndex = (index + loveCards.length) % loveCards.length;
  loveCards.forEach((card, cardIndex) => {
    const active = cardIndex === loveIndex;
    card.classList.toggle("active", active);
    card.setAttribute("aria-hidden", String(!active));
  });
  [...loveDots.children].forEach((dot, dotIndex) => dot.classList.toggle("active", dotIndex === loveIndex));
  if (userInitiated) confettiBurst({ count: 20, x: .5, y: .48, spread: .45 });
}

function startLoveCarousel() {
  if (lovePaused || prefersReducedMotion.matches || currentScene !== 2) return;
  clearInterval(loveTimer);
  loveTimer = setInterval(() => setLoveCard(loveIndex + 1), 4000);
}
function stopLoveCarousel() { clearInterval(loveTimer); }
function restartLoveCarousel() { stopLoveCarousel(); startLoveCarousel(); }

document.querySelector("#lovePrev").addEventListener("click", () => { setLoveCard(loveIndex - 1, true); restartLoveCarousel(); });
document.querySelector("#loveNext").addEventListener("click", () => { setLoveCard(loveIndex + 1, true); restartLoveCarousel(); });
lovePause.addEventListener("click", () => {
  lovePaused = !lovePaused;
  lovePause.textContent = lovePaused ? "Reanudar" : "Pausar";
  lovePause.setAttribute("aria-pressed", String(lovePaused));
  lovePaused ? stopLoveCarousel() : startLoveCarousel();
});
loveCarousel.addEventListener("mouseenter", stopLoveCarousel);
loveCarousel.addEventListener("mouseleave", startLoveCarousel);
loveCarousel.addEventListener("focusin", stopLoveCarousel);
loveCarousel.addEventListener("focusout", startLoveCarousel);
setLoveCard(0);

// Antes y después
const revealAfter = document.querySelector("#revealAfter");
revealAfter.addEventListener("click", event => {
  celebrateSmall(event);
  const before = document.querySelector(".before-side");
  const after = document.querySelector(".after-side");
  window.setTimeout(() => sadTrombone(), 550);
  before.classList.remove("active");
  before.setAttribute("aria-hidden", "true");
  after.classList.add("active");
  after.setAttribute("aria-hidden", "false");
  revealAfter.hidden = true;
  document.querySelector(".after-next").hidden = false;
});

// Diagnóstico aleatorio
const diagnosisOptions = [
  ["Decisiones responsables", "Pendiente"],
  ["Energía caótica", "Fuera de escala"],
  ["Probabilidad de llegar tarde", "97%"],
  ["Ser increíble", "Sospechosamente alta"],
  ["Paciencia disponible", "2%"],
  ["Necesidad de snacks", "Crítica"],
  ["Historias cuestionables", "Ilimitadas"],
  ["Carisma accidental", "100%"],
  ["Planes bien pensados", "No encontrados"],
];

document.querySelector("#rerollDiagnosis").addEventListener("click", event => {
  celebrateSmall(event);
  const selected = [...diagnosisOptions].sort(() => Math.random() - .5).slice(0, 4);
  const adultLevel = 8 + Math.floor(Math.random() * 17);
  document.querySelector("#meterValue").textContent = `${adultLevel}%`;
  document.querySelector("#meterRing").style.background = `conic-gradient(var(--pink) 0 ${adultLevel}%, var(--paper-deep) ${adultLevel}% 100%)`;
  document.querySelector("#diagnosisList").innerHTML = selected.map(([label, value]) => `<div><span>${label}</span><strong>${value}</strong></div>`).join("");
});

// Velas
const candlesContainer = document.querySelector("#candles");
const blowButton = document.querySelector("#blowButton");
const holdFill = blowButton.querySelector(".hold-fill");
const wishStatus = document.querySelector("#wishStatus");
let holdStart;
let holdAnimation;
let candlesCompleted = false;

for (let index = 0; index < 21; index += 1) {
  const candle = document.createElement("i");
  candle.className = "candle";
  candle.innerHTML = '<span class="flame"></span>';
  candlesContainer.append(candle);
}

function updateCandles(progress) {
  const offCount = Math.floor(progress * 21);
  [...candlesContainer.children].forEach((candle, index) => candle.classList.toggle("off", index < offCount));
  wishStatus.textContent = offCount === 21 ? "Deseo enviado al universo" : `${21 - offCount} velas encendidas`;
}

function holdTick(time) {
  if (!holdStart) holdStart = time;
  const progress = Math.min((time - holdStart) / 2200, 1);
  holdFill.style.width = `${progress * 100}%`;
  updateCandles(progress);
  if (progress < 1) {
    holdAnimation = requestAnimationFrame(holdTick);
  } else {
    candlesCompleted = true;
    blowButton.disabled = true;
    blowButton.querySelector(".hold-copy").textContent = "¡Deseo enviado!";
    document.querySelector(".candle-next").hidden = false;
    confettiBurst({ count: 140, x: .5, y: .42, spread: 1.2 });
    trumpet({ finale: true });
  }
}

function startHold(event) {
  if (candlesCompleted) return;
  event.preventDefault();
  holdStart = 0;
  holdAnimation = requestAnimationFrame(holdTick);
}

function stopHold() {
  if (candlesCompleted) return;
  cancelAnimationFrame(holdAnimation);
  holdStart = 0;
  holdFill.style.width = "0%";
  updateCandles(0);
}

blowButton.addEventListener("pointerdown", startHold);
blowButton.addEventListener("pointerup", stopHold);
blowButton.addEventListener("pointerleave", stopHold);
blowButton.addEventListener("pointercancel", stopHold);
blowButton.addEventListener("keydown", event => { if ((event.key === " " || event.key === "Enter") && !event.repeat) startHold(event); });
blowButton.addEventListener("keyup", event => { if (event.key === " " || event.key === "Enter") stopHold(); });

// Final
const partySong = document.querySelector("#partySong");
const partyPause = document.querySelector("#partyPause");
const partyMute = document.querySelector("#partyMute");
const partyReplay = document.querySelector("#partyReplay");
const songStatus = document.querySelector("#songStatus");
let partyActive = false;

document.querySelector("#activateBirthday").addEventListener("click", event => {
  event.currentTarget.disabled = true;
  event.currentTarget.textContent = "CUMPLEAÑOS ACTIVADO ✓";
  document.querySelector(".finale-scene").classList.add("activated");
  partyActive = true;
  [partyPause, partyMute, partyReplay].forEach(button => { button.disabled = false; });
  if (partySong.src) {
    partySong.play().then(() => { songStatus.textContent = "La fiesta está sonando."; }).catch(() => { songStatus.textContent = "Pulsa reproducir para iniciar la canción."; });
  } else {
    songStatus.textContent = "Fiesta activada. Añade tu canción para completar la banda sonora.";
  }
  trumpet({ finale: true });
  confettiBurst({ count: 320, x: .5, y: .15, spread: 1.8 });
  window.setTimeout(() => confettiBurst({ count: 220, x: .2, y: .25, spread: 1.4 }), 450);
  window.setTimeout(() => confettiBurst({ count: 220, x: .8, y: .25, spread: 1.4 }), 800);
});

partyPause.addEventListener("click", () => {
  if (!partyActive || !partySong.src) return;
  if (partySong.paused) { partySong.play(); partyPause.textContent = "Pausar fiesta"; }
  else { partySong.pause(); partyPause.textContent = "Reanudar fiesta"; }
});
partyMute.addEventListener("click", () => {
  if (!partyActive || !partySong.src) return;
  partySong.muted = !partySong.muted;
  partyMute.textContent = partySong.muted ? "Activar sonido" : "Silenciar";
});
partyReplay.addEventListener("click", () => {
  if (!partyActive) return;
  partySong.currentTime = 0;
  if (partySong.src) partySong.play();
  confettiBurst({ count: 180, x: .5, y: .25, spread: 1.5 });
});

document.querySelector("#replayButton").addEventListener("click", () => window.location.reload());

window.addEventListener("resize", sizeCanvas);
prefersReducedMotion.addEventListener?.("change", () => { if (prefersReducedMotion.matches) stopLoveCarousel(); else startLoveCarousel(); });
sizeCanvas();
