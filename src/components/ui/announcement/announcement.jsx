import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import styles from './announcement.module.less';

const Announcement = ({ markdown, title = 'Announcement', showHeader = true, className = '', contentClassName = '' }) => {
	return (
		<section className={`${styles.entire} ${className}`.trim()} onClick={e => e.stopPropagation()}>
			{showHeader && (
				<header className={styles.header}>
					<h3>{title}</h3>
				</header>
			)}
			<article className={`${styles.content} ${contentClassName}`.trim()}>
				<ReactMarkdown remarkPlugins={[remarkGfm]}>
					{markdown || ''}
				</ReactMarkdown>
			</article>
		</section>
	);
};

export default Announcement;
