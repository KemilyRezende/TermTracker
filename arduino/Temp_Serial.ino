// Inclusao das bibliotecas
#include <OneWire.h>
#include <DallasTemperature.h>

const int PINO_ONEWIRE = 12; // Define pino do sensor
OneWire oneWire(PINO_ONEWIRE); // Cria um objeto OneWire
DallasTemperature sensor(&oneWire); // Cria objeto do sensor
DeviceAddress endereco_temp; // Armazena endereço do sensor

void setup() {
  Serial.begin(9600);
  Serial.println("Iniciando medição de temperatura...");
  sensor.begin();
  
  // Localiza o sensor durante o setup
  if (!sensor.getAddress(endereco_temp, 0)) {
    Serial.println("Sensor não encontrado! Verifique a conexão.");
  } else {
    Serial.println("Sensor DS18B20 encontrado e pronto.");
  }
}

void loop() {
  sensor.requestTemperatures(); // Solicita leitura de temperatura
  
  // Verifica novamente se o sensor está conectado
  if (!sensor.getAddress(endereco_temp, 0)) {
    Serial.println("ERRO: Sensor desconectado!");
    delay(2000); // Espera mais tempo para evitar spam de mensagens
    return;
  }

  float tempC = sensor.getTempC(endereco_temp); // Lê temperatura
  
  // Formato otimizado para o Python (apenas o valor numérico)
  Serial.println(tempC, 1); // 1 casa decimal
  
  delay(1000); // Intervalo entre leituras
}
