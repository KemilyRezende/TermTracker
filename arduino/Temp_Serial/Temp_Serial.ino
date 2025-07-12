/*
// Inclusao das bibliotecas
#include <OneWire.h>
#include <DallasTemperature.h>

const int PINO_ONEWIRE = 12; // Define pino do sensor
OneWire oneWire(PINO_ONEWIRE); // Cria um objeto OneWire
DallasTemperature sensor(&oneWire); // Informa a referencia da biblioteca dallas temperature para Biblioteca onewire
DeviceAddress endereco_temp; // Cria um endereco temporario da leitura do sensor

void setup() {
  Serial.begin(9600); // Inicia a porta serial
  Serial.println("Medindo Temperatura"); // Imprime a mensagem inicial
  sensor.begin(); ; // Inicia o sensor
}
  
void loop() {
  sensor.requestTemperatures(); // Envia comando para realizar a conversão de temperatura
  if (!sensor.getAddress(endereco_temp,0)) { // Encontra o endereco do sensor no barramento
    Serial.println("SENSOR NAO CONECTADO"); // Sensor conectado, imprime mensagem de erro
  } else {
    float tempC = sensors.getTempCByIndex(0);
  
  // Envia apenas o valor numérico, sem texto adicional
    Serial.println(tempC);
    Serial.print("Temperatura = "); // Imprime a temperatura no monitor serial
    Serial.println(sensor.getTempC(endereco_temp), 1); // Busca temperatura para dispositivo
  }
  delay(1000);
}
*/

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
