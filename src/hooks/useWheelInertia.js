import { useEffect, useRef } from 'react';

const DAMPING = 0.88;
const VELOCITY_THRESHOLD = 0.5;
const MAX_VELOCITY = 38;

/**
 * 为滚动容器绑定滚轮惯性：松手后按当前速度继续滚动一段距离，阻尼减速至停止。
 * @param {React.RefObject<HTMLElement | null>} scrollContainerRef - 滚动容器 ref；为 null 或 current 为 null 时使用 window（document.documentElement）
 * @param {boolean} [enabled=true] - 为 false 时不绑定惯性滚动
 */
export function useWheelInertia(scrollContainerRef, enabled = true) {
	const velocityRef = useRef(0);
	const rafIdRef = useRef(null);
	const listenerTargetRef = useRef(null);

	useEffect(() => {
		if (!enabled) return;
		const getScrollElement = () => {
			const el = scrollContainerRef?.current;
			return el && el.nodeType === 1 ? el : document.documentElement;
		};
		const getMaxScroll = (el) => {
			if (el === document.documentElement) {
				return document.documentElement.scrollHeight - window.innerHeight;
			}
			return el.scrollHeight - el.clientHeight;
		};
		const getScrollTop = (el) => (el === document.documentElement ? window.scrollY || document.documentElement.scrollTop : el.scrollTop);
		const setScrollTop = (el, value) => {
			if (el === document.documentElement) {
				window.scrollTo({ top: value, left: 0 });
			} else {
				el.scrollTop = value;
			}
		};

		const el = getScrollElement();
		const isWindow = el === document.documentElement;
		const target = isWindow ? document : el;
		listenerTargetRef.current = target;

		const runInertia = () => {
			const scrollEl = getScrollElement();
			const maxScroll = Math.max(0, getMaxScroll(scrollEl));
			let v = velocityRef.current;
			if (Math.abs(v) < VELOCITY_THRESHOLD) {
				velocityRef.current = 0;
				rafIdRef.current = null;
				return;
			}
			const top = getScrollTop(scrollEl);
			let next = top + v;
			if (next <= 0) {
				next = 0;
				v = 0;
			} else if (next >= maxScroll) {
				next = maxScroll;
				v = 0;
			}
			setScrollTop(scrollEl, next);
			velocityRef.current = v * DAMPING;
			rafIdRef.current = requestAnimationFrame(runInertia);
		};

		const onWheel = (e) => {
			const scrollEl = getScrollElement();
			const maxScroll = Math.max(0, getMaxScroll(scrollEl));
			const top = getScrollTop(scrollEl);
			const delta = e.deltaY;
			// 若已到顶/底且继续往边界方向滚，不阻止默认（保留原生过界效果）
			if ((top <= 0 && delta <= 0) || (top >= maxScroll && delta >= 0)) return;
			e.preventDefault();
			velocityRef.current += delta;
			if (velocityRef.current > MAX_VELOCITY) velocityRef.current = MAX_VELOCITY;
			if (velocityRef.current < -MAX_VELOCITY) velocityRef.current = -MAX_VELOCITY;
			let next = top + delta;
			next = Math.max(0, Math.min(maxScroll, next));
			setScrollTop(scrollEl, next);
			if (rafIdRef.current == null) rafIdRef.current = requestAnimationFrame(runInertia);
		};

		target.addEventListener('wheel', onWheel, { passive: false });
		return () => {
			target.removeEventListener('wheel', onWheel, { passive: false });
			if (rafIdRef.current != null) cancelAnimationFrame(rafIdRef.current);
			rafIdRef.current = null;
			velocityRef.current = 0;
		};
	}, [scrollContainerRef, enabled]);
}
