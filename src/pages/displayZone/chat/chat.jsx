import React, { useContext } from 'react';
import styles from './chat.module.less';
import { UiPersistContext } from '../context/uiPersistContext';
import { t } from '../../../i18n/uiText';

const Chat = () => {
	const { locale } = useContext(UiPersistContext);

	return (
		<div className="page-enter">
			<main className={styles.page}>
				<header className={styles.header}>
					<h1 className={styles.title}>{t(locale, 'chatTitle')}</h1>
					<p className={styles.subtitle}>{t(locale, 'chatSubtitle')}</p>
				</header>
			</main>
		</div>
	);
};

export default Chat;
