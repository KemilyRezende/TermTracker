document.addEventListener('DOMContentLoaded', (event) => {
    const socket = io();

    // --- Elementos da Página ---
    const tempElement = document.getElementById('temp-atual');
    const statusElement = document.getElementById('status');
    const sessionCheckbox = document.getElementById('session-mode-checkbox');
    const sessionControls = document.getElementById('session-controls');
    const iniciarBtn = document.getElementById('iniciar-btn');
    const reiniciarBtn = document.getElementById('reiniciar-btn');
    const salvarBtn = document.getElementById('salvar-btn');
    const t0Input = document.getElementById('t0-input');
    const deltatInput = document.getElementById('deltat-input');
    const qtdInput = document.getElementById('qtd-input');

    // --- Variáveis de Estado ---
    let modoSessaoAtivo = false;
    let medicaoAtiva = false;
    let t0, deltaT, qtdMedicoes;
    let medicoesFeitas = 0;
    let ultimoPontoRegistrado = null;
    let startTime = Date.now();
    const MAX_PONTOS_CONTINUO = 100;

    // --- Configuração do Gráfico (Completa e Corrigida) ---
    const ctx = document.getElementById('grafico-temperatura').getContext('2d');
    const grafico = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Temperatura Registrada (°C)',
                data: [],
                borderColor: '#03dac6',
                backgroundColor: 'rgba(3, 218, 198, 0.2)',
                borderWidth: 2,
                fill: true,
                tension: 0.1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    ticks: { color: '#e0e0e0' },
                    grid: { color: 'rgba(255, 255, 255, 0.1)' }
                },
                y: {
                    ticks: { color: '#e0e0e0' },
                    grid: { color: 'rgba(255, 255, 255, 0.1)' }
                }
            },
            plugins: {
                legend: {
                    labels: { color: '#e0e0e0' }
                }
            }
        }
    });

    // --- Funções e Lógica ---
    function formatElapsedTime(ms) {
        if (ms < 0) ms = 0;
        const totalSeconds = Math.floor(ms / 1000);
        const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
        const seconds = (totalSeconds % 60).toString().padStart(2, '0');
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
        t0Input.value = '';
        deltatInput.value = '';
        qtdInput.value = '';
        statusElement.textContent = 'Modo Contínuo Ativo';
    }

    // --- Lógica dos Controles ---
    sessionCheckbox.addEventListener('change', () => {
        modoSessaoAtivo = sessionCheckbox.checked;
        sessionControls.disabled = !modoSessaoAtivo;
        limparGrafico();
        if (modoSessaoAtivo) {
            statusElement.textContent = 'Modo de Sessão: Aguardando configuração.';
        } else {
            resetarModoSessao();
        }
    });

    iniciarBtn.addEventListener('click', () => {
        const t0Val = parseFloat(t0Input.value);
        const deltaTVal = parseFloat(deltatInput.value);
        const qtdVal = parseInt(qtdInput.value, 10);

        if (isNaN(t0Val) || isNaN(deltaTVal) || isNaN(qtdVal) || qtdVal <= 0 || deltaTVal <= 0) {
            alert('Por favor, preencha todos os campos da sessão com valores válidos.');
            return;
        }

        limparGrafico();

        t0 = t0Val;
        deltaT = deltaTVal;
        qtdMedicoes = qtdVal;
        ultimoPontoRegistrado = t0;

        grafico.data.labels.push('00:00');
        grafico.data.datasets[0].data.push(t0);
        grafico.update();
        medicoesFeitas = 1;

        medicaoAtiva = true;
        statusElement.textContent = `Sessão: ${medicoesFeitas}/${qtdMedicoes} | Próximo ΔT: ±${deltaT.toFixed(1)}°C`;
    });

    reiniciarBtn.addEventListener('click', () => {
        limparGrafico();
        if (modoSessaoAtivo) {
            statusElement.textContent = 'Modo de Sessão: Gráfico limpo.';
        } else {
            statusElement.textContent = 'Modo Contínuo Ativo';
        }
    });

    salvarBtn.addEventListener('click', () => {
        const link = document.createElement('a');
        link.href = grafico.toBase64Image('image/png', 1);
        link.download = `grafico_temperatura_${new Date().toISOString().slice(0, 10)}.png`;
        link.click();
    });

    // --- Lógica Principal de Recebimento de Dados ---
    socket.on('nova_temperatura', function (data) {
        const tempAtual = data.temp;
        tempElement.textContent = `${tempAtual.toFixed(1)} °C`;

        if (modoSessaoAtivo && medicaoAtiva) {
            const proximoAlvoCima = ultimoPontoRegistrado + deltaT;
            const proximoAlvoBaixo = ultimoPontoRegistrado - deltaT;

            let pontoRegistrado = false;
            let novoPonto = 0;

            if (tempAtual >= proximoAlvoCima) {
                novoPonto = proximoAlvoCima;
                pontoRegistrado = true;
            }
            else if (tempAtual <= proximoAlvoBaixo) {
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
                    statusElement.textContent = `Sessão Concluída: ${medicoesFeitas} medições.`;
                } else {
                    statusElement.textContent = `Sessão: ${medicoesFeitas}/${qtdMedicoes} | Próximo ΔT: ±${deltaT.toFixed(1)}°C`;
                }
                grafico.update();
            }
        }
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

    // Confirmação de conexão no console do navegador
    socket.on('connect', () => {
        console.log('Conectado ao servidor via WebSocket!');
    });
});