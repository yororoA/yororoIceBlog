import React, { useContext } from 'react';
import homeStyles from './home.module.less';
import { PROFILE, SOCIAL_LINKS } from '../shared/profileInfo';
import { UiPersistContext } from '../context/uiPersistContext';
import { t } from '../../../i18n/uiText';
import { SuccessBoardContext } from '../../../components/ui/pop/status/successBoardContext';

const Home = () => {
	const { locale } = useContext(UiPersistContext);
	const { showSuccess } = useContext(SuccessBoardContext);
	const displayAuthor = t(locale, 'profileAuthor');
	const interestItems = t(locale, 'interestsItems');
	const handleCopyEmail = async () => {
		if (!PROFILE.email) return;
		try {
			await navigator.clipboard.writeText(PROFILE.email);
			showSuccess(t(locale, 'copiedEmail'));
		} catch (_) {}
	};
	return (
		<>
			<div className={`${homeStyles.container} page-enter`}>
				{/* Profile Card */}
				<div className={homeStyles.profileCard}>
					<div className={homeStyles.avatarSection}>
						{PROFILE.avatar ? (
							<img src={PROFILE.avatar} alt={displayAuthor} className={homeStyles.avatar} />
						) : (
							<div className={homeStyles.avatarPlaceholder}>
								{displayAuthor.charAt(0).toUpperCase()}
							</div>
						)}
					</div>
					<h2 className={homeStyles.authorName}>{displayAuthor}</h2>
					<p className={homeStyles.description}>{t(locale, 'profileDescription')}</p>
					{PROFILE.bio && (
						<p className={homeStyles.bio}>{PROFILE.bio}</p>
					)}
					{PROFILE.email && (
						<p className={homeStyles.emailDisplay} onClick={handleCopyEmail} title={t(locale, 'copyEmail')}>{PROFILE.email}</p>
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
							<h3 className={homeStyles.sectionTitle}>{t(locale, 'skillsTitle')}</h3>
							<div className={homeStyles.tags}>
								{PROFILE.skills.map((skill, idx) => (
									<span key={idx} className={homeStyles.tag}>{skill}</span>
								))}
							</div>
						</div>
					)}

					{/* Interests */}
					{Array.isArray(interestItems) && interestItems.length > 0 && (
						<div className={homeStyles.interestsSection}>
							<h3 className={homeStyles.sectionTitle}>{t(locale, 'interestsTitle')}</h3>
							<div className={homeStyles.tags}>
								{interestItems.map((interest, idx) => (
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
