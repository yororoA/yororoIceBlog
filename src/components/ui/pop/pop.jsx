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

	// 监听动画结束事件
	useEffect(() => {
		if (!isClosing || !itemRef.current) return;
		
		const handleAnimationEnd = (e) => {
			// 检查是否是关闭动画结束
			if (e.animationName === 'slideDown' || e.animationName === 'fadeOut') {
				setIsVisible(false);
				onClose?.();
			}
		};
		
		const item = itemRef.current;
		const entire = item?.parentElement;
		
		if (item) {
			item.addEventListener('animationend', handleAnimationEnd);
		}
		if (entire) {
			entire.addEventListener('animationend', handleAnimationEnd);
		}
		
		return () => {
			if (item) {
				item.removeEventListener('animationend', handleAnimationEnd);
			}
			if (entire) {
				entire.removeEventListener('animationend', handleAnimationEnd);
			}
		};
	}, [isClosing, onClose]);

	if (!isVisible) return null;

	return createPortal((
		<div className={`${pop.entire} ${isClosing ? pop.closing : ''}`} onClick={handleClose}>
			<div 
				ref={itemRef}
				className={`${pop.item} ${isClosing ? pop.itemClosing : ''}`} 
				onClick={e => e.stopPropagation()}
			>
				{children}
			</div>
		</div>
	), isLittle ? portal2 : portal1)
};

export default Pop;