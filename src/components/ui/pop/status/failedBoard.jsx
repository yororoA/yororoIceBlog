import React, {useCallback, useEffect, useRef, useState} from 'react';
import {createPortal} from 'react-dom';
import CloseButton from '../../close/CloseButton';
import styles from './board.module.less';

/*
 * FailedBoard 失败提示板（右侧浮动，带自动关闭）
 *
 * Props:
 * - content?: ReactNode 文案，默认「操作失败」
 * - duration?: number 自动关闭时间 ms，默认 3000；0 / null 不自动消失
 * - closeAt?: number 可选，期望关闭的时间戳（用于堆叠时按加入顺序先后移出）
 * - onClose?: () => void 关闭时回调（在退出动画播完后调用）
 * - usePortal?: boolean 是否单独渲染到 portal，默认 true；在 StatusBoardStack 内传 false
 */
const portal = typeof document !== 'undefined'
	? document.getElementById('statusBoardPortal')
	: null;

const FAILED_DURATION = 3000;

const FailedBoard = ({ content = 'Failed', duration = FAILED_DURATION, closeAt, onClose, usePortal = true }) => {
	const [isShown, setIsShown] = useState(true);
	const [isClosing, setIsClosing] = useState(false);
	const wrapperRef = useRef(null);
	const onCloseRef = useRef(onClose);
	onCloseRef.current = onClose;

	const startClose = useCallback(() => {
		if (isClosing) return;
		setIsClosing(true);
	}, [isClosing]);

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
		<div ref={wrapperRef} className={`${styles.failedBoard} ${statusClass}`}>
			<div className={styles.iconWrapper} aria-hidden="true">
				<span className={styles.icon}>✕</span>
			</div>
			<div className={styles.content}>
				<p className={styles.message}>{content}</p>
			</div>
			<CloseButton onClick={startClose} className={styles.close}/>
		</div>
	);

	if (usePortal && portal) return createPortal(boardJsx, portal);
	return boardJsx;
};

export default FailedBoard;
