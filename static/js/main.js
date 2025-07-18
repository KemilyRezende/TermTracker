document.addEventListener("DOMContentLoaded", (event) => {
  const socket = io();

  // --- Elementos da Página ---
  const tempElement = document.getElementById("temp-atual");
  const statusElement = document.getElementById("status");
  const sessionCheckbox = document.getElementById("session-mode-checkbox");
  const sessionControls = document.getElementById("session-controls");
  const iniciarBtn = document.getElementById("iniciar-btn");
  const reiniciarBtn = document.getElementById("reiniciar-btn");
  const salvarBtn = document.getElementById("salvar-btn");
  const t0Input = document.getElementById("t0-input");
  const deltatInput = document.getElementById("deltat-input");
  const qtdInput = document.getElementById("qtd-input");

  // --- Variáveis de Estado (com a nova variável 'sessaoArmada') ---
  let modoSessaoAtivo = false;
  let sessaoArmada = false;
  let medicaoAtiva = false;
  let esperandoSubir = true;
  let liveTemp = null;
  let t0, deltaT, qtdMedicoes;
  let medicoesFeitas = 0;
  let ultimoPontoRegistrado = null;
  let startTime = Date.now();
  const MAX_PONTOS_CONTINUO = 100;

  // --- Configuração do Gráfico ---
  const ctx = document.getElementById("grafico-temperatura").getContext("2d");
  const grafico = new Chart(ctx, {
    type: "line",
    data: {
      labels: [],
      datasets: [
        {
          label: "Temperatura Registrada (°C)",
          data: [],
          borderColor: "#03dac6",
          backgroundColor: "rgba(3, 218, 198, 0.2)",
          borderWidth: 2,
          fill: true,
          tension: 0.1,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          ticks: { color: "#e0e0e0" },
          grid: { color: "rgba(255, 255, 255, 0.1)" },
        },
        y: {
          ticks: { color: "#e0e0e0" },
          grid: { color: "rgba(255, 255, 255, 0.1)" },
        },
      },
      plugins: { legend: { labels: { color: "#e0e0e0" } } },
    },
  });

  // --- Funções Auxiliares ---
  function formatElapsedTime(ms) {
    if (ms < 0) ms = 0;
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60)
      .toString()
      .padStart(2, "0");
    const seconds = (totalSeconds % 60).toString().padStart(2, "0");
    return `${minutes}:${seconds}`;
  }

  function limparGrafico() {
    grafico.data.labels = [];
    grafico.data.datasets[0].data = [];
    grafico.update();
    startTime = Date.now();
    medicoesFeitas = 0;
  }

  function resetarModoSessao() {
    medicaoAtiva = false;
    sessaoArmada = false;
    t0Input.value = "";
    deltatInput.value = "";
    qtdInput.value = "";
    statusElement.textContent = "Modo Contínuo Ativo";
  }

  // --- Lógica dos Controles ---
  sessionCheckbox.addEventListener("change", () => {
    modoSessaoAtivo = sessionCheckbox.checked;
    sessionControls.disabled = !modoSessaoAtivo;
    limparGrafico();
    if (modoSessaoAtivo) {
      statusElement.textContent = "Modo de Sessão: Aguardando configuração.";
    } else {
      resetarModoSessao();
    }
  });

  iniciarBtn.addEventListener("click", () => {
    const t0Val = parseFloat(t0Input.value);
    const deltaTVal = parseFloat(deltatInput.value);
    const qtdVal = parseInt(qtdInput.value, 10);

    if (
      isNaN(t0Val) ||
      isNaN(deltaTVal) ||
      isNaN(qtdVal) ||
      qtdVal <= 0 ||
      deltaTVal <= 0
    ) {
      alert(
        "Por favor, preencha todos os campos da sessão com valores válidos."
      );
      return;
    }

    if (liveTemp === null) {
      alert(
        "Aguardando a primeira leitura de temperatura para iniciar a sessão. Tente novamente em um segundo."
      );
      return;
    }

    limparGrafico();

    t0 = t0Val;
    deltaT = deltaTVal;
    qtdMedicoes = qtdVal;

    // **LÓGICA DE DECISÃO DE DIREÇÃO**
    if (liveTemp > t0) {
      esperandoSubir = false; // Se a temp atual é MAIOR que o alvo, precisamos esperar ela DESCER.
    } else {
      esperandoSubir = true; // Se a temp atual é MENOR ou igual ao alvo, precisamos esperar ela SUBIR.
    }

    medicaoAtiva = false;
    sessaoArmada = true;
    statusElement.textContent = `Sessão Armada! Aguardando ${t0.toFixed(
      1
    )}°C...`;
  });

  reiniciarBtn.addEventListener("click", () => {
    limparGrafico();
    if (modoSessaoAtivo) {
      resetarModoSessao();
      statusElement.textContent = "Modo de Sessão: Gráfico limpo.";
    } else {
      statusElement.textContent = "Modo Contínuo Ativo";
    }
  });

  salvarBtn.addEventListener("click", () => {
    const ctx = grafico.ctx;
    const originalCompositeOperation = ctx.globalCompositeOperation;

    // Define a operação para desenhar atrás do gráfico
    ctx.globalCompositeOperation = "destination-over";

    // Define a cor de fundo (use a cor do seu tema ou '#ffffff' para branco)
    ctx.fillStyle = "#1e1e2f";

    // Desenha o retângulo de fundo
    ctx.fillRect(0, 0, grafico.canvas.width, grafico.canvas.height);

    // Gera o link para download com o fundo aplicado
    const link = document.createElement("a");
    link.href = grafico.toBase64Image("image/png", 1);
    link.download = `grafico_temperatura_${new Date()
      .toISOString()
      .slice(0, 10)}.png`;
    link.click();

    // Restaura a configuração original para não afetar o gráfico na tela
    ctx.globalCompositeOperation = originalCompositeOperation;
  });

  socket.on("nova_temperatura", function (data) {
    const tempAtual = data.temp;
    liveTemp = tempAtual; // Atualiza a temperatura ao vivo a cada recebimento
    tempElement.textContent = `${tempAtual.toFixed(1)} °C`;

    // 1. Bloco para INICIAR a sessão (agora com verificação de direção)
    if (sessaoArmada && !medicaoAtiva) {
      let gatilhoDisparado = false;

      // Verifica se a condição de início foi atendida, respeitando a direção
      if (esperandoSubir && tempAtual >= t0) {
        gatilhoDisparado = true;
      } else if (!esperandoSubir && tempAtual <= t0) {
        gatilhoDisparado = true;
      }

      if (gatilhoDisparado) {
        // CONDIÇÃO ATINGIDA! COMEÇA A SESSÃO AGORA.
        medicaoAtiva = true;
        startTime = Date.now();
        ultimoPontoRegistrado = t0;
        medicoesFeitas = 1;

        grafico.data.labels.push("00:00");
        grafico.data.datasets[0].data.push(t0);
        grafico.update();

        if (medicoesFeitas >= qtdMedicoes) {
          medicaoAtiva = false;
          sessaoArmada = false;
          statusElement.textContent = `Sessão Concluída: 1 medição realizada.`;
        } else {
          statusElement.textContent = `Sessão: ${medicoesFeitas}/${qtdMedicoes} | Próximo ΔT: ±${deltaT.toFixed(
            1
          )}°C`;
        }
      }
    }
    // 2. Bloco para quando a sessão JÁ ESTÁ RODANDO
    else if (modoSessaoAtivo && medicaoAtiva) {
      const proximoAlvoCima = ultimoPontoRegistrado + deltaT;
      const proximoAlvoBaixo = ultimoPontoRegistrado - deltaT;
      let pontoRegistrado = false;
      let novoPonto = 0;

      if (tempAtual >= proximoAlvoCima) {
        novoPonto = proximoAlvoCima;
        pontoRegistrado = true;
      } else if (tempAtual <= proximoAlvoBaixo) {
        novoPonto = proximoAlvoBaixo;
        pontoRegistrado = true;
      }

      if (pontoRegistrado) {
        const elapsed = Date.now() - startTime;
        grafico.data.labels.push(formatElapsedTime(elapsed));
        grafico.data.datasets[0].data.push(novoPonto);

        ultimoPontoRegistrado = novoPonto;
        medicoesFeitas++;

        if (medicoesFeitas >= qtdMedicoes) {
          medicaoAtiva = false;
          sessaoArmada = false;
          statusElement.textContent = `Sessão Concluída: ${medicoesFeitas} medições.`;
        } else {
          statusElement.textContent = `Sessão: ${medicoesFeitas}/${qtdMedicoes} | Próximo ΔT: ±${deltaT.toFixed(
            1
          )}°C`;
        }
        grafico.update();
      }
    }
    // 3. Bloco para o MODO CONTÍNUO
    else if (!modoSessaoAtivo) {
      const elapsed = Date.now() - startTime;
      grafico.data.labels.push(formatElapsedTime(elapsed));
      grafico.data.datasets[0].data.push(tempAtual);

      if (grafico.data.labels.length > MAX_PONTOS_CONTINUO) {
        grafico.data.labels.shift();
        grafico.data.datasets[0].data.shift();
      }
      grafico.update();
    }
  });

  socket.on("connect", () => {
    console.log("Conectado ao servidor via WebSocket!");
  });
});
