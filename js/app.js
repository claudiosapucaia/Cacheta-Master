let estado = carregarEstado();
let modoSelecionado = "rapido";

const $ = id => document.getElementById(id);

function esc(texto) {
  return String(texto).replace(/[&<>"']/g, caractere => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[caractere]));
}

function abrirTela(id) {
  document.querySelectorAll(".tela").forEach(tela => tela.classList.toggle("ativa", tela.id === id));
  document.querySelectorAll("nav button").forEach(botao => botao.classList.toggle("ativo", botao.dataset.tela === id));

  if (id === "partida") renderPartida();
  if (id === "historico") renderHistorico();
  if (id === "ranking") renderRanking();
}

function adicionarCampo(nome = "") {
  const quantidade = document.querySelectorAll(".jogador-input").length;
  if (quantidade >= 10) return alert("Limite de 10 jogadores.");

  const linha = document.createElement("div");
  linha.className = "jogador-input";
  linha.innerHTML = `
    <input maxlength="22" placeholder="Nome do jogador ${quantidade + 1}" value="${esc(nome)}">
    <button class="remover" aria-label="Remover jogador">×</button>
  `;

  linha.querySelector(".remover").onclick = () => {
    if (document.querySelectorAll(".jogador-input").length <= 2) {
      return alert("Mínimo de 2 jogadores.");
    }
    linha.remove();
  };

  $("jogadoresInputs").appendChild(linha);
}

function iniciar() {
  const nomes = [...document.querySelectorAll(".jogador-input input")]
    .map(input => input.value.trim())
    .filter(Boolean);

  if (nomes.length < 2) return alert("Digite pelo menos 2 jogadores.");
  if (new Set(nomes.map(nome => nome.toLowerCase())).size !== nomes.length) {
    return alert("Não use nomes repetidos.");
  }

  estado.partida = criarPartida({
    nome: $("nomePartida").value.trim(),
    local: $("localPartida").value.trim(),
    modo: modoSelecionado,
    jogadores: nomes
  });

  estado.pilha = [];
  salvarEstado(estado);
  abrirTela("partida");
}

function snapshot() {
  estado.pilha.push(JSON.stringify(estado.partida));
  if (estado.pilha.length > 50) estado.pilha.shift();
}

function alterarPontos(indice, delta) {
  if (!estado.partida) return;
  snapshot();
  aplicarPontos(estado.partida, indice, delta);
  salvarEstado(estado);
  renderPartida();
  checarCampeao();
}

function checarCampeao() {
  const vencedor = vencedorAtual(estado.partida);
  if (vencedor) finalizar(vencedor.nome, true);
}

function renderPartida() {
  if (!estado.partida) {
    $("partidaTitulo").textContent = "Nenhuma partida";
    $("partidaSubtitulo").textContent = "Crie uma partida no início";
    $("placar").innerHTML = '<div class="vazio">Nenhuma partida em andamento.</div>';
    $("painelRodada").classList.add("oculto");
    $("painelRapido").classList.remove("oculto");
    return;
  }

  const partida = estado.partida;
  $("partidaTitulo").textContent = partida.nome;
  $("partidaSubtitulo").textContent = partida.local || "Partida atual";
  $("rodadaAtual").textContent = `Rodada ${partida.rodada}`;

  $("painelRapido").classList.toggle("oculto", partida.modo !== "rapido");
  $("painelRodada").classList.toggle("oculto", partida.modo !== "rodada");

  $("placar").innerHTML = partida.jogadores
    .filter(jogador => jogador.pontos > 0)
    .map(jogador => {
      const indice = partida.jogadores.indexOf(jogador);
      return `
        <article class="jogador-card">
          <div class="jogador-head">
            <div class="nome">${esc(jogador.nome)}</div>
            <div class="pontos">${jogador.pontos}</div>
          </div>
          <div class="acoes-jogador">
            <button class="acao desistiu" onclick="alterarPontos(${indice}, -1)">Desistiu -1</button>
            <button class="acao perdeu" onclick="alterarPontos(${indice}, -2)">Perdeu -2</button>
            <button class="acao ajuste" onclick="alterarPontos(${indice}, 1)">+1</button>
          </div>
        </article>
      `;
    }).join("");

  renderResultados();
}

function renderResultados() {
  if (!estado.partida) return;

  const partida = estado.partida;
  $("listaResultados").innerHTML = partida.jogadores
    .filter(jogador => jogador.pontos > 0)
    .map(jogador => {
      const indice = partida.jogadores.indexOf(jogador);
      const atual = partida.resultados[indice] ?? 0;

      return `
        <div class="resultado-item">
          <div class="resultado-nome">${esc(jogador.nome)} — ${jogador.pontos} pontos</div>
          <div class="resultado-opcoes">
            <button class="${atual === 0 ? "ativo" : ""}" onclick="marcarResultado(${indice}, 0)">Venceu 0</button>
            <button class="${atual === -1 ? "ativo" : ""}" onclick="marcarResultado(${indice}, -1)">Desistiu -1</button>
            <button class="${atual === -2 ? "ativo" : ""}" onclick="marcarResultado(${indice}, -2)">Perdeu -2</button>
          </div>
        </div>
      `;
    }).join("");
}

function marcarResultado(indice, valor) {
  estado.partida.resultados[indice] = valor;
  salvarEstado(estado);
  renderResultados();
}

function confirmarRodada() {
  if (!estado.partida) return;

  snapshot();
  Object.entries(estado.partida.resultados).forEach(([indice, valor]) => {
    aplicarPontos(estado.partida, Number(indice), Number(valor));
  });

  estado.partida.resultados = {};
  estado.partida.rodada++;
  salvarEstado(estado);
  renderPartida();
  checarCampeao();
}

function novaRodada() {
  if (!estado.partida) return;
  snapshot();
  estado.partida.rodada++;
  salvarEstado(estado);
  renderPartida();
}

function finalizar(vencedorNome = null, automatico = false) {
  if (!estado.partida) return;

  const ativos = [...jogadoresAtivos(estado.partida)].sort((a, b) => b.pontos - a.pontos);
  const vencedor = vencedorNome || ativos[0]?.nome || "Sem campeão";

  estado.historico.unshift({
    id: estado.partida.id,
    nome: estado.partida.nome,
    local: estado.partida.local,
    data: new Date().toISOString(),
    vencedor,
    rodadas: estado.partida.rodada,
    jogadores: estado.partida.jogadores
  });

  estado.historico = estado.historico.slice(0, 100);
  estado.ranking[vencedor] = (estado.ranking[vencedor] || 0) + 1;
  estado.partida = null;
  estado.pilha = [];
  salvarEstado(estado);

  $("nomeCampeao").textContent = `${vencedor} é o campeão!`;

  if (automatico && $("dialogCampeao").showModal) {
    $("dialogCampeao").showModal();
  } else {
    alert(`Campeão: ${vencedor}`);
    abrirTela("historico");
  }
}

function renderHistorico() {
  const area = $("listaHistorico");

  if (!estado.historico.length) {
    area.innerHTML = '<div class="vazio">Ainda não há partidas encerradas.</div>';
    return;
  }

  area.innerHTML = estado.historico.map(item => `
    <div class="item">
      🏆 <strong>${esc(item.vencedor)}</strong>
      <small>${esc(item.nome)}${item.local ? ` — ${esc(item.local)}` : ""}</small>
      <small>${new Date(item.data).toLocaleString("pt-BR")} — ${item.rodadas} rodada(s)</small>
      <small>${[...item.jogadores].sort((a, b) => b.pontos - a.pontos).map(j => `${esc(j.nome)}: ${j.pontos}`).join(" • ")}</small>
    </div>
  `).join("");
}

function renderRanking() {
  const area = $("listaRanking");
  const itens = Object.entries(estado.ranking).sort((a, b) => b[1] - a[1]);

  if (!itens.length) {
    area.innerHTML = '<div class="vazio">O ranking aparecerá após a primeira partida.</div>';
    return;
  }

  area.innerHTML = itens.map(([nome, vitorias], indice) => `
    <div class="item rank">
      <div class="pos">${indice + 1}</div>
      <strong>${esc(nome)}</strong>
      <div class="wins">${vitorias} vitória${vitorias === 1 ? "" : "s"}</div>
    </div>
  `).join("");
}

document.querySelectorAll(".modo").forEach(botao => {
  botao.onclick = () => {
    modoSelecionado = botao.dataset.modo;
    document.querySelectorAll(".modo").forEach(item => item.classList.toggle("ativo", item === botao));
  };
});

document.querySelectorAll("nav button").forEach(botao => {
  botao.onclick = () => abrirTela(botao.dataset.tela);
});

$("adicionarJogador").onclick = () => adicionarCampo();
$("iniciarPartida").onclick = iniciar;
$("novaRodadaRapida").onclick = novaRodada;
$("confirmarRodada").onclick = confirmarRodada;

$("desfazer").onclick = () => {
  const anterior = estado.pilha.pop();
  if (!anterior) return alert("Nada para desfazer.");
  estado.partida = JSON.parse(anterior);
  salvarEstado(estado);
  renderPartida();
};

$("encerrar").onclick = () => {
  if (!estado.partida) return alert("Não há partida em andamento.");
  if (confirm("Encerrar e salvar esta partida?")) finalizar();
};

$("limparHistorico").onclick = () => {
  if (confirm("Apagar histórico e ranking?")) {
    estado.historico = [];
    estado.ranking = {};
    salvarEstado(estado);
    renderHistorico();
    renderRanking();
  }
};

$("fecharCampeao").onclick = () => {
  $("dialogCampeao").close();
  abrirTela("historico");
};

window.alterarPontos = alterarPontos;
window.marcarResultado = marcarResultado;

for (let i = 0; i < 3; i++) adicionarCampo();

renderPartida();
renderHistorico();
renderRanking();

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => navigator.serviceWorker.register("./service-worker.js"));
}
