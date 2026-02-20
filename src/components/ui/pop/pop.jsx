import React, {useEffect} from 'react';
import {createPortal} from "react-dom";
import pop from './pop.module.less';


const portal1 = document.getElementById('portalSite');
const portal2 = document.getElementById('littlePopPortal');

const Pop = ({children, isLittle, onClose}) => {
	useEffect(() => {
		const html = document.querySelector('html');
		html.style.setProperty('--overflow', 'hidden');
		return () => {
			html.style.setProperty('--overflow', 'auto');
		}
	}, []);


	return createPortal((
		<div className={pop.entire} onClick={onClose}>
			<div className={pop.item} onClick={e => e.stopPropagation()}>
				{children}
			</div>
		</div>
	), isLittle ? portal2 : portal1)
};

export default Pop;