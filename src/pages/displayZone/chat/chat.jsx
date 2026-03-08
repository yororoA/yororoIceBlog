import React, { useContext, useRef, useCallback, useState, useMemo, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import styles from './chat.module.less';
import { UiPersistContext } from '../context/uiPersistContext';
import { SuccessBoardContext } from '../../../components/ui/pop/status/successBoardContext';
import { t } from '../../../i18n/uiText';
import { useChat } from './context/chatContext';
import { uploadChatMedia } from '../../../utils/chat';
import IvPreview from '../../../components/ui/image_video_preview/ivPreview';
import { getIdentityAvatar, ADMIN_UIDS, BINES_UID, isLikelyGuestUser } from '../../../utils/userAvatar';

const VIDEO_EXT = /\.(mp4|webm|ogg|mov|avi|mkv)(\?|$)/i;
function inferMediaType(url) {
	return VIDEO_EXT.test(url || '') ? 'video' : 'image';
}

function normalizeImgurl(imgurl) {
	if (Array.isArray(imgurl)) return imgurl.filter(Boolean);
	return imgurl ? [imgurl] : [];
}

function getMsgAvatar(msg) {
	if (!msg) return { avatarImg: null, avatarLetter: null, avatarColor: null };
	const uid = msg.uid || '';
	const name = msg.username || uid || '';
	return getIdentityAvatar(uid, name, { stripGuestPrefixForGuest: true });
}

function getIdentityTag(uid, name = '') {
	if (uid === BINES_UID) return { text: 'BINES', tone: 'privileged' };
	if (uid === 'admin' || ADMIN_UIDS.includes(uid)) return { text: 'ADMIN', tone: 'privileged' };
	if (isLikelyGuestUser(uid, name)) return { text: 'GUEST', tone: 'guest' };
	return { text: 'USER', tone: 'member' };
}

function getConvAvatar(conv) {
	if (!conv) return { avatarImg: null, avatarLetter: null, avatarColor: null };
	if (conv.id === 'group') {
		return getIdentityAvatar('group', 'G');
	}
	const label = conv.label || conv.id || '';
	return getIdentityAvatar(conv.id, label, { stripGuestPrefixForGuest: true });
}

function formatTime(date) {
	if (!date) return '';
	const d = date instanceof Date ? date : new Date(date);
	if (Number.isNaN(d.getTime())) return '';
	return d.toLocaleString('zh-CN', {
		year: '2-digit',
		month: '2-digit',
		day: '2-digit',
		hour: '2-digit',
		minute: '2-digit',
		hour12: false,
	});
}

const THREE_MIN_MS = 3 * 60 * 1000;

function shouldShowTimeAbove(messages, index) {
	if (!messages?.length || index < 0) return false;
	const cur = messages[index]?.createdAt;
	const prev = index > 0 ? messages[index - 1]?.createdAt : null;
	if (!cur) return false;
	const curMs = cur instanceof Date ? cur.getTime() : +new Date(cur);
	const prevMs = prev ? (prev instanceof Date ? prev.getTime() : +new Date(prev)) : 0;
	return index === 0 || curMs - prevMs > THREE_MIN_MS;
}

function ChatContent() {
	const location = useLocation();
	const navigate = useNavigate();
	const { locale } = useContext(UiPersistContext);
	const { showFailed } = useContext(SuccessBoardContext) || {};
	const {
		conversations,
		activeId,
		messages,
		canLoadMoreRendered,
		canLoadMoreHistory,
		loading,
		sending,
		loadMoreRendered,
		loadMoreHistory,
		handleSend,
		selectConversation,
	} = useChat();
	const [inputValue, setInputValue] = useState('');
	const [selectedMedia, setSelectedMedia] = useState([]);
	const [uploading, setUploading] = useState(false);
	const [enlargedMsgId, setEnlargedMsgId] = useState(null);
	const [enlargedIndex, setEnlargedIndex] = useState(null);
	const [isMobile, setIsMobile] = useState(() => window.innerWidth <= 768);
	const messagesRef = useRef(null);
	const fileInputRef = useRef(null);
	const selectedMediaRef = useRef([]);
	const skipScrollToBottomRef = useRef(false);
	const savedScrollTopRef = useRef(null);
	const savedScrollHeightRef = useRef(null);
	selectedMediaRef.current = selectedMedia;

	useEffect(() => {
		const onResize = () => setIsMobile(window.innerWidth <= 768);
		window.addEventListener('resize', onResize);
		return () => window.removeEventListener('resize', onResize);
	}, []);

	const routeMode = useMemo(() => {
		const p = location.pathname.replace(/\/$/, '');
		if (p.endsWith('/group')) return 'group';
		if (p.endsWith('/private')) return 'private';
		return 'index';
	}, [location.pathname]);

	const privateAnchor = useMemo(() => {
		const raw = (location.hash || '').replace(/^#/, '').trim();
		if (!raw) return '';
		try {
			return decodeURIComponent(raw);
		} catch (_) {
			return raw;
		}
	}, [location.hash]);

	React.useEffect(() => () => {
		selectedMediaRef.current.forEach((m) => {
			if (m?.previewUrl) URL.revokeObjectURL(m.previewUrl);
		});
	}, []);

	// 仅在新消息在底部时（如发送/接收）滚到底；加载更多历史/多渲染一批时保持视觉位置，避免被顶部的插入内容“推离”导致需再次上滚才能触发
	React.useEffect(() => {
		const el = messagesRef.current;
		if (skipScrollToBottomRef.current) {
			skipScrollToBottomRef.current = false;
			const savedTop = savedScrollTopRef.current;
			const savedHeight = savedScrollHeightRef.current;
			savedScrollTopRef.current = null;
			savedScrollHeightRef.current = null;
			if (el != null && savedTop != null && savedHeight != null) {
				requestAnimationFrame(() => {
					const node = messagesRef.current;
					if (node) node.scrollTop = savedTop + (node.scrollHeight - savedHeight);
				});
			}
			return;
		}
		if (el && messages.length > 0) el.scrollTop = el.scrollHeight - el.clientHeight;
	}, [messages.length]);

	// 当内容区无滚动条时（5 条消息不足以撑满），自动多渲染一批，直到可滚动或已全部渲染，避免“无法滚动所以无法加载更多”的死锁
	React.useEffect(() => {
		if (!canLoadMoreRendered || !messagesRef.current) return;
		const el = messagesRef.current;
		const ensureScrollable = () => {
			if (!el || !canLoadMoreRendered) return;
			const needMore = el.scrollHeight <= el.clientHeight;
			if (needMore) loadMoreRendered();
		};
		const id = requestAnimationFrame(ensureScrollable);
		return () => cancelAnimationFrame(id);
	}, [messages.length, canLoadMoreRendered, loadMoreRendered]);

	const onScroll = useCallback(() => {
		const el = messagesRef.current;
		if (!el) return;
		if (el.scrollTop <= 10 && (canLoadMoreRendered || canLoadMoreHistory)) {
			skipScrollToBottomRef.current = true;
			savedScrollTopRef.current = el.scrollTop;
			savedScrollHeightRef.current = el.scrollHeight;
			if (canLoadMoreRendered) {
				loadMoreRendered();
			} else if (canLoadMoreHistory) {
				loadMoreHistory();
			}
		}
	}, [canLoadMoreRendered, canLoadMoreHistory, loadMoreRendered, loadMoreHistory]);

	const handleFileSelect = useCallback((e) => {
		const files = e.target.files;
		if (!files || files.length === 0) return;
		const next = [];
		for (let i = 0; i < files.length; i++) {
			const file = files[i];
			const type = file.type.startsWith('video/') ? 'video' : 'image';
			next.push({ file, previewUrl: URL.createObjectURL(file), type });
		}
		setSelectedMedia((prev) => [...prev, ...next]);
		if (fileInputRef.current) fileInputRef.current.value = '';
	}, []);

	const removeSelectedMedia = useCallback((index) => {
		setSelectedMedia((prev) => {
			const item = prev[index];
			if (item?.previewUrl) URL.revokeObjectURL(item.previewUrl);
			return prev.filter((_, i) => i !== index);
		});
	}, []);

	const doSend = useCallback(() => {
		const hasText = inputValue.trim();
		const hasMedia = selectedMedia.length > 0;
		if ((!hasText && !hasMedia) || sending) return;
		const files = selectedMedia.map((m) => m.file);
		const previewUrls = selectedMedia.map((m) => m.previewUrl);
		const sendPayload = () => {
			if (files.length === 0) {
				return handleSend(hasText ? inputValue.trim() : '', []);
			}
			setUploading(true);
			return uploadChatMedia(files)
				.then((urls) => handleSend(hasText ? inputValue.trim() : '', urls))
				.finally(() => setUploading(false));
		};
		sendPayload().then((ok) => {
			if (ok) {
				previewUrls.forEach((url) => url && URL.revokeObjectURL(url));
				setInputValue('');
				setSelectedMedia([]);
			}
		}).catch((err) => {
			showFailed?.(err.message || t(locale, 'galleryUploadFailed'));
		});
	}, [inputValue, selectedMedia, sending, handleSend, locale, showFailed]);

	const getConvLabel = useCallback((conv) => {
		if (conv.labelKey) return t(locale, conv.labelKey);
		const { displayName } = getIdentityAvatar(conv.id, conv.label || conv.id || '', { stripGuestPrefixForGuest: true });
		return displayName || conv.id;
	}, [locale]);

	const resolvePrivateConv = useCallback((anchorName = '') => {
		const privateConvs = conversations.filter((c) => c.type === 'private');
		if (privateConvs.length === 0) return null;
		if (!anchorName) return privateConvs[0];
		const normalized = anchorName.trim().toLowerCase();
		const matched = privateConvs.find((c) => {
			const convLabel = getConvLabel(c).trim().toLowerCase();
			return c.id?.toLowerCase() === normalized || convLabel === normalized;
		});
		return matched || privateConvs[0];
	}, [conversations, getConvLabel]);

	useEffect(() => {
		if (!conversations.length) return;
		if (routeMode === 'group') {
			if (activeId !== 'group') selectConversation('group', 'group');
			return;
		}
		if (routeMode === 'private') {
			const conv = resolvePrivateConv(privateAnchor);
			if (conv && activeId !== conv.id) selectConversation(conv.id, 'private');
			return;
		}
		if (!isMobile && activeId !== 'group') {
			selectConversation('group', 'group');
		}
	}, [routeMode, privateAnchor, conversations, activeId, isMobile, selectConversation, resolvePrivateConv]);

	const activeConversation = useMemo(
		() => conversations.find((c) => c.id === activeId) || null,
		[conversations, activeId]
	);
	const mobileConvTitle = activeConversation ? getConvLabel(activeConversation) : t(locale, 'chatGroup');

	const handleSelectConvByRoute = useCallback((conv) => {
		if (!conv) return;
		if (conv.type === 'group') {
			navigate('/town/chat/group');
			selectConversation('group', 'group');
			return;
		}
		const label = getConvLabel(conv);
		const hash = label ? `#${encodeURIComponent(label)}` : '';
		navigate(`/town/chat/private${hash}`);
		selectConversation(conv.id, 'private');
	}, [navigate, selectConversation, getConvLabel]);

	const showSidebar = !isMobile || routeMode === 'index';
	const showMain = !isMobile || routeMode !== 'index';

	return (
		<div className="page-enter">
			<section id="header">
				<span>{t(locale, 'navChat')}</span>
			</section>
			<div className={styles.chatLayout} role="main">
				{showSidebar && <aside className={styles.sidebar}>
					<div className={styles.convList}>
						{conversations.map((conv) => {
							const { avatarImg, avatarLetter, avatarColor } = getConvAvatar(conv);
							const isActiveRoute = conv.type === 'group'
								? routeMode === 'group'
								: routeMode === 'private' && activeId === conv.id;
							return (
								<button
									key={conv.id}
									type="button"
									className={`${styles.convItem} ${(isMobile ? isActiveRoute : activeId === conv.id) ? styles.convItemActive : ''}`}
									onClick={() => handleSelectConvByRoute(conv)}
								>
									{avatarImg ? (
										<img src={avatarImg} alt="" className={styles.convAvatarImg} />
									) : avatarLetter ? (
										<span className={styles.convAvatarLetter} style={{ backgroundColor: avatarColor }}>{avatarLetter}</span>
									) : (
										<span className={styles.convAvatar} aria-hidden />
									)}
									<span className={styles.convLabel}>{getConvLabel(conv)}</span>
								</button>
							);
						})}
					</div>
				</aside>}

				{showMain && <section className={styles.main}>
					{isMobile && (
						<div className={styles.mobileTopBar}>
							<button
								type="button"
								className={styles.mobileBackBtn}
								onClick={() => navigate('/town/chat')}
								aria-label="返回会话列表"
							>
								←
							</button>
							<span className={styles.mobileTopTitle}>{mobileConvTitle}</span>
						</div>
					)}
					<div
						className={styles.messages}
						ref={messagesRef}
						onScroll={onScroll}
					>
						{loading && messages.length === 0 ? (
							<div className={styles.loading}>
								<span className={styles.loadingDot} />
								{t(locale, 'loading')}
							</div>
						) : (
							<>
								{loading && messages.length > 0 && (
									<div className={styles.loadingMore}>
										<span className={styles.loadingDot} />
										{t(locale, 'loading')}
									</div>
								)}
								{messages.map((msg, idx) => {
								const showTimeAbove = shouldShowTimeAbove(messages, idx);
								const { avatarImg, avatarLetter, avatarColor, displayName } = getMsgAvatar(msg);
								const identityTag = getIdentityTag(msg.uid, msg.username || displayName || '');
								const msgAvatarNode = avatarImg ? (
									<img src={avatarImg} alt="" className={styles.msgAvatarImg} />
								) : avatarLetter ? (
									<span className={styles.msgAvatarLetter} style={{ backgroundColor: avatarColor }}>{avatarLetter}</span>
								) : (
									<span className={styles.msgAvatar} aria-hidden />
								);
								const imgurls = normalizeImgurl(msg.imgurl);
								const hasText = msg.text && String(msg.text).trim();
								const hasMedia = imgurls.length > 0;
								const mediaItems = imgurls.map((url) => [url, inferMediaType(url)]);
								const isOnlyMedia = hasMedia && !hasText;
								return (
									<div
										key={msg._id}
										className={`${styles.messageRow} ${msg.isSent ? styles.messageRowSent : styles.messageRowReceived}`}
									>
										{showTimeAbove && (
											<div className={styles.msgTimeAbove}>{formatTime(msg.createdAt)}</div>
										)}
										<div className={styles.messageBubbleWrap}>
											{!msg.isSent && msgAvatarNode}
											<div className={styles.messageContent}>
												<div className={`${styles.msgMetaRow} ${msg.isSent ? styles.msgMetaRowSent : ''}`}>
													{msg.isSent ? (
														<>
															<span className={styles.msgUsername}>{displayName}</span>
															<span className={`${styles.msgRoleTag} ${identityTag.tone === 'privileged' ? styles.msgRoleTagPrivileged : identityTag.tone === 'member' ? styles.msgRoleTagMember : styles.msgRoleTagGuest}`}>{identityTag.text}</span>
														</>
													) : (
														<>
															<span className={`${styles.msgRoleTag} ${identityTag.tone === 'privileged' ? styles.msgRoleTagPrivileged : identityTag.tone === 'member' ? styles.msgRoleTagMember : styles.msgRoleTagGuest}`}>{identityTag.text}</span>
															<span className={styles.msgUsername}>{displayName}</span>
														</>
													)}
												</div>
												<div className={styles.messageBubbles}>
													{hasText && <div className={styles.bubble}>{msg.text}</div>}
													{hasMedia && (
														<div className={isOnlyMedia ? styles.mediaGrid2 : styles.mediaGrid5}>
															{mediaItems.map((item, i) => (
																<div key={i} className={styles.mediaThumb} onClick={() => { setEnlargedMsgId(msg._id); setEnlargedIndex(i); }}>
																	{item[1] === 'image' ? (
																		<img src={item[0]} alt="" loading="lazy" />
																	) : (
																		<video src={item[0]} muted />
																	)}
																</div>
															))}
														</div>
													)}
												</div>
												<div className={styles.msgTimeHover} aria-hidden>
													{formatTime(msg.createdAt)}
												</div>
											</div>
											{msg.isSent && msgAvatarNode}
										</div>
										{enlargedMsgId === msg._id && (
											<IvPreview
												items={mediaItems}
												prefix={`chat_${msg._id}`}
												showThumbnails={mediaItems.length > 1}
												enlargedIndex={enlargedIndex}
												onEnlargedIndexChange={(v) => { setEnlargedIndex(v); if (v == null) setEnlargedMsgId(null); }}
											/>
										)}
									</div>
								);
							})}
							</>
						)}
					</div>

					{selectedMedia.length > 0 && (
						<div className={styles.selectedMediaPreview}>
							{selectedMedia.map((m, i) => (
								<div key={i} className={styles.selectedMediaItem}>
									{m.type === 'image' ? (
										<img src={m.previewUrl} alt="" />
									) : (
										<video src={m.previewUrl} muted />
									)}
									<button type="button" className={styles.selectedMediaRemove} onClick={() => removeSelectedMedia(i)} aria-label="移除">×</button>
								</div>
							))}
						</div>
					)}
					<div className={styles.inputBar}>
						<input
							type="text"
							className={styles.input}
							placeholder={t(locale, 'chatInputPlaceholder')}
							value={inputValue}
							onChange={(e) => setInputValue(e.target.value)}
							onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && doSend()}
							disabled={sending}
						/>
						<input
							ref={fileInputRef}
							type="file"
							accept="image/*,video/*"
							multiple
							style={{ display: 'none' }}
							onChange={handleFileSelect}
							disabled={uploading}
						/>
						<button
							type="button"
							className={styles.btnPlus}
							title={t(locale, 'upload')}
							aria-label={t(locale, 'upload')}
							onClick={() => fileInputRef.current?.click()}
							disabled={uploading}
						>
							⊕
						</button>
						<button
							type="button"
							className={styles.btnSend}
							onClick={doSend}
							disabled={sending || uploading || (!inputValue.trim() && selectedMedia.length === 0)}
						>
							{uploading ? t(locale, 'uploading') : t(locale, 'chatSend')}
						</button>
					</div>
				</section>}
			</div>
		</div>
	);
}

const Chat = () => <ChatContent />;

export default Chat;
