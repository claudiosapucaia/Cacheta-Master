function criarPartida(dados) {
  return {
    id: Date.now(),
    nome: dados.nome || "Partida de Cacheta",
    local: dados.local || "",
    modo: dados.modo,
    rodada: 1,
    inicio: new Date().toISOString(),
    jogadores: dados.jogadores.map(nome => ({ nome, pontos: 10 })),
    resultados: {}
  };
}

function jogadoresAtivos(partida) {
  return partida.jogadores.filter(jogador => jogador.pontos > 0);
}

function aplicarPontos(partida, indice, delta) {
  partida.jogadores[indice].pontos = Math.max(0, partida.jogadores[indice].pontos + delta);
}

function vencedorAtual(partida) {
  const ativos = jogadoresAtivos(partida);
  return ativos.length === 1 ? ativos[0] : null;
}
