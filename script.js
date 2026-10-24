const canvas = document.getElementById("jogo");
const ctx = canvas.getContext("2d");
const elPontos = document.getElementById("pontos");
const elRecorde = document.getElementById("recorde");
const elMensagem = document.getElementById("mensagem");
const elTexto = document.getElementById("texto");

const TAM = 20; // tamanho de cada célula em px
const CELULAS = canvas.width / TAM;
const VELOCIDADE_INICIAL = 130; // ms por passo

const DIRECOES = {
  ArrowUp: { x: 0, y: -1 },
  ArrowDown: { x: 0, y: 1 },
  ArrowLeft: { x: -1, y: 0 },
  ArrowRight: { x: 1, y: 0 },
};

let cobra, direcao, filaDirecoes, comida, pontos, velocidade, timer;
let estado = "parado"; // parado | jogando | pausado | fim
let recorde = lerRecorde();
elRecorde.textContent = recorde;

function lerRecorde() {
  try {
    return Number(localStorage.getItem("recorde-cobrinha")) || 0;
  } catch {
    return 0;
  }
}

function salvarRecorde() {
  try {
    localStorage.setItem("recorde-cobrinha", recorde);
  } catch {
    // sem armazenamento disponível: o recorde vale só para esta sessão
  }
}

function reiniciar() {
  cobra = [
    { x: 10, y: 10 },
    { x: 9, y: 10 },
    { x: 8, y: 10 },
  ];
  direcao = { x: 1, y: 0 };
  filaDirecoes = [];
  pontos = 0;
  velocidade = VELOCIDADE_INICIAL;
  elPontos.textContent = pontos;
  novaComida();
  desenhar();
}

function novaComida() {
  do {
    comida = {
      x: Math.floor(Math.random() * CELULAS),
      y: Math.floor(Math.random() * CELULAS),
    };
  } while (cobra.some((p) => p.x === comida.x && p.y === comida.y));
}

function passo() {
  if (filaDirecoes.length) direcao = filaDirecoes.shift();

  // ao passar da borda, aparece do outro lado
  const cabeca = {
    x: (cobra[0].x + direcao.x + CELULAS) % CELULAS,
    y: (cobra[0].y + direcao.y + CELULAS) % CELULAS,
  };

  const bateuCorpo = cobra.some((p) => p.x === cabeca.x && p.y === cabeca.y);

  if (bateuCorpo) {
    fimDeJogo();
    return;
  }

  cobra.unshift(cabeca);

  if (cabeca.x === comida.x && cabeca.y === comida.y) {
    pontos++;
    elPontos.textContent = pontos;
    velocidade = Math.max(60, velocidade - 3);
    novaComida();
  } else {
    cobra.pop();
  }

  desenhar();
  timer = setTimeout(passo, velocidade);
}

function desenhar() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // comida
  ctx.fillStyle = "#ff5c6c";
  ctx.beginPath();
  ctx.arc(comida.x * TAM + TAM / 2, comida.y * TAM + TAM / 2, TAM / 2 - 2, 0, Math.PI * 2);
  ctx.fill();

  // cobra
  cobra.forEach((p, i) => {
    ctx.fillStyle = i === 0 ? "#7dff9a" : "#3ecf6a";
    ctx.fillRect(p.x * TAM + 1, p.y * TAM + 1, TAM - 2, TAM - 2);
  });
}

function mostrarMensagem(texto) {
  elTexto.textContent = texto;
  elMensagem.classList.remove("escondida");
}

function esconderMensagem() {
  elMensagem.classList.add("escondida");
}

function fimDeJogo() {
  estado = "fim";
  if (pontos > recorde) {
    recorde = pontos;
    salvarRecorde();
    elRecorde.textContent = recorde;
  }
  mostrarMensagem(`Fim de jogo! Você fez ${pontos} pontos.\nAperte uma seta para jogar de novo`);
}

document.addEventListener("keydown", (e) => {
  const nova = DIRECOES[e.key];

  if (e.key === " " && (estado === "jogando" || estado === "pausado")) {
    e.preventDefault();
    if (estado === "jogando") {
      estado = "pausado";
      clearTimeout(timer);
      mostrarMensagem("Pausado\nAperte espaço para continuar");
    } else {
      estado = "jogando";
      esconderMensagem();
      passo();
    }
    return;
  }

  if (!nova) return;
  e.preventDefault(); // evita rolar a página

  if (estado === "parado" || estado === "fim") {
    reiniciar();
    // não deixa começar indo para trás
    if (!(nova.x === -direcao.x && nova.y === -direcao.y)) direcao = nova;
    estado = "jogando";
    esconderMensagem();
    timer = setTimeout(passo, velocidade);
    return;
  }

  if (estado !== "jogando") return;

  // compara com a última direção da fila para não dar meia-volta
  const ultima = filaDirecoes[filaDirecoes.length - 1] || direcao;
  const oposta = nova.x === -ultima.x && nova.y === -ultima.y;
  const igual = nova.x === ultima.x && nova.y === ultima.y;
  if (!oposta && !igual && filaDirecoes.length < 3) filaDirecoes.push(nova);
});

reiniciar();
