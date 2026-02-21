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

	const handleClose = () => {
		if (isClosing) return; // 防止重复触发
		setIsClosing(true);
	};

	// 先只隐藏自身，再在下一轮通知父组件，避免父组件重渲染导致 Pop 内容重挂载、关闭动画重播
	const closedRef = useRef(false);
	const onCloseRef = useRef(onClose);
	onCloseRef.current = onClose;

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

	// 在已渲染为 null 后再通知父组件关闭，避免父组件在动画未完全结束前重渲染导致关闭动画重播一次
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