import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import styles from './townLaw.module.less';

const TownLaw = ({ markdown, title, className = '', id, showHeader = true, style, usePageScroll = false, narrowScrollbar = false, contentMaxHeight }) => {
	const contentStyle = usePageScroll
		? { maxHeight: 'none', overflow: 'visible' }
		: (contentMaxHeight ? { maxHeight: contentMaxHeight } : undefined);

	return (
		<section id={id} className={`${styles.entire} ${className}`} style={style}>
			{showHeader && (
				<header className={styles.header}>
					<h3>{title}</h3>
				</header>
			)}
			<article className={`${styles.content}${narrowScrollbar ? ` ${styles.contentNarrowScrollbar}` : ''}`} style={contentStyle}>
				<ReactMarkdown remarkPlugins={[remarkGfm]}>
					{markdown || ''}
				</ReactMarkdown>
			</article>
		</section>
	);
};

export default TownLaw;
