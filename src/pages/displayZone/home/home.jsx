import React from 'react';
import homeStyles from './home.module.less';
import { PROFILE, SOCIAL_LINKS } from '../shared/profileInfo';

const Home = () => {
	return (
		<>
			<div className={`${homeStyles.container} page-enter`}>
				{/* Profile Card */}
				<div className={homeStyles.profileCard}>
					<div className={homeStyles.avatarSection}>
						{PROFILE.avatar ? (
							<img src={PROFILE.avatar} alt={PROFILE.author} className={homeStyles.avatar} />
						) : (
							<div className={homeStyles.avatarPlaceholder}>
								{PROFILE.author.charAt(0).toUpperCase()}
							</div>
						)}
					</div>
					<h2 className={homeStyles.authorName}>{PROFILE.author}</h2>
					<p className={homeStyles.description}>{PROFILE.description}</p>
					{PROFILE.bio && (
						<p className={homeStyles.bio}>{PROFILE.bio}</p>
					)}
					{PROFILE.email && (
						<p className={homeStyles.emailDisplay}>{PROFILE.email}</p>
					)}
					<div className={homeStyles.socialLinks}>
						{SOCIAL_LINKS.map(link => (
							<a
								key={link.name}
								href={link.url}
								target="_blank"
								rel="noopener noreferrer"
								className={homeStyles.socialLink}
								title={link.name}
							>
								<span className={homeStyles.linkText}>{link.name}</span>
							</a>
						))}
					</div>

					{/* Skills */}
					{PROFILE.skills.length > 0 && (
						<div className={homeStyles.skillsSection}>
							<h3 className={homeStyles.sectionTitle}>Skills</h3>
							<div className={homeStyles.tags}>
								{PROFILE.skills.map((skill, idx) => (
									<span key={idx} className={homeStyles.tag}>{skill}</span>
								))}
							</div>
						</div>
					)}

					{/* Interests */}
					{PROFILE.interests.length > 0 && (
						<div className={homeStyles.interestsSection}>
							<h3 className={homeStyles.sectionTitle}>Interests</h3>
							<div className={homeStyles.tags}>
								{PROFILE.interests.map((interest, idx) => (
									<span key={idx} className={homeStyles.tag}>{interest}</span>
								))}
							</div>
						</div>
					)}
				</div>
			</div>
		</>
	);
};

export default Home;
