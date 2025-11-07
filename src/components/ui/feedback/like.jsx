import React from 'react';
import like from './like.module.less';


/*
* @props:
* `_id`,
* `type`
* `feedback`
* `onChange`
* `checked`*/
const Like = (props) => {
	const id = `${props._id}_${(props.type === 'moment') || (props.type === null) || (props.type === undefined) ? 'moment' : 'comment'}_like`;

	return (
		<div className={like.feedback}>
			<input type={"checkbox"} id={id} onChange={props.onChange} checked={props.checked}/>
			<label htmlFor={id}>
				<svg
					viewBox="0 0 27 27"
					xmlns="http://www.w3.org/2000/svg"
				>
					<path
						fillRule="evenodd"
						clipRule="evenodd"
						d="M0.7229 26.5H5.92292V10.9008H0.7229V26.5ZM26.6299 15.2618L24.372 23.7566C23.9989 25.3696 22.5621 26.5 20.9072 26.5H8.52293V10.9278L10.7573 2.87293C10.9669 1.50799 12.1418 0.5 13.524 0.5C15.0699 0.5 16.323 1.7527 16.323 3.29837V10.8998H23.1651C25.4519 10.9009 27.1453 13.0335 26.6299 15.2618Z"
						fill="currentColor"
					></path>
				</svg>
				<p>{props.likes}</p>
			</label>
		</div>
	);
};

export default Like;