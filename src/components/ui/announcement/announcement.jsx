import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import styles from './announcement.module.less';

const Announcement = ({ markdown, onClose }) => {
	const handleClose = () => {
		onClose();
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
		</section>
	);
};

export default Announcement;
