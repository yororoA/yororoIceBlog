import React, { useContext, useRef, useCallback, useState } from 'react';
import styles from './chat.module.less';
import { UiPersistContext } from '../context/uiPersistContext';
import { SuccessBoardContext } from '../../../components/ui/pop/status/successBoardContext';
import { t } from '../../../i18n/uiText';
import { useChat } from './context/chatContext';
import { getAvatarColor, getAvatarLetter } from '../../../utils/avatarColor';
import { uploadChatMedia } from '../../../utils/chat';
import adminImg from '../../../assets/images/admin.png';
import binesImg from '../../../assets/images/bines.png';
import IvPreview from '../../../components/ui/image_video_preview/ivPreview';

const VIDEO_EXT = /\.(mp4|webm|ogg|mov|avi|mkv)(\?|$)/i;
function inferMediaType(url) {
	return VIDEO_EXT.test(url || '') ? 'video' : 'image';
}

function normalizeImgurl(imgurl) {
	if (Array.isArray(imgurl)) return imgurl.filter(Boolean);
	return imgurl ? [imgurl] : [];
}

const ADMIN_UIDS = ['u_mg94ixwg_df9ff1a129ad44a6', 'u_mg94t4ce_6485ab4d88f2f8db'];
const BINES_UID = 'u_mlkpl8fl_52a3d8c2068b281a';

function getMsgAvatar(msg) {
	if (!msg) return { avatarImg: null, avatarLetter: null, avatarColor: null };
	const uid = msg.uid;
	const avatarImg = ADMIN_UIDS.includes(uid) ? adminImg : uid === BINES_UID ? binesImg : null;
	const name = msg.username || uid || '';
	const avatarLetter = !avatarImg && name ? getAvatarLetter(name) : null;
	const avatarColor = avatarLetter ? getAvatarColor(uid || name) : null;
	return { avatarImg, avatarLetter, avatarColor };
}

function getConvAvatar(conv) {
	if (!conv) return { avatarImg: null, avatarLetter: null, avatarColor: null };
	if (conv.id === 'group') {
		return { avatarImg: null, avatarLetter: 'G', avatarColor: getAvatarColor('group') };
	}
	const avatarImg = conv.id === 'admin' ? adminImg : ADMIN_UIDS.includes(conv.id) ? adminImg : conv.id === BINES_UID ? binesImg : null;
	const label = conv.label || conv.id || '';
	const avatarLetter = !avatarImg && label ? getAvatarLetter(label) : null;
	const avatarColor = avatarLetter ? getAvatarColor(conv.id || label) : null;
	return { avatarImg, avatarLetter, avatarColor };
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

const AVATAR_SIZE = 32;

function ChatContent() {
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
	const messagesRef = useRef(null);
	const fileInputRef = useRef(null);
	const selectedMediaRef = useRef([]);
	selectedMediaRef.current = selectedMedia;

	React.useEffect(() => () => {
		selectedMediaRef.current.forEach((m) => {
			if (m?.previewUrl) URL.revokeObjectURL(m.previewUrl);
		});
	}, []);

	React.useEffect(() => {
		const el = messagesRef.current;
		if (el && messages.length > 0) el.scrollTop = el.scrollHeight - el.clientHeight;
	}, [messages.length]);

	const onScroll = useCallback(() => {
		const el = messagesRef.current;
		if (!el) return;
		if (el.scrollTop <= 10 && (canLoadMoreRendered || canLoadMoreHistory)) {
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

	const getConvLabel = (conv) => {
		if (conv.labelKey) return t(locale, conv.labelKey);
		return conv.label || conv.id;
	};

	return (
		<div className="page-enter">
			<section id="header">
				<span>{t(locale, 'navChat')}</span>
			</section>
			<div className={styles.chatLayout} role="main">
				<aside className={styles.sidebar}>
					<div className={styles.convList}>
						{conversations.map((conv) => {
							const { avatarImg, avatarLetter, avatarColor } = getConvAvatar(conv);
							return (
								<button
									key={conv.id}
									type="button"
									className={`${styles.convItem} ${activeId === conv.id ? styles.convItemActive : ''}`}
									onClick={() => selectConversation(conv.id, conv.type)}
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
				</aside>

				<section className={styles.main}>
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
							messages.map((msg, idx) => {
								const showTimeAbove = shouldShowTimeAbove(messages, idx);
								const { avatarImg, avatarLetter, avatarColor } = getMsgAvatar(msg);
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
												<span className={styles.msgUsername}>{msg.username}</span>
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
										<div className={styles.msgTimeHover} aria-hidden>
											{formatTime(msg.createdAt)}
										</div>
									</div>
								);
							})
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
				</section>
			</div>
		</div>
	);
}

const Chat = () => <ChatContent />;

export default Chat;
