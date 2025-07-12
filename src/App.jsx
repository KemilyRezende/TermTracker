import { useState } from 'react'
import termTrackLogo from './assets/termTrackLogo.svg'
import Button from './components/Button/Button'
import Graph from './components/Graph/Graph'
import Table from './components/Table/Table'
import style from './app.module.css'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <header className={style.header} >
        <img src={termTrackLogo} alt="" className={style.logo}/>
      </header>

      <div className={style.main}>
        <Graph className={style.graph}></Graph>
        <Table className={style.table}></Table>
      </div>

      <footer className={style.footer}>
        <div className={style.buttons}>
          <Button color="red" text="Reiniciar" handleClick={() => {console.log("Reiniciar clicado")}}></Button>
          <Button color="red" text="Salvar" handleClick={() => {console.log("Salvar clicado")}}></Button>
        </div>
      </footer>
      
    </>
  )
}

export default App
