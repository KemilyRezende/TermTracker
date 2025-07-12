import React, { useState, useEffect } from "react";
import styles from "./graph.module.css";
import io from "socket.io-client";

const socket = io("http://localhost:5001");

function Graph() {
  const [temperaturaAtual, setTemperaturaAtual] = useState(
    "Aguardando dados..."
  );
  useEffect(() => {
    const handleNewData = (data) => {
      const tempFormatada = parseFloat(data.temp).toFixed(2);
      setTemperaturaAtual(`${tempFormatada} °C`);
      console.log("Dado recebido:", data);
    };
    socket.on("novo_dado_temperatura", handleNewData);
    return () => {
      socket.off("novo_dado_temperatura", handleNewData);
    };
  }, []);

  return (
    <div className={styles.all}>
      <h1>Leitura do termômetro:</h1>
      {/* Exibe a temperatura atual */}
      <h2 style={{ fontSize: "48px", color: "#D27835" }}>{temperaturaAtual}</h2>
      {/* Adicionar biblioteca de gráficos*/}
    </div>
  );
}

export default Graph;
