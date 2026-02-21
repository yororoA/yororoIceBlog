import React from 'react';
import LittlePop from '../littlePop';
import CommonBtn from '../../../../btn/commonBtn/commonBtn';
import styles from './styles.module.less';

const ToDraft = ({onDeny, onConfirm, onDismiss, message, title}) => {
  return (
    <LittlePop
      title={title && <span className={styles.title}>{title}</span>}
      onClose={onDismiss ? (proceed) => { onDismiss(); typeof proceed === 'function' && proceed(); } : undefined}
      footer={
        <div className={styles.btnGroup}>
          <CommonBtn className={styles.denyBtn} text={'deny'} onClick={onDeny}/>
          <CommonBtn className={styles.confirmBtn} text={'confirm'} onClick={onConfirm}/>
        </div>
      }
    >
      <p className={styles.message}>{message}</p>
    </LittlePop>
  );
};

export default ToDraft;
