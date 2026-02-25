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

const Home = () => {
	const navigate = useNavigate();
	const { locale, setLinksExpanded, setGuestbookExpanded, setLinksSelectedCategory } = useContext(UiPersistContext);
	const { showSuccess } = useContext(SuccessBoardContext);
	const [momentsData] = useContext(MomentsListContext);
	const [articlesData] = useContext(KnowledgeListContext);
	const [now, setNow] = useState(() => new Date());
	const [binesOnline, setBinesOnline] = useState(false);
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
									<img src={PROFILE.avatar} alt={displayAuthor} className={homeStyles.avatar} />
								) : (
									<div className={homeStyles.avatarPlaceholder}>
										{displayAuthor.charAt(0).toUpperCase()}
									</div>
								)}
							</div>
							<div className={homeStyles.binesRow}>
								<img src={binesImg} alt="Bines" className={homeStyles.binesAvatar} />
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
					<button type="button" className={homeStyles.shortcutTag} onClick={() => handleShortcut('articles')}>{t(locale, 'shortcutViewArticles')}</button>
					<button type="button" className={homeStyles.shortcutTag} onClick={() => handleShortcut('gallery')}>{t(locale, 'shortcutViewGallery')}</button>
					<button type="button" className={homeStyles.shortcutTag} onClick={() => handleShortcut('friendLinks')}>{t(locale, 'friendLinks')}</button>
					<button type="button" className={homeStyles.shortcutTag} onClick={() => handleShortcut('toolLinks')}>{t(locale, 'shortcutUsefulTools')}</button>
					<button type="button" className={homeStyles.shortcutTag} onClick={() => handleShortcut('guestbook')}>{t(locale, 'guestbookTitle')}</button>
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
