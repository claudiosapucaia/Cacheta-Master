const STORAGE_KEY = "cachetaMasterV41";
const estadoPadrao = { partida: null, historico: [], ranking: {}, pilha: [] };

function carregarEstado() {
  try {
    return { ...estadoPadrao, ...JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}") };
  } catch {
    return structuredClone(estadoPadrao);
  }
}

function salvarEstado(estado) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(estado));
}
