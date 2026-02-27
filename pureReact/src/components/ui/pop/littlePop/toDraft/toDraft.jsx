import React, { useContext } from 'react';
import LittlePop from '../littlePop';
import CommonBtn from '../../../../btn/commonBtn/commonBtn';
import styles from './styles.module.less';
import { UiPersistContext } from '../../../../../pages/displayZone/context/uiPersistContext';
import { t } from '../../../../../i18n/uiText';

const ToDraft = ({onDeny, onConfirm, onDismiss, message, title, denyText, confirmText}) => {
  const { locale } = useContext(UiPersistContext);
  return (
    <LittlePop
      title={title && <span className={styles.title}>{title}</span>}
      onClose={onDismiss ? (proceed) => { onDismiss(); typeof proceed === 'function' && proceed(); } : undefined}
      footer={
        <div className={styles.btnGroup}>
          <CommonBtn className={styles.denyBtn} text={denyText || t(locale, 'deny')} onClick={onDeny}/>
          <CommonBtn className={styles.confirmBtn} text={confirmText || t(locale, 'confirm')} onClick={onConfirm}/>
        </div>
      }
    >
      <p className={styles.message}>{message}</p>
    </LittlePop>
  );
};

export default ToDraft;
