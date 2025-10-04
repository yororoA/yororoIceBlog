import React from 'react';
import common from './commonBtn.module.less';

const CommonBtn = (props) => {
	return (
		<button type={props.type || "button"}
						disabled={props.disabled || false}
						className={`${common.common} ${(props.className !== null && props.className !== undefined) && props.className}`}
						onClick={(props.onClick && typeof props.onClick === "function") && props.onClick}>
			{props.text}
		</button>
	);
};

export default CommonBtn;