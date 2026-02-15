import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import CloseButton from '../../close/CloseButton';
import styles from './board.module.less';

/*
 * SuccessBoard 成功提示板（右侧浮动，带自动关闭）
 *
 * Props:
 * - title?: ReactNode    标题文案
 * - content?: ReactNode 内容区域（不传则显示默认“操作成功”）
 * - duration?: number    自动关闭时间，单位 ms，默认 1500；传入 0 / null 关闭自动消失
 * - onClose?: () => void 关闭时回调（包括自动关闭与手动点击关闭）
 */
const portal = typeof document !== 'undefined'
  ? document.getElementById('statusBoardPortal')
  : null;

const SuccessBoard = ({ content = '操作成功', duration = 1500, onClose }) => {
  const [isShown, setIsShown] = useState(true);
  const [isClosing, setIsClosing] = useState(false);
  const wrapperRef = useRef(null);

  const startClose = useCallback(() => {
    if (isClosing) return;
    setIsClosing(true);
    onClose && onClose();
  }, [isClosing, onClose]);

  // 等退出动画真正结束后再卸载，避免移除时抖一下
  useEffect(() => {
    if (!isClosing || !wrapperRef.current) return;
    const el = wrapperRef.current;
    const onAnimEnd = (e) => {
      if (e.animationName && String(e.animationName).includes('exit')) setIsShown(false);
    };
    el.addEventListener('animationend', onAnimEnd);
    return () => el.removeEventListener('animationend', onAnimEnd);
  }, [isClosing]);

  // 自动关闭逻辑
  useEffect(() => {
    if (!duration || duration <= 0) return;
    const timer = window.setTimeout(() => startClose(), duration);
    return () => window.clearTimeout(timer);
  }, [duration, startClose]);

  if (!isShown || !portal) return null;

  const statusClass = isClosing ? styles.exit : styles.enter;

  return createPortal(
    <div ref={wrapperRef} className={`${styles.successBoard} ${statusClass}`}>
      <div className={styles.iconWrapper} aria-hidden="true">
        <span className={styles.icon}>✓</span>
      </div>
      <div className={styles.content}>
        <p className={styles.message}>{content}</p>
      </div>
      <CloseButton onClick={startClose}/>
    </div>,
    portal
  );
};

export default SuccessBoard;