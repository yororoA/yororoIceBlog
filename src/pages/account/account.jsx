import React, { useCallback, useEffect, useState, useRef } from 'react';
import page from './page.module.less';
import logo from '../../assets/images/logo.png';
import SwitchTheme from '../../components/switchTheme/switchTheme';
import { Outlet, useNavigate } from 'react-router-dom';
import CommonBtn from '../../components/btn/commonBtn/commonBtn';
import { useWheelInertia } from '../../hooks/useWheelInertia';
import BackToTop from '../../components/backToTop/BackToTop';
import { t } from '../../i18n/uiText';
import { getInitialUiLocale } from '../../utils/uiLocale';

const LOCALE_ORDER = ['en', 'zh', 'ja'];

// account page, no access with no account
const Account = () => {
	const [locale, setLocale] = useState(() => getInitialUiLocale());
	const [firstClick, setFirstClick] = useState(false);
	const navigate = useNavigate();
	const windowScrollRef = useRef(null);
	useWheelInertia(windowScrollRef);

	useEffect(() => {
		try {
			localStorage.setItem('ui_locale', locale);
		} catch (_) {}
	}, [locale]);

	const handleFirstClick = useCallback(() => {
		setFirstClick(true);
		navigate('./login');
	}, [navigate]);

	const pathname = window.location.pathname.split('/').at(-1);
	useEffect(() => {
		if (pathname === 'login' || pathname === 'register') setFirstClick(true);
		else setFirstClick(false);
	}, [pathname]);

	const handleSelectLocale = useCallback((next) => setLocale(next), []);
	const showBackBtn = pathname === 'login' || pathname === 'register';

	return (
		<div className={page.entire}>
			<nav>
				<img src={logo} alt="logo" />
				<div className={page.navRight}>
					<div className={page.localeSwitch} role="group" aria-label={t(locale, 'languageToggle')}>
						{LOCALE_ORDER.map((item) => (
							<button
								key={item}
								type="button"
								className={`${page.localeBtn} ${locale === item ? page.localeBtnActive : ''}`}
								onClick={() => handleSelectLocale(item)}
								aria-pressed={locale === item}
							>
								{item === 'en' ? t(locale, 'localeEn') : item === 'zh' ? t(locale, 'localeZh') : t(locale, 'localeJa')}
							</button>
						))}
					</div>
					<SwitchTheme />
				</div>
			</nav>

			<main className={showBackBtn ? page.mainTwoCol : ''}>
				<div className={`${page.welcome} ${firstClick && page.welComeFloat}`}>
					<h1>{firstClick ? t(locale, 'accountWelcomeBack') : t(locale, 'accountWelcome')}</h1>
					{firstClick && (
						<h3>
							{pathname === 'login' ? t(locale, 'accountLoginToJoin') : t(locale, 'accountRegisterToJoin')}
						</h3>
					)}
					{!firstClick && (
						<CommonBtn text={t(locale, 'accountClickToLogin')} onClick={handleFirstClick} />
					)}
				</div>
				<Outlet context={{ locale }} />
			</main>
			<BackToTop scrollContainerRef={windowScrollRef} />
		</div>
	);
};

export default Account;