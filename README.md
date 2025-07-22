## Estrutura do Repositório

- `arduino/`: Diretório com o script Arduino utilizado no microcontrolador para funcionamento do equipamento.
- `src/`: Diretório com os scripts Python, HTML, CSS e JavaScript usados para a criação da plataforma web.

## Resumo

<div align="justify">

Este trabalho apresenta o desenvolvimento e a implementação de um sistema de monitoramento de temperatura baseado no sensor digital `DS18B20` à prova d’água, integrado a um microcontrolador `Arduino Uno R3` por meio de comunicação serial. As leituras são processadas em um servidor desenvolvido em `Python` com o framework `Flask`, e os dados são exibidos em tempo real por uma interface gráfica construída com `HTML5`, `CSS3` e `JavaScript`. O sistema permite tanto o acompanhamento contínuo da temperatura quanto a exportação automática de registros conforme parâmetros definidos pelo usuário. O projeto busca demonstrar a integração entre hardware e software, aliando conceitos de comunicação serial, obtenção de dados e visualização dinâmica.

</div>

## Compilação e Execução

<div align="justify">
Para executar o programa, siga os passos abaixo:

- Carregue o arquivo `.ino` em seu microcontrolador (Arduino Uno).
- Abra o terminal no diretório onde os arquivos do projeto estão localizados.
- Certifique-se de que as bibliotecas `flask`, `pyserial` estão instalados.

```bash
pip install flask pyserial
```

- Em seguida, execute o programa com o comando:

```bash
python app.py
```

A plataforma web será exibida na tela ao clicar no endereço web gerado automaticamente.
</div>