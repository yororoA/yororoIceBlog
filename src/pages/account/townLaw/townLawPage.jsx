import React, { useEffect } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import TownLaw from '../../../components/ui/townLaw/townLaw';
import { townLawMarkdown } from '../../../config/townLawMarkdown';
import { t } from '../../../i18n/uiText';
import { getInitialUiLocale } from '../../../utils/uiLocale';
import page from './townLawPage.module.less';

const TownLawPage = () => {
	const navigate = useNavigate();
	const { locale } = useOutletContext() || {};
	const lang = locale || getInitialUiLocale();

	useEffect(() => {
		if (window.innerWidth > 960) {
			navigate('/account/register#town-law', { replace: true });
		}
	}, [navigate]);

	return (
		<section className={page.entire} id="town-law">
			<div className={page.head}>
				<h2>{t(lang, 'accountTownLaw')}</h2>
				<button type="button" onClick={() => navigate('/account/register')}>
					{t(lang, 'accountBackToRegister')}
				</button>
			</div>
			<TownLaw
				title={t(lang, 'accountTownLaw')}
				markdown={townLawMarkdown[lang] || townLawMarkdown.en}
				showHeader={false}
				usePageScroll={true}
				className={page.content}
			/>
		</section>
	);
};

export default TownLawPage;
