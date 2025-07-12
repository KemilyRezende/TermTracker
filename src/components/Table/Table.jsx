import React, { useState } from "react";
import style from './table.module.css'
import Input from '../Input/Input';
import Button from "../Button/Button";
import generateTable from "../../js/generateTable"

function Table({}) {

  const [initialTemp, setInitialTemp] = useState("");
  const [deltaTemp, setDeltaTemp] = useState("");
  const [aliasingTemp, setAliasingTemp] = useState("");

  return (
    <>
        <div className={style.all}>
          <h1>Tabela de medições</h1>
          <div className={style.form} id="form">
            <Input text="T₀:" id="initialTemp" onChange={setInitialTemp} value={initialTemp} ></Input>
            <Input text="ΔT:" id="deltaTemp" onChange={setDeltaTemp} value={deltaTemp} ></Input>
            <Input text="Medições:" id="aliasingTemp" onChange={setAliasingTemp} value={aliasingTemp} ></Input>
            <Button color="blue" text="Gerar" handleClick={generateTable}></Button>
          </div>
          <div className={style.table} id="table">
            <p>Tabela aparecerá aqui</p>
          </div>
        </div>
    </>
  );
}

export default Table;