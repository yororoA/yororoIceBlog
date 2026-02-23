import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import styles from './board.module.less';

/*
 * SuccessBoard 成功提示板（右侧浮动，带自动关闭）
 *
 * Props:
 * - content?: ReactNode 内容区域（不传则显示默认“操作成功”）
 * - duration?: number    自动关闭时间，单位 ms，默认 3000；传入 0 / null 不自动消失
 * - closeAt?: number     可选，期望关闭的时间戳（用于堆叠时按加入顺序先后移出）
 * - onClose?: () => void 关闭时回调（在退出动画播完后调用，保证先后顺序）
 * - usePortal?: boolean  是否单独渲染到 statusBoardPortal（默认 true）；在 StatusBoardStack 内使用时传 false，由父组件统一 portal
 */
const portal = typeof document !== 'undefined'
  ? document.getElementById('statusBoardPortal')
  : null;

const SuccessBoard = ({ content = 'Done', duration = 3000, closeAt, onClose, usePortal = true }) => {
  const [isShown, setIsShown] = useState(true);
  const [isClosing, setIsClosing] = useState(false);
  const wrapperRef = useRef(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  // 只触发退出动画，不立刻调用 onClose，等 animationend 再移出，保证先播完再让下一个开始
  const startClose = useCallback(() => {
    if (isClosing) return;
    setIsClosing(true);
  }, [isClosing]);

  // 退出动画结束后再调用 onClose 从列表移除，实现先后移出
  useEffect(() => {
    if (!isClosing || !wrapperRef.current) return;
    const el = wrapperRef.current;
    const onAnimEnd = (e) => {
      if (e.animationName && String(e.animationName).includes('exit')) {
        onCloseRef.current && onCloseRef.current();
        setIsShown(false);
      }
    };
    el.addEventListener('animationend', onAnimEnd);
    return () => el.removeEventListener('animationend', onAnimEnd);
  }, [isClosing]);

  // 自动关闭：支持 closeAt（按时间戳先后）或 duration（从挂载起计时）
  useEffect(() => {
    const delay = closeAt != null
      ? Math.max(0, closeAt - Date.now())
      : (duration > 0 ? duration : 0);
    if (delay <= 0) return;
    const timer = window.setTimeout(() => startClose(), delay);
    return () => window.clearTimeout(timer);
  }, [duration, closeAt, startClose]);

  if (!isShown) return null;

  const statusClass = isClosing ? styles.exit : styles.enter;

  const boardJsx = (
    <div ref={wrapperRef} className={`${styles.successBoard} ${statusClass}`}>
      <div className={styles.iconWrapper} aria-hidden="true">
        <span className={styles.icon}>✓</span>
      </div>
      <div className={styles.content}>
        <p className={styles.message}>{content}</p>
      </div>
    </div>
  );

  if (usePortal && portal) return createPortal(boardJsx, portal);
  return boardJsx;
};

export default SuccessBoard;