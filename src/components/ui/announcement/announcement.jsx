import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import styles from './announcement.module.less';

const Announcement = ({ markdown, title = 'Announcement' }) => {
	return (
		<section className={styles.entire} onClick={e => e.stopPropagation()}>
			<header className={styles.header}>
				<h3>{title}</h3>
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
