from flask import Flask, render_template
from flask_socketio import SocketIO
import serial
import threading
import time

# --- Configurações ---
PORTA_SERIAL = '/dev/ttyACM0'  # <-- Verifique se a porta está correta
BAUDRATE_SERIAL = 9600

# --- Inicialização do App ---
app = Flask(__name__)
# A chave secreta não precisa ser complexa para este uso local
app.config['SECRET_KEY'] = 'secret!'
socketio = SocketIO(app)

# --- Thread para Leitura Serial ---
# Esta função rodará em segundo plano para não travar o servidor
def leitura_serial_thread():
    """Lê a porta serial continuamente e envia os dados via WebSocket."""
    while True:
        try:
            with serial.Serial(PORTA_SERIAL, BAUDRATE_SERIAL, timeout=2) as ser:
                print(f"Conectado à porta serial {PORTA_SERIAL}")
                while True:
                    try:
                        linha = ser.readline().decode('utf-8').strip()
                        if linha:
                            temp = float(linha)
                            # Emite um evento 'nova_temperatura' para todos os clientes conectados
                            socketio.emit('nova_temperatura', {'temp': temp})
                            print(f"Enviado: {temp}°C") # Log no console do servidor
                        # Pequeno delay para não sobrecarregar a CPU
                        socketio.sleep(1)
                    except (ValueError, UnicodeDecodeError):
                        # Ignora linhas que não são números ou que têm erro de decodificação
                        continue
        except serial.SerialException:
            print(f"Erro: Não foi possível conectar à porta {PORTA_SERIAL}. Tentando novamente em 5 segundos...")
            time.sleep(5)

# --- Rotas do Flask ---
@app.route('/')
def index():
    """Serve a página principal da interface."""
    return render_template('index.html')

@socketio.on('connect')
def test_connect():
    """Evento que é acionado quando um cliente se conecta."""
    print('Cliente Conectado')

# --- Execução Principal ---
if __name__ == '__main__':
    print("Iniciando servidor web e thread de leitura serial...")
    # Inicia a thread de leitura serial em modo 'daemon' para que ela feche junto com o programa principal
    thread = threading.Thread(target=leitura_serial_thread, daemon=True)
    thread.start()
    # Inicia o servidor Flask com suporte a SocketIO
    socketio.run(app, host='0.0.0.0', port=5000, debug=True, use_reloader=False)