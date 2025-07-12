import serial
import matplotlib.pyplot as plt
import matplotlib.animation as animation
from collections import deque
import time

# Configurações
PORTA = 'COM4'       # Substitua pela sua porta
BAUDRATE = 9600
MAX_PONTOS = 100     # Número máximo de pontos no gráfico
INTERVALO = 200      # Intervalo de atualização em ms

class MonitorTemperatura:
    def __init__(self):
        # Inicialização da comunicação serial
        try:
            self.ser = serial.Serial(PORTA, BAUDRATE, timeout=2)
            time.sleep(2)  # Espera para estabilização
        except Exception as e:
            print(f"Erro na comunicação serial: {e}")
            exit(1)
        
        # Dados para o gráfico
        self.tempos = deque(maxlen=MAX_PONTOS)
        self.temperaturas = deque(maxlen=MAX_PONTOS)
        self.inicio = time.time()
        
        # Configuração do gráfico
        self.fig, self.ax = plt.subplots(figsize=(10, 6))
        self.linha, = self.ax.plot([], [], 'b-')
        self.ax.set_xlabel('Tempo (s)')
        self.ax.set_ylabel('Temperatura (°C)')
        self.ax.set_title('Monitor de Temperatura em Tempo Real')
        self.ax.grid(True)
        
        # Inicializa os limites dos eixos
        self.ax.set_xlim(0, 10)  # 10 segundos iniciais
        self.ax.set_ylim(20, 30) # Faixa inicial de temperatura
        
        # Texto para mostrar o último valor
        self.texto_temp = self.ax.text(0.02, 0.95, '', transform=self.ax.transAxes)
        
    def ler_serial(self):
        try:
            linha = self.ser.readline().decode('utf-8').strip()
            if linha:
                return float(linha)
        except Exception as e:
            print(f"Erro na leitura: {e}")
        return None
    
    def atualizar_grafico(self, frame):
        temp = self.ler_serial()
        if temp is not None:
            tempo_atual = time.time() - self.inicio
            self.temperaturas.append(temp)
            self.tempos.append(tempo_atual)
            
            # Atualiza os dados da linha
            self.linha.set_data(self.tempos, self.temperaturas)
            
            # Atualiza o texto com o último valor
            self.texto_temp.set_text(f'Temperatura: {temp:.2f} °C')
            
            # Ajuste dinâmico dos eixos
            self.ajustar_eixos()
        
        return self.linha, self.texto_temp
    
    def ajustar_eixos(self):
        """Ajusta os eixos x e y dinamicamente"""
        if len(self.tempos) > 1:
            # Ajuste do eixo X (tempo)
            margem_x = 0.1  # 10% de margem
            x_min = max(0, self.tempos[0])
            x_max = self.tempos[-1]
            delta_x = x_max - x_min
            self.ax.set_xlim(x_min - margem_x*delta_x, x_max + margem_x*delta_x)
            
            # Ajuste do eixo Y (temperatura)
            margem_y = 0.2  # 20% de margem
            y_min = min(self.temperaturas)
            y_max = max(self.temperaturas)
            delta_y = y_max - y_min
            
            # Limites mínimos para o eixo Y
            if delta_y < 2:  # Se a variação for muito pequena
                y_center = (y_min + y_max) / 2
                y_min = y_center - 1
                y_max = y_center + 1
            
            self.ax.set_ylim(y_min - margem_y*delta_y, y_max + margem_y*delta_y)
        
        self.fig.canvas.draw()  # Força a atualização do gráfico
    
    def executar(self):
        self.ani = animation.FuncAnimation(
            self.fig,
            self.atualizar_grafico,
            interval=INTERVALO,
            blit=True,
            cache_frame_data=False
        )
        plt.show()

if __name__ == "__main__":
    monitor = MonitorTemperatura()
    monitor.executar()