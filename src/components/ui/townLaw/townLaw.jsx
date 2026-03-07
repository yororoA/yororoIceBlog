import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import styles from './townLaw.module.less';

const TownLaw = ({ markdown, title, className = '', id, showHeader = true, style, usePageScroll = false }) => {
	const contentStyle = usePageScroll
		? { maxHeight: 'none', overflow: 'visible' }
		: undefined;

	return (
		<section id={id} className={`${styles.entire} ${className}`} style={style}>
			{showHeader && (
				<header className={styles.header}>
					<h3>{title}</h3>
				</header>
			)}
			<article className={styles.content} style={contentStyle}>
				<ReactMarkdown remarkPlugins={[remarkGfm]}>
					{markdown || ''}
				</ReactMarkdown>
			</article>
		</section>
	);
};

export default TownLaw;
