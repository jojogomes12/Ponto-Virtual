/**********************
 * CONFIGURAÇÃO JSONBIN
 **********************/
const CONFIG = {
  JSONBIN_API_KEY: "$2a$10$KDi5Sc6Jkhx12a3rQxYSIug08jdJNHTIU1xEq7hbeJCubqyZSQ3ii",
  DATA_BIN_ID: "68e3c7c8d0ea881f40975071",
  JSONBIN_URL: "https://api.jsonbin.io/v3/b/"
};

/**********************
 * ELEMENTOS DOM
 **********************/
const welcomeUser = document.getElementById("welcomeUser");
const logoutBtn = document.getElementById("logoutBtn");
const pontoBtn = document.getElementById("pontoBtn");
const pontosGrid = document.getElementById("pontosGrid");
const statusMsg = document.getElementById("statusMsg");

/**********************
 * SESSÃO
 **********************/
const usuario = sessionStorage.getItem("usuarioLogado");
if (!usuario) {
  window.location.href = "login.html";
}
welcomeUser.textContent = "Bem-vindo(a), " + usuario + "!";

/**********************
 * FUNÇÕES JSONBIN
 **********************/
async function getBin() {
  try {
    const res = await fetch(`${CONFIG.JSONBIN_URL}${CONFIG.DATA_BIN_ID}/latest`, {
      method: "GET",
      headers: { "X-Master-Key": CONFIG.JSONBIN_API_KEY }
    });
    const data = await res.json();
    return data.record || {};
  } catch (err) {
    console.error("Erro ao ler JSONBin:", err);
    return {};
  }
}

async function updateBin(content) {
  try {
    const res = await fetch(`${CONFIG.JSONBIN_URL}${CONFIG.DATA_BIN_ID}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "X-Master-Key": CONFIG.JSONBIN_API_KEY
      },
      body: JSON.stringify(content)
    });
    return res.ok;
  } catch (err) {
    console.error("Erro ao salvar JSONBin:", err);
    return false;
  }
}

/**********************
 * FUNÇÕES DE PONTO
 **********************/
function getMonthKey() {
  return new Date().toLocaleString("pt-BR", { month: "2-digit", year: "numeric" }).replace("/", "-");
}

async function renderPontos() {
  const db = await getBin();
  const mes = getMonthKey();
  const userData = db[usuario]?.[mes] || [];

  pontosGrid.innerHTML = "";
  if (userData.length === 0) {
    pontosGrid.innerHTML = `<div class="text-gray-500 text-center col-span-full">Nenhum ponto registrado neste mês.</div>`;
    return;
  }

  const pontosPorDia = {};
  userData.forEach(p => {
    if (!pontosPorDia[p.data]) pontosPorDia[p.data] = [];
    pontosPorDia[p.data].push(p);
  });

  Object.keys(pontosPorDia).sort((a, b) => {
    const [diaA, mesA, anoA] = a.split('/');
    const [diaB, mesB, anoB] = b.split('/');
    return new Date(anoB, mesB - 1, diaB) - new Date(anoA, mesA - 1, diaA);
  }).forEach(dia => {
    const card = document.createElement("div");
    card.className = "border border-gray-700/60 p-3 rounded bg-[#141416]";
    const pontosDia = pontosPorDia[dia];
    card.innerHTML = `<div class="font-semibold text-[#f97316] mb-1">${dia}</div>
      <ul class="text-sm text-gray-300 space-y-1">
        ${pontosDia.map(p => `<li>${p.tipo} - ${p.hora}</li>`).join("")}
      </ul>`;
    pontosGrid.appendChild(card);
  });
}

pontoBtn.addEventListener("click", async () => {
  const db = await getBin();
  const mes = getMonthKey();
  const hoje = new Date().toLocaleDateString("pt-BR");
  const hora = new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  const etapas = ["Entrada da manhã", "Saída para almoço", "Retorno do almoço", "Saída final"];

  if (!db[usuario]) db[usuario] = {};
  if (!db[usuario][mes]) db[usuario][mes] = [];

  const pontosHoje = db[usuario][mes].filter(p => p.data === hoje);
  if (pontosHoje.length >= 4) {
    statusMsg.textContent = "⚠️ Você já registrou os 4 pontos de hoje.";
    return;
  }

  const novo = {
    data: hoje,
    hora,
    tipo: etapas[pontosHoje.length]
  };

  db[usuario][mes].push(novo);
  const ok = await updateBin(db);

  if (ok) {
    statusMsg.textContent = "✅ Ponto registrado com sucesso!";
    renderPontos();
  } else {
    statusMsg.textContent = "Erro ao salvar ponto.";
  }
});

/**********************
 * LOGOUT
 **********************/
logoutBtn.addEventListener("click", () => {
  sessionStorage.removeItem("usuarioLogado");
  window.location.href = "login.html";
});

/**********************
 * INICIALIZAÇÃO
 **********************/
renderPontos();
