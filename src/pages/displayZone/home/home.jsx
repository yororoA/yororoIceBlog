import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { homeAnnouncementMarkdown } from '../../../config/announcementMarkdown';
import homeStyles from './home.module.less';

const Home = () => {
	return (
		<>
			<section id="header">
				<span>Notice</span>
			</section>
			<div className={homeStyles.container}>
				<article className={homeStyles.content}>
					<ReactMarkdown remarkPlugins={[remarkGfm]}>
						{homeAnnouncementMarkdown || ''}
					</ReactMarkdown>
				</article>
			</div>
		</>
	);
};

export default Home;
