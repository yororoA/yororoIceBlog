import React from 'react';
import adminImg from '../../../assets/images/admin.png';
import homeStyles from './home.module.less';

const PROFILE = {
  author: 'yororoIce',
  avatar: adminImg,
  description: 'Time mends the wounds, love soothes the scars.',
  email: '3364817735song@gmail.com',
  github: 'https://github.com/yororoA',
  bilibili: 'https://space.bilibili.com/411513480',
  x: 'https://x.com/yororo_ice',
  steam: 'https://steamcommunity.com/profiles/76561199041131347/',
  skills: ['JavaScript', 'TypeScript', 'React', 'Node.js', 'Python', 'Docker', 'MongoDB'],
  interests: ['Coding', 'Photography', 'Travel', 'Reading', 'Music', 'Gaming', 'Anime'],
};

const socialLinks = [
  { name: 'GitHub', url: PROFILE.github, show: PROFILE.github },
  { name: 'BiliBili', url: PROFILE.bilibili, show: PROFILE.bilibili },
  { name: 'X (Twitter)', url: PROFILE.x, show: PROFILE.x },
  { name: 'Steam', url: PROFILE.steam, show: PROFILE.steam },
].filter(link => link.show);

const Home = () => {
	return (
		<>
			<section id="header">
				<span>Home</span>
			</section>
			<div className={homeStyles.container}>
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
						{socialLinks.map(link => (
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
