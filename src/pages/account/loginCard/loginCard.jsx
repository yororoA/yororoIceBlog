import React, {useCallback, useState} from 'react';
import entireCard from './entireLoginCard.module.less';
import lr from './lrCard.module.less';
import {useNavigate} from "react-router-dom";
import { submitLogin } from '../../../utils/submitLogin';

const LoginCard = () => {
	// navigate to register
	const navigate = useNavigate();

	// check completion
	const keys = ['username', 'password', 'checkbox'].sort();
	const [info, setInfo] = useState({});
	const [completed, setCompleted] = useState(false);
	const checkCompletion = useCallback(e => {
		let newInfo;
		// check completion of the target now
		if (e.target.id === 'checkbox') {
			if (e.target.checked === true) newInfo = {...info, [e.target.id]: true};
			else newInfo = {...info, [e.target.id]: false};
		} else newInfo = {...info, [e.target.id]: e.target.value.length !== 0};
		setInfo(newInfo);
		// check all needs included
		const infoKeys = Object.keys(newInfo).sort();
		if (Object.values(newInfo).every(value => value === true)
			&& infoKeys.length === keys.length && infoKeys.every((k, i) => k === keys[i])) {
			console.log(true);
			setCompleted(true);
		} else setCompleted(false);
	}, [keys, info]);

	// disable space input
	const disableSpace = useCallback(e => {
		if (e.key === ' ') e.preventDefault();
	}, []);


	// handle login form submit: prevent default, send JSON via util; on success store token & uid then navigate
	const handleLoginSubmit = async (e) => {
		e.preventDefault();
		try {
			const form = e.currentTarget;
			const action = form.action || 'http://localhost:9999/api/login';
			const formData = new FormData(form);
			const payload = Object.fromEntries(formData.entries());
			const result = await submitLogin(payload, action);
			console.log('Login response:', result);
			if (result?.ok && result?.data) {
				const { token, uid } = result.data;
				if (token) localStorage.setItem('token', token);
				if (uid) localStorage.setItem('uid', `${uid}`);
				navigate('/town/moments');
			}
		} catch (err) {
			console.error('Login request failed:', err);
		}
	};

	return (
		<div className={entireCard.entire}>
			<section className={entireCard.suggestion}>
				<h2>{'Login to your account'}</h2>
				<h3>{"Don't have an account?"}</h3>
				<h3 className={entireCard.lr} onClick={() => navigate('/account/register')}>{'Sign Up'}</h3>
			</section>
			<section className={lr.lr}>
				<form onChange={checkCompletion} onKeyDown={disableSpace} onSubmit={handleLoginSubmit} action={'http://localhost:9999/api/login'} method={'POST'}>
					<section>
						<label htmlFor="username">{'Username'}</label>
						<input type="text" name="username" id="username"/>
					</section>

					<section>
						<label htmlFor="password">{'Password'}</label>
						<input type="password" name="password" id="password"/>
					</section>

					<section className={lr.acknowledge}>
						<input type="checkbox" name="checkbox" id="checkbox"/>
						<label htmlFor="checkbox" onClick={e=>e.preventDefault()}>{'Remember me'}</label>
					</section>

					<section>
						<button className={`${lr.login} ${completed && lr.completed}`} type={"submit"}>{'Login'}</button>
					</section>
				</form>
			</section>
		</div>
	);
};

export default LoginCard;


