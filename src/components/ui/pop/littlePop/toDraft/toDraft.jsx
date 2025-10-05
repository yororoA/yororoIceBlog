import React from 'react';
import LittlePop from '../littlePop';
import CommonBtn from '../../../../btn/commonBtn/commonBtn';
import styles from './toDraft.module.less';

const ToDraft = ({onDeny, onConfirm}) => {
  return (
    <LittlePop
      title={<span className={styles.title}>close new moment edit</span>}
      width={500}
      footer={
        <div className={styles.btnGroup}>
          <CommonBtn className={styles.denyBtn} text={'deny'} onClick={onDeny}/>
          <CommonBtn className={styles.confirmBtn} text={'confirm'} onClick={onConfirm} type={'submit'}/>
        </div>
      }
    >
      <p className={styles.message}>{`whether to save edited content to draft(without saving pictures or videos)?`}</p>
    </LittlePop>
  );
};

export default ToDraft;
