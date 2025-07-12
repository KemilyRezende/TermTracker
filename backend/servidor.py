import time
import random
import serial
from flask import Flask
from flask_socketio import SocketIO, emit
from flask_cors import CORS

# ------------------- CONFIGURAÇÃO PRINCIPAL -------------------
# Altere esta linha para alternar entre os modos:
# True  -> Gera dados falsos (simulação) sem precisar do Arduino.
# False -> Tenta ler os dados do Arduino conectado na porta serial.
MODO_SIMULACAO = True
# -------------------------------------------------------------

# --- Configurações do Hardware (usar apenas se MODO_SIMULACAO = False) ---
PORTA_SERIAL = '/dev/ttyACM0'   # Alterar para a porta correta no seu Linux/Mac
# PORTA_SERIAL = 'COM4'         # Alterar para a porta correta no seu Windows
BAUDRATE = 9600

# --- Configuração do Servidor ---
app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}}) 
socketio = SocketIO(app, cors_allowed_origins="*")
thread = None

def ler_dados_serial():
    """MODO HARDWARE: Lê continuamente os dados da porta serial."""
    print("MODO HARDWARE: Tentando conectar ao Arduino...")
    try:
        ser = serial.Serial(PORTA_SERIAL, BAUDRATE, timeout=2)
        print(f"Conectado com sucesso na porta {PORTA_SERIAL}.")
        time.sleep(2)
    except Exception as e:
        print(f"!!!!!!!! ERRO AO CONECTAR NA PORTA SERIAL !!!!!!!!")
        print(f"Verifique se o Arduino está conectado na porta '{PORTA_SERIAL}' e tente novamente.")
        print(f"Erro técnico: {e}")
        return

    while True:
        try:
            linha = ser.readline().decode('utf-8').strip()
            if linha:
                temperatura = float(linha)
                print(f"Lido do Arduino: {temperatura}°C")
                socketio.emit('novo_dado_temperatura', {'temp': temperatura, 'tempo': time.time()})
        except Exception as e:
            print(f"Erro na leitura do Arduino: {e}")
            break
        socketio.sleep(0.5)

def simular_dados_temperatura():
    """MODO SIMULAÇÃO: Gera dados de temperatura falsos."""
    print("MODO SIMULAÇÃO: Gerando dados de temperatura falsos...")
    temp_base = 25.0
    while True:
        variacao = random.uniform(-0.15, 0.15)
        temp_simulada = temp_base + variacao
        temp_base = temp_simulada
        if not (20 < temp_base < 30): temp_base = 25.0 # Reseta se variar muito
        
        print(f"Dado simulado: {temp_simulada:.2f}°C")
        socketio.emit('novo_dado_temperatura', {'temp': temp_simulada, 'tempo': time.time()})
        socketio.sleep(1)

@socketio.on('connect')
def handle_connect():
    """Inicia a tarefa em background (real ou simulada) na primeira conexão."""
    global thread
    if thread is None:
        print("Cliente conectado! Iniciando a thread de dados.")
        if MODO_SIMULACAO:
            thread = socketio.start_background_task(target=simular_dados_temperatura)
        else:
            thread = socketio.start_background_task(target=ler_dados_serial)

if __name__ == '__main__':
    modo = "SIMULAÇÃO" if MODO_SIMULACAO else "HARDWARE"
    print(f"Iniciando o servidor em modo: {modo}")
    socketio.run(app, port=5001, debug=True)