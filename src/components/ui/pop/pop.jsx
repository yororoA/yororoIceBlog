import React from 'react';
import {createPortal} from "react-dom";
import pop from './pop.module.less';


const portal = document.getElementById('portalSite');

const Pop = ({children}) => {
	return createPortal((
		<div className={pop.entire}>
			<div className={pop.item}>
				{children}
			</div>
		</div>
	), portal)
};

export default Pop;