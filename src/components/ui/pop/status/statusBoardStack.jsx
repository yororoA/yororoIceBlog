import React from 'react';
import { createPortal } from 'react-dom';
import SuccessBoard from './successBoard';
import FailedBoard from './failedBoard';
import styles from './board.module.less';

const portal = typeof document !== 'undefined'
  ? document.getElementById('statusBoardPortal')
  : null;

/**
 * 在 portal 中渲染多个状态板（成功/失败堆叠）
 */
const STATUS_BOARD_DURATION = 3000;

const StatusBoardStack = ({ showConnected, onConnectedClose, successList, onRemoveSuccess, failedList = [], onRemoveFailed }) => {
  if (!portal) return null;

  return createPortal(
    <div className={styles.boardStack}>
      {showConnected && (
        <SuccessBoard content="Connected" duration={STATUS_BOARD_DURATION} onClose={onConnectedClose} usePortal={false} />
      )}
      {successList.map((item) => (
        <SuccessBoard
          key={item.id}
          content={item.content}
          closeAt={item.id + STATUS_BOARD_DURATION}
          onClose={() => onRemoveSuccess(item.id)}
          usePortal={false}
        />
      ))}
      {failedList.map((item) => (
        <FailedBoard
          key={item.id}
          content={item.content}
          closeAt={item.id + STATUS_BOARD_DURATION}
          onClose={() => onRemoveFailed(item.id)}
          usePortal={false}
        />
      ))}
    </div>,
    portal
  );
};

export default StatusBoardStack;
