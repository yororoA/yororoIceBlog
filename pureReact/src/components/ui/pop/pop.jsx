import React, {useEffect, useState, useRef} from 'react';
import {createPortal} from "react-dom";
import pop from './pop.module.less';


const portal1 = document.getElementById('portalSite');
const portal2 = document.getElementById('littlePopPortal');

const Pop = ({children, isLittle, onClose}) => {
	const [isClosing, setIsClosing] = useState(false);
	const [isVisible, setIsVisible] = useState(true);
	const itemRef = useRef(null);

	useEffect(() => {
		const html = document.querySelector('html');
		html.style.setProperty('--overflow', 'hidden');
		return () => {
			html.style.setProperty('--overflow', 'auto');
		}
	}, []);

	// 用户点击关闭时先通知父组件并传入 proceed；只有子组件调用 proceed() 后才执行关闭动画，从而支持“有未保存内容时先弹草稿确认”
	const closedRef = useRef(false);
	const onCloseRef = useRef(onClose);
	onCloseRef.current = onClose;
	const startClosingRef = useRef(() => setIsClosing(true));

	const handleClose = () => {
		if (isClosing) return;
		const proceed = startClosingRef.current;
		if (onCloseRef.current) onCloseRef.current(proceed);
		else proceed();
	};

	// 仅用 timeout 驱动关闭，避免 animationend 被子元素冒泡或多次触发导致 doClose 被调两次、关闭动画重播
	useEffect(() => {
		if (!isClosing) return;

		const doClose = () => {
			if (closedRef.current) return;
			closedRef.current = true;
			setIsVisible(false);
		};

		const timer = setTimeout(doClose, 320); // 与 slideDown 0.3s 对齐
		return () => clearTimeout(timer);
	}, [isClosing]);

	// 动画结束后再通知父组件（如 setEditing(false)），此时无参调用表示“已关闭”
	const onCloseCalledRef = useRef(false);
	useEffect(() => {
		if (!isVisible && !onCloseCalledRef.current) {
			onCloseCalledRef.current = true;
			onCloseRef.current?.();
		}
	}, [isVisible]);

	if (!isVisible) return null;

	return createPortal((
		<div className={`${pop.entire} ${isClosing ? pop.closing : ''}`} onClick={handleClose}>
			<div 
				ref={itemRef}
				className={`${pop.item} ${isClosing ? pop.itemClosing : ''}`} 
				onClick={e => e.stopPropagation()}
				onWheel={e => e.stopPropagation()}
			>
				<button
					type="button"
					className={pop.closeBtn}
					onClick={handleClose}
					aria-label="关闭"
					title="关闭"
				/>
				{children}
			</div>
		</div>
	), isLittle ? portal2 : portal1)
};

export default Pop;