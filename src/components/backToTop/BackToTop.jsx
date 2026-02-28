import React, { useState, useEffect, useCallback } from 'react';
import styles from './BackToTop.module.less';

/**
 * 回到顶部按钮。滚动超过阈值时显示，点击平滑滚动到顶部。
 * @param {React.RefObject<HTMLElement | null>} scrollContainerRef - 滚动容器 ref；为 null 或 current 为 null 时使用 window
 */
const BackToTop = ({ scrollContainerRef }) => {
	const [visible, setVisible] = useState(false);
	const threshold = 360;

	const getScrollElement = useCallback(() => {
		const el = scrollContainerRef?.current;
		return el && el.nodeType === 1 ? el : null;
	}, [scrollContainerRef]);

	const getScrollTop = useCallback(() => {
		const el = getScrollElement();
		if (el) return el.scrollTop;
		return window.scrollY ?? document.documentElement.scrollTop;
	}, [getScrollElement]);

	useEffect(() => {
		const el = getScrollElement();
		const target = el || document;
		const check = () => setVisible(getScrollTop() > threshold);
		check();
		target.addEventListener('scroll', check, { passive: true });
		return () => target.removeEventListener('scroll', check);
	}, [getScrollElement, getScrollTop]);

	const scrollToTop = useCallback(() => {
		const el = getScrollElement();
		const getTop = () => (el ? el.scrollTop : window.scrollY ?? document.documentElement.scrollTop);
		const setTop = (v) => {
			if (el) el.scrollTop = v;
			else window.scrollTo(0, v);
		};
		const start = getTop();
		if (start <= 0) return;
		const duration = 360;
		const startTime = performance.now();
		const easeOut = (t) => 1 - (1 - t) * (1 - t);
		const tick = (now) => {
			const elapsed = now - startTime;
			const t = Math.min(elapsed / duration, 1);
			setTop(start * (1 - easeOut(t)));
			if (t < 1) requestAnimationFrame(tick);
		};
		requestAnimationFrame(tick);
	}, [getScrollElement]);

	if (!visible) return null;

	return (
		<button
			type="button"
			className={styles.btn}
			onClick={scrollToTop}
			aria-label="Back to top"
		>
			<svg className={styles.icon} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
				<path d="M6 14l6-6 6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
			</svg>
		</button>
	);
};

export default BackToTop;
