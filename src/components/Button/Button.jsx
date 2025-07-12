import styles from './button.module.css'


function Button({color, text, handleClick}) {

  return (
    <>
      <button className={`${styles.button} ${styles[color]}`}  onClick={() => handleClick()}>
        <p className={styles.text}>{text}</p>
      </button>
    </>
  );
}

export default Button;