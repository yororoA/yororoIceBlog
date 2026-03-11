import React, { useContext, useEffect, useMemo, useState } from 'react';
import homeStyles from './home.module.less';
import { PROFILE, SOCIAL_LINKS } from '../shared/profileInfo';
import { UiPersistContext } from '../context/uiPersistContext';
import { t } from '../../../i18n/uiText';
import { SuccessBoardContext } from '../../../components/ui/pop/status/successBoardContext';
import { MomentsListContext } from '../moments/context/momentsListContext';
import { KnowledgeListContext } from '../knowledge/context/knowledgeListContext';
import { useNavigate } from 'react-router-dom';
import binesImg from '../../../assets/images/bines.png';
import ProfileMiniCard from '../shared/profileMiniCard';
import MomentsCalendar from '../shared/momentsCalendar';

function getFirstImageAsCover(markdown) {
	if (!markdown || typeof markdown !== 'string') return { coverUrl: null, contentWithoutFirstImage: markdown || '' };
	const trimmed = markdown.trim();
	const lines = trimmed.split(/\r?\n/);
	const firstNonEmptyIndex = lines.findIndex(l => l.trim() !== '');
	if (firstNonEmptyIndex < 0) return { coverUrl: null, contentWithoutFirstImage: markdown };
	const firstLine = lines[firstNonEmptyIndex].trim();
	const imgMatch = firstLine.match(/^!\[[^\]]*\]\(([^)]+)\)$/);
	if (!imgMatch) return { coverUrl: null, contentWithoutFirstImage: markdown };
	const coverUrl = imgMatch[1].trim();
	const newLines = [...lines.slice(0, firstNonEmptyIndex), ...lines.slice(firstNonEmptyIndex + 1)];
	const contentWithoutFirstImage = newLines.join('\n').trim();
	return { coverUrl, contentWithoutFirstImage };
}

export function renderSocialIcon(name) {
	const n = String(name || '').toLowerCase();
	if (n.includes('github')) {
		return (
			<svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="currentColor">
				<path d="M10.303 16.652c-2.837-.344-4.835-2.385-4.835-5.028 0-1.074.387-2.235 1.031-3.008-.279-.709-.236-2.214.086-2.837.86-.107 2.02.344 2.708.967.816-.258 1.676-.386 2.728-.386 1.053 0 1.913.128 2.686.365.666-.602 1.848-1.053 2.708-.946.3.581.344 2.085.064 2.815.688.817 1.053 1.913 1.053 3.03 0 2.643-1.998 4.641-4.877 5.006.73.473 1.224 1.504 1.224 2.686v2.235c0 .644.537 1.01 1.182.752 3.889-1.483 6.94-5.372 6.94-10.185 0-6.081-4.942-11.044-11.022-11.044-6.081 0-10.98 4.963-10.98 11.044a10.84 10.84 0 0 0 7.112 10.206c.58.215 1.139-.172 1.139-.752v-1.719a2.768 2.768 0 0 1-1.032.215c-1.418 0-2.256-.773-2.857-2.213-.237-.58-.495-.924-.989-.988-.258-.022-.344-.129-.344-.258 0-.258.43-.451.86-.451.623 0 1.16.386 1.719 1.181.43.623.881.903 1.418.903.537 0 .881-.194 1.375-.688.365-.365.645-.687.903-.902Z" />
			</svg>
		);
	}
	if (n.includes('bili')) {
		return (
			<svg viewBox="0 0 18 18" fill="none" aria-hidden>
				<path fillRule="evenodd" clipRule="evenodd" d="M3.73252 2.67094C3.33229 2.28484 3.33229 1.64373 3.73252 1.25764C4.11291 0.890684 4.71552 0.890684 5.09591 1.25764L7.21723 3.30403C7.27749 3.36218 7.32869 3.4261 7.37081 3.49407H10.5789C10.6211 3.4261 10.6723 3.36218 10.7325 3.30403L12.8538 1.25764C13.2342 0.890684 13.8368 0.890684 14.2172 1.25764C14.6175 1.64373 14.6175 2.28484 14.2172 2.67094L13.364 3.49407H14C16.2091 3.49407 18 5.28493 18 7.49407V12.9996C18 15.2087 16.2091 16.9996 14 16.9996H4C1.79086 16.9996 0 15.2087 0 12.9996V7.49406C0 5.28492 1.79086 3.49407 4 3.49407H4.58579L3.73252 2.67094ZM4 5.42343C2.89543 5.42343 2 6.31886 2 7.42343V13.0702C2 14.1748 2.89543 15.0702 4 15.0702H14C15.1046 15.0702 16 14.1748 16 13.0702V7.42343C16 6.31886 15.1046 5.42343 14 5.42343H4ZM5 9.31747C5 8.76519 5.44772 8.31747 6 8.31747C6.55228 8.31747 7 8.76519 7 9.31747V10.2115C7 10.7638 6.55228 11.2115 6 11.2115C5.44772 11.2115 5 10.7638 5 10.2115V9.31747ZM12 8.31747C11.4477 8.31747 11 8.76519 11 9.31747V10.2115C11 10.7638 11.4477 11.2115 12 11.2115C12.5523 11.2115 13 10.7638 13 10.2115V9.31747C13 8.76519 12.5523 8.31747 12 8.31747Z" fill="currentColor" />
			</svg>
		);
	}
	if (n.includes('x')) {
		return (
			<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden>
				<path d="M21.742 21.75l-7.563-11.179 7.056-8.321h-2.456l-5.691 6.714-4.54-6.714H2.359l7.29 10.776L2.25 21.75h2.456l6.035-7.118 4.818 7.118h6.191-.008zM7.739 3.818L18.81 20.182h-2.447L5.29 3.818h2.447z" />
			</svg>
		);
	}
	// if (n.includes('steam')) {
	// 	return (
	// 		<img src="https://store.akamai.steamstatic.com/public/shared/images/header/logo_steam.svg?t=962016" alt="" loading="lazy" />
	// 	);
	// }
	return null;
}

const Home = () => {
	const navigate = useNavigate();
	const { locale, setLinksExpanded, setGuestbookExpanded, setLinksSelectedCategory } = useContext(UiPersistContext);
	const { showSuccess } = useContext(SuccessBoardContext);
	const [momentsData] = useContext(MomentsListContext);
	const [articlesData] = useContext(KnowledgeListContext);
	const [now, setNow] = useState(() => new Date());
	const [binesOnline, setBinesOnline] = useState(false);
	const [homeCalendarMode, setHomeCalendarMode] = useState('moments');
	const displayAuthor = t(locale, 'profileAuthor');
	const interestItems = t(locale, 'interestsItems');
	const effectiveMoments = momentsData;
	const effectiveArticles = articlesData;

	useEffect(() => {
		const tick = () => setNow(new Date());
		const id = setInterval(tick, 1000);
		return () => clearInterval(id);
	}, []);

	useEffect(() => {
		let timerId;
		const apiBase = process.env.REACT_APP_SERVER_HOST || '';
		const url = `${apiBase}/api/status/bines`;
		const fetchStatus = async () => {
			try {
				const resp = await fetch(url);
				const data = await resp.json().catch(() => ({}));
				if (resp.ok && data && typeof data.data?.online === 'boolean') {
					setBinesOnline(!!data.data.online);
				}
			} catch (e) {
				// ignore
			}
		};
		fetchStatus();
		timerId = setInterval(fetchStatus, 30000);
		return () => {
			if (timerId) clearInterval(timerId);
		};
	}, []);

	const latestMoment = useMemo(() => {
		if (!Array.isArray(effectiveMoments) || effectiveMoments.length === 0) return null;
		return [...effectiveMoments].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))[0];
	}, [effectiveMoments]);
	const latestArticle = useMemo(() => {
		if (!Array.isArray(effectiveArticles) || effectiveArticles.length === 0) return null;
		return [...effectiveArticles].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))[0];
	}, [effectiveArticles]);
	const toSnippet = (text, fallback = '') => {
		if (!text || typeof text !== 'string') return fallback;
		return text.replace(/\s+/g, ' ').trim();
	};
	const latestArticlePreview = useMemo(() => {
		if (!latestArticle?.content) return { coverUrl: null, contentWithoutFirstImage: '' };
		return getFirstImageAsCover(latestArticle.content);
	}, [latestArticle]);
	const localeTag = locale === 'zh' ? 'zh-CN' : locale === 'ja' ? 'ja-JP' : 'en-US';
	const formatPreviewTime = (value) => {
		if (!value) return '';
		const d = value instanceof Date ? value : new Date(value);
		if (Number.isNaN(d.getTime())) return '';
		return d.toLocaleString(localeTag, {
			year: 'numeric',
			month: '2-digit',
			day: '2-digit',
			hour: '2-digit',
			minute: '2-digit',
			hour12: false,
		});
	};
	const timeNowStr = now.toLocaleString(localeTag, {
		year: 'numeric',
		month: '2-digit',
		day: '2-digit',
		weekday: 'short',
		hour: '2-digit',
		minute: '2-digit',
		second: '2-digit',
		hour12: false,
	});
	const handleCopyEmail = async () => {
		if (!PROFILE.email) return;
		try {
			await navigator.clipboard.writeText(PROFILE.email);
			showSuccess(t(locale, 'copiedEmail'));
		} catch (_) {}
	};

	const handleShortcut = (action) => {
		if (action === 'moments') {
			navigate('/town/moments');
			return;
		}
		if (action === 'lol') {
			navigate('/town/lol');
			return;
		}
		if (action === 'articles') {
			navigate('/town/articles');
			return;
		}
		if (action === 'gallery') {
			navigate('/town/gallery');
			return;
		}
		if (action === 'friendLinks') {
			setLinksSelectedCategory('friend');
			setGuestbookExpanded(false);
			setLinksExpanded(true);
			navigate('/town/other');
			return;
		}
		if (action === 'toolLinks') {
			setLinksSelectedCategory('tool');
			setGuestbookExpanded(false);
			setLinksExpanded(true);
			navigate('/town/other');
			return;
		}
		if (action === 'guestbook') {
			setLinksExpanded(false);
			setGuestbookExpanded(true);
			navigate('/town/other?scroll=guestbook');
		}
		if (action === 'chat') {
			navigate('/town/chat');
			return;
		}
	};

	return (
		<>
			<div className={`${homeStyles.container} page-enter`}>
				<div className={homeStyles.homeGrid}>
					{/* Profile Card */}
					<div className={homeStyles.profileCard}>
						<div className={homeStyles.avatarAndBines}>
							<div className={homeStyles.avatarSection}>
								{PROFILE.avatar ? (
									<img src={PROFILE.avatar} alt={displayAuthor} className={homeStyles.avatar} loading="lazy" />
								) : (
									<div className={homeStyles.avatarPlaceholder}>
										{displayAuthor.charAt(0).toUpperCase()}
									</div>
								)}
							</div>
							<div className={homeStyles.binesRow}>
								<img src={binesImg} alt="Bines" className={homeStyles.binesAvatar} loading="lazy" />
								<div className={homeStyles.binesInfo}>
									<span className={homeStyles.binesName}>{t(locale, 'binesDisplayName')}</span>
									<span className={`${homeStyles.binesStatus} ${binesOnline ? homeStyles.binesStatusOnline : ''}`}>
										{binesOnline ? t(locale, 'statusOnline') : t(locale, 'statusOffline')}
									</span>
								</div>
							</div>
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
									<span className={homeStyles.linkIcon}>{renderSocialIcon(link.name)}</span>
									<span className={homeStyles.linkText}>{link.name}</span>
								</a>
							))}
						</div>
						<div className={homeStyles.profileCardFooter}>
							<span className={homeStyles.profileTimeLabel}>{t(locale, 'timeNow')}</span>
							<time dateTime={now.toISOString()} className={homeStyles.profileTimeValue}>{timeNowStr}</time>
						</div>
					</div>

					<div className={homeStyles.sideCards}>
						{/* Skills */}
						{PROFILE.skills.length > 0 && (
							<div className={homeStyles.infoCard}>
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
							<div className={homeStyles.infoCard}>
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
				<div className={homeStyles.shortcutStrip}>
					<button type="button" className={homeStyles.shortcutTag} onClick={() => handleShortcut('moments')}>{t(locale, 'shortcutViewMoments')}</button>
					<button type="button" className={homeStyles.shortcutTag} onClick={() => handleShortcut('chat')}>{t(locale, 'shortcutChat')}</button>
				<button type="button" className={homeStyles.shortcutTag} onClick={() => handleShortcut('lol')}>{t(locale, 'shortcutLol')}</button>
					<button type="button" className={homeStyles.shortcutTag} onClick={() => handleShortcut('articles')}>{t(locale, 'shortcutViewArticles')}</button>
					<button type="button" className={homeStyles.shortcutTag} onClick={() => handleShortcut('gallery')}>{t(locale, 'shortcutViewGallery')}</button>
					<button type="button" className={homeStyles.shortcutTag} onClick={() => handleShortcut('friendLinks')}>{t(locale, 'friendLinks')}</button>
					<button type="button" className={homeStyles.shortcutTag} onClick={() => handleShortcut('toolLinks')}>{t(locale, 'shortcutUsefulTools')}</button>
					<button type="button" className={homeStyles.shortcutTag} onClick={() => handleShortcut('guestbook')}>{t(locale, 'guestbookTitle')}</button>
				</div>
				<div className={homeStyles.mobileAssistGrid}>
					<div className={homeStyles.mobileAssistCol}>
						<ProfileMiniCard visible embedded githubOnly className={homeStyles.mobileGithubEmbed} />
					</div>
					<div className={homeStyles.mobileAssistCol}>
						<div className={homeStyles.mobileCalendarPanel}>
							<div className={homeStyles.mobileCalendarTabs} role="tablist" aria-label={t(locale, 'homeCalendarModeSwitch')}>
								<button
									type="button"
									role="tab"
									aria-selected={homeCalendarMode === 'moments'}
									className={`${homeStyles.mobileCalendarTab}${homeCalendarMode === 'moments' ? ` ${homeStyles.mobileCalendarTabActive}` : ''}`}
									onClick={() => setHomeCalendarMode('moments')}
								>
									{t(locale, 'navMoments')}
								</button>
								<button
									type="button"
									role="tab"
									aria-selected={homeCalendarMode === 'articles'}
									className={`${homeStyles.mobileCalendarTab}${homeCalendarMode === 'articles' ? ` ${homeStyles.mobileCalendarTabActive}` : ''}`}
									onClick={() => setHomeCalendarMode('articles')}
								>
									{t(locale, 'navArticles')}
								</button>
							</div>
							<MomentsCalendar visible embedded mode={homeCalendarMode} className={homeStyles.mobileCalendarEmbed} />
						</div>
					</div>
				</div>
				<div className={homeStyles.latestGrid}>
					<div
						className={`${homeStyles.previewCard}${latestMoment ? '' : ` ${homeStyles.previewCardDisabled}`}`}
						onClick={() => latestMoment && navigate(`/town/moments?mid=${latestMoment._id}`)}
					>
						<h3 className={homeStyles.sectionTitle}>{t(locale, 'latestMomentPreview')}</h3>
						{latestMoment ? (
							<>
								<p className={homeStyles.previewTitle}>{latestMoment.title || t(locale, 'moment')}</p>
								<p className={homeStyles.previewText}>{toSnippet(latestMoment.content, '...')}</p>
								<p className={homeStyles.previewMeta}>{t(locale, 'previewUploadedAt', formatPreviewTime(latestMoment.createdAt))}</p>
							</>
						) : (
							<p className={homeStyles.previewEmpty}>{t(locale, 'noMomentPreview')}</p>
						)}
					</div>

					<div
						className={`${homeStyles.previewCard}${latestArticle ? '' : ` ${homeStyles.previewCardDisabled}`}`}
						onClick={() => latestArticle && navigate(`/town/articles?kid=${latestArticle._id}`)}
					>
						<h3 className={homeStyles.sectionTitle}>{t(locale, 'latestArticlePreview')}</h3>
						{latestArticle ? (
							<>
								{latestArticlePreview.coverUrl && (
									<div className={homeStyles.articlePreviewCover}>
										<img src={latestArticlePreview.coverUrl} alt="" />
									</div>
								)}
								<p className={homeStyles.previewTitle}>{latestArticle.title || t(locale, 'article')}</p>
								<p className={homeStyles.previewMeta}>{t(locale, 'previewUploadedAt', formatPreviewTime(latestArticle.createdAt))}</p>
							</>
						) : (
							<p className={homeStyles.previewEmpty}>{t(locale, 'noArticlePreview')}</p>
						)}
					</div>
				</div>
			</div>
		</>
	);
};

export default Home;
