import React, {useCallback, useEffect, useRef, useState} from 'react';
import entireCard from './entireLoginCard.module.less';
import lr from './lrCard.module.less';
import {useNavigate} from "react-router-dom";
import sendVerificationCode from "../../../apis/sendVerificationCode";
import {submitRegister} from '../../../utils/submitRegister';

const RegisterCard = () => {
	// navigate to login
	const navigate = useNavigate();

	// check completion
	const keys = ['username', 'email', 'password', 'checkbox', 'verification'].sort();
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
			setCompleted(true);
		} else setCompleted(false);
	}, [keys, info]);

	// disable space input
	const disableSpace = useCallback(e => {
		if (e.key === ' ') e.preventDefault();
	}, []);

	// dis or enable send code with email
	const [email, setEmail] = useState(null);
	const disableCodeStyle = {
		pointerEvents: 'none',
		color: 'grey'
	}
	const [enableCode, setEnableCode] = useState(false);
	const handleCodeSendEnable = useCallback(e => {
		setEmail(e.target.value);
		const v = (e.target.value || '').trim();
		// 简单邮箱校验：本地@域名.后缀
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		setEnableCode(emailRegex.test(v));
	}, []);

	// code send countdown
	const [countdown, setCountdown] = useState(0);
	const intervalRef = useRef(null);
	const timeCountdown = () => {
		setCountdown(60);
		if (intervalRef.current) clearInterval(intervalRef.current);
		let timeLeft = 60;
		setEnableCode(false);
		intervalRef.current = setInterval(() => {
			timeLeft -= 1;
			setCountdown(timeLeft);
			if (timeLeft === 0) {
				setEnableCode(true);
				clearInterval(intervalRef.current);
				intervalRef.current = null;
			}
		}, 1000);
	}
	useEffect(() => {
		return () => {
			if (intervalRef.current) clearInterval(intervalRef.current);
		}
	}, []);


	// handle register form submit: prevent default, send JSON body using util, log response only
	const handleRegisterSubmit = useCallback(async (e) => {
		e.preventDefault();
		try {
			const form = e.currentTarget;
			const action = form.action || `${process.env.REACT_APP_SERVER_HOST}/api/register`;
			const formData = new FormData(form);
			const payload = Object.fromEntries(formData.entries());
			const result = await submitRegister(payload, action);
			if (result.ok) {
				const { token, uid, username } = result.data;
				localStorage.removeItem('guest_token');
				localStorage.removeItem('guest_uid');
				localStorage.setItem('token', token);
				localStorage.setItem('uid', uid);
				if (username != null && String(username).trim()) {
					localStorage.setItem('username', String(username).trim());
				}
				navigate('/town');
			} else throw new Error(result.data.message);
		} catch (err) {
			console.error('Register request failed:', err);
		}
	}, [navigate]);


	return (
		<div className={entireCard.entire}>
			<section className={entireCard.suggestion}>
				<h2>{'Create your account'}</h2>
				<h3>{"Have an account?"}</h3>
				<h3 className={entireCard.lr} onClick={() => navigate('/account/login')}>{'Login now'}</h3>
			</section>
			<section className={lr.lr}>
				<form onChange={checkCompletion} onKeyDown={disableSpace} onSubmit={handleRegisterSubmit}
							action={`${process.env.REACT_APP_SERVER_HOST}/api/register`}
							method={'POST'}>
					<section>
						<label htmlFor="username">{'Username'}</label>
						<input type="text" name="username" id="username"/>
					</section>

					<section>
						<label htmlFor="password">{'Password'}</label>
						<input type="password" name='password' id="password"/>
					</section>

					<section>
						<label htmlFor="email">{'Email'}</label>
						<input type="email" name='email' id="email" onChange={handleCodeSendEnable}/>
					</section>

					<section>
						<label htmlFor="verification">{'Verification'}</label>
						<div className={lr.verify}>
							<input type="text" name='verificationCode' id='verification' className={lr.verification}/>
							<span className={lr.able} style={!enableCode ? disableCodeStyle : undefined}
										onClick={async () => {
											const resp = await sendVerificationCode(email);
											if (resp.status === 200) {
												timeCountdown();
											}
										}}>{countdown === 0 ? 'Send Code' : `${countdown}s`}</span>
						</div>
					</section>

					<section className={lr.acknowledge}>
						<input type="checkbox" id="checkbox"/>
						<label htmlFor="checkbox" onClick={e => e.preventDefault()}>
							{'I agree the '}<span>{'Town Law'}</span>
						</label>
					</section>

					<section>
						<button className={`${lr.register} ${completed && lr.completed}`} type={"submit"}>{'Register'}</button>
					</section>
				</form>
			</section>
		</div>
	);
};

export default RegisterCard;