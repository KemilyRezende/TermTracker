import styles from './input.module.css'


function Input({text, onChange, id, value}) {

  const handleOnChange = (e) =>{
    onChange(e.target.value);
  }
  return (
    <>
      <div className={styles.comp}>
        <label htmlFor={id} className={styles.lbl}>{text}</label>
        <input
          type="number"
          value={value}
          onChange={handleOnChange}
          className={styles.inp}
        />
      </div>
    </>
  );
}

export default Input;