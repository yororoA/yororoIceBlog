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
import TownLaw from '../../components/ui/townLaw/townLaw';
import { townLawMarkdown } from '../../config/townLawMarkdown';
import BirdsBackground from './BirdsBackground';

const ROBOTS_NOINDEX = 'noindex, nofollow';

const LOCALE_ORDER = ['en', 'zh', 'ja', 'de'];
const getLocaleLabelKey = (lang) => `locale${lang.charAt(0).toUpperCase()}${lang.slice(1)}`;

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

	// 账号/登录/注册页不纳入搜索引擎索引，避免重复内容与隐私
	useEffect(() => {
		let meta = document.querySelector('meta[name="robots"]');
		if (!meta) {
			meta = document.createElement('meta');
			meta.setAttribute('name', 'robots');
			document.head.appendChild(meta);
		}
		meta.setAttribute('content', ROBOTS_NOINDEX);
		return () => {
			if (meta && meta.parentNode) meta.remove();
		};
	}, []);

	const handleSelectLocale = useCallback((next) => setLocale(next), []);
	const isAuthFormRoute = pathname === 'login' || pathname === 'register';
	const isTownLawRoute = pathname === 'town-law';

	return (
		<div className={page.entire}>
			<BirdsBackground className={page.backgroundCanvas} />
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
								{t(locale, getLocaleLabelKey(item))}
							</button>
						))}
					</div>
					<SwitchTheme />
				</div>
			</nav>

			<main className={isAuthFormRoute ? page.mainTwoCol : ''}>
				{!isTownLawRoute && (
					<div className={`${page.welcome} ${firstClick && page.welComeFloat}`}>
						<h1>{firstClick ? t(locale, 'accountWelcomeBack') : t(locale, 'accountWelcome')}</h1>
						{firstClick && (
							<>
								<h3>
									{pathname === 'login' ? t(locale, 'accountLoginToJoin') : t(locale, 'accountRegisterToJoin')}
								</h3>
								<TownLaw
									title={t(locale, 'accountTownLaw')}
									markdown={townLawMarkdown[locale] || townLawMarkdown.en}
									className={page.wideTownLaw}
											narrowScrollbar
								/>
							</>
						)}
						{!firstClick && (
							<CommonBtn text={t(locale, 'accountClickToLogin')} onClick={handleFirstClick} />
						)}
					</div>
				)}
				<Outlet context={{ locale }} />
			</main>
			<BackToTop scrollContainerRef={windowScrollRef} />
		</div>
	);
};

export default Account;