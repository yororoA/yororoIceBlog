import React, { useCallback, useState } from 'react';
import entireCard from './entireLoginCard.module.less';
import lr from './lrCard.module.less';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { submitLoginWithFallback } from '../../../utils/submitLogin';
import { guestLogin } from '../../../utils/guestLogin';
import { t } from '../../../i18n/uiText';
import { getInitialUiLocale } from '../../../utils/uiLocale';

const LoginCard = () => {
	const navigate = useNavigate();
	const { locale } = useOutletContext() || {};
	const lang = locale || getInitialUiLocale();

	// 仅用用户名、密码控制登录按钮是否可点，Remember me 不参与
	const keys = ['username', 'password'].sort();
	const [info, setInfo] = useState({});
	const [completed, setCompleted] = useState(false);
	const checkCompletion = useCallback(e => {
		if (e.target.id === 'checkbox') return; // 勾选变化不触发 completed 重算
		const newInfo = {...info, [e.target.id]: e.target.value.length !== 0};
		setInfo(newInfo);
		const infoKeys = Object.keys(newInfo).sort();
		const done = infoKeys.length === keys.length && infoKeys.every((k, i) => k === keys[i]) && Object.values(newInfo).every(Boolean);
		setCompleted(!!done);
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
			const action = form.action || `${process.env.REACT_APP_SERVER_HOST}/api/login`;
			const formData = new FormData(form);
			const payload = Object.fromEntries(formData.entries());
			const result = await submitLoginWithFallback(payload, action);
			if (result?.ok && result?.data) {
				const { token, uid, username, migrated } = result.data;
				if (migrated) {
					console.log('您的密码已自动迁移到新格式，下次登录将使用新格式');
				}
				localStorage.removeItem('guest_token');
				localStorage.removeItem('guest_uid');
				const rememberMe = form.elements?.checkbox?.checked === true;
				if (token) {
					if (rememberMe) {
						localStorage.setItem('token', token);
						sessionStorage.removeItem('token');
					} else {
						sessionStorage.setItem('token', token);
						localStorage.removeItem('token');
					}
				}
				if (uid) {
					if (rememberMe) {
						localStorage.setItem('uid', `${uid}`);
						sessionStorage.removeItem('uid');
					} else {
						sessionStorage.setItem('uid', `${uid}`);
						localStorage.removeItem('uid');
					}
				}
				if (username != null && String(username).trim()) {
					if (rememberMe) {
						localStorage.setItem('username', String(username).trim());
						sessionStorage.removeItem('username');
					} else {
						sessionStorage.setItem('username', String(username).trim());
						localStorage.removeItem('username');
					}
				}
				navigate('/town');
			}
		} catch (err) {
			console.error('Login request failed:', err);
		}
	};

	const handleGuestLogin = async () => {
		try {
			await guestLogin();
			navigate('/town');
		} catch (err) {
			console.error('Guest login failed:', err);
		}
	};

	return (
		<div className={entireCard.entire}>
			<section className={entireCard.suggestion}>
				<div className={entireCard.suggestionHead}>
					<button
						type="button"
						className={entireCard.backBtn}
						onClick={() => navigate('/account')}
						title={t(lang, 'accountBackToAccount')}
						aria-label={t(lang, 'accountBackToAccount')}
					>
						<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
							<path d="M15 18l-6-6 6-6" />
						</svg>
					</button>
					<h2>{t(lang, 'accountLoginTitle')}</h2>
				</div>
				<h3>{t(lang, 'accountLoginNoAccount')}</h3>
				<h3 className={entireCard.lr} onClick={() => navigate('/account/register')}>{t(lang, 'accountLoginSignUp')}</h3>
			</section>
			<section className={lr.lr}>
				<form onChange={checkCompletion} onKeyDown={disableSpace} onSubmit={handleLoginSubmit} action={`${process.env.REACT_APP_SERVER_HOST}/api/login`} method="POST">
					<section>
						<label htmlFor="username">{t(lang, 'accountUsername')}</label>
						<input type="text" name="username" id="username" />
					</section>

					<section>
						<label htmlFor="password">{t(lang, 'accountPassword')}</label>
						<input type="password" name="password" id="password" />
					</section>

					<section className={lr.acknowledge}>
						<input type="checkbox" name="checkbox" id="checkbox" />
						<label htmlFor="checkbox" onClick={(e) => e.preventDefault()}>{t(lang, 'accountRememberMe')}</label>
					</section>

					<section>
						<button className={`${lr.login} ${completed && lr.completed}`} type="submit">{t(lang, 'accountLoginSubmit')}</button>
					</section>
					<section>
						<button type="button" className={lr.guest} onClick={handleGuestLogin}>{t(lang, 'accountContinueAsGuest')}</button>
					</section>
				</form>
			</section>
		</div>
	);
};

export default LoginCard;
