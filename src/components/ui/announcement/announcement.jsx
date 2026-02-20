import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import styles from './announcement.module.less';

const Announcement = ({ markdown, onClose }) => {
	const [dontShowAgain, setDontShowAgain] = React.useState(false);

	const handleClose = () => {
		onClose(dontShowAgain);
	};

	return (
		<section className={styles.entire} onClick={e => e.stopPropagation()}>
			<header className={styles.header}>
				<h3>{'公告'}</h3>
				<button type="button" className={styles.close} onClick={handleClose}>
					{'×'}
				</button>
			</header>
			<article className={styles.content}>
				<ReactMarkdown remarkPlugins={[remarkGfm]}>
					{markdown || ''}
				</ReactMarkdown>
			</article>
			<footer className={styles.footer}>
				<label className={styles.dontShow}>
					<input
						type="checkbox"
						checked={dontShowAgain}
						onChange={e => setDontShowAgain(e.target.checked)}
					/>
					<span>{'下次不再显示'}</span>
				</label>
				<button type="button" className={styles.confirmBtn} onClick={handleClose}>
					{'关闭'}
				</button>
			</footer>
		</section>
	);
};

export default Announcement;
