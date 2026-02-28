import React, { useContext, useRef, useCallback } from 'react';
import styles from './chat.module.less';
import { UiPersistContext } from '../context/uiPersistContext';
import { t } from '../../../i18n/uiText';
import { useChat } from './context/chatContext';

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
	const { locale } = useContext(UiPersistContext);
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
	const [inputValue, setInputValue] = React.useState('');
	const messagesRef = useRef(null);

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

	const doSend = useCallback(() => {
		if (!inputValue.trim() || sending) return;
		handleSend(inputValue.trim()).then((ok) => {
			if (ok) setInputValue('');
		});
	}, [inputValue, sending, handleSend]);

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
						{conversations.map((conv) => (
							<button
								key={conv.id}
								type="button"
								className={`${styles.convItem} ${activeId === conv.id ? styles.convItemActive : ''}`}
								onClick={() => selectConversation(conv.id, conv.type)}
							>
								<span className={styles.convAvatar} aria-hidden />
								<span className={styles.convLabel}>{getConvLabel(conv)}</span>
							</button>
						))}
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
								return (
									<div
										key={msg._id}
										className={`${styles.messageRow} ${msg.isSent ? styles.messageRowSent : styles.messageRowReceived}`}
									>
										{showTimeAbove && (
											<div className={styles.msgTimeAbove}>{formatTime(msg.createdAt)}</div>
										)}
										<div className={styles.messageBubbleWrap}>
											{!msg.isSent && (
												<span className={styles.msgAvatar} aria-hidden />
											)}
											<div className={styles.messageContent}>
												<span className={styles.msgUsername}>{msg.username}</span>
												<div className={styles.messageBubbles}>
													<div className={styles.bubble}>{msg.text}</div>
													{msg.imgurl && (
														<a href={msg.imgurl} target="_blank" rel="noopener noreferrer" className={styles.bubbleImg}>
															<img src={msg.imgurl} alt="" />
														</a>
													)}
												</div>
											</div>
											{msg.isSent && (
												<span className={styles.msgAvatar} aria-hidden />
											)}
										</div>
										<div className={styles.msgTimeHover} aria-hidden>
											{formatTime(msg.createdAt)}
										</div>
									</div>
								);
							})
						)}
					</div>

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
						<button type="button" className={styles.btnPlus} title="附件/表情" aria-label="附件">
							⊕
						</button>
						<button type="button" className={styles.btnSend} onClick={doSend} disabled={sending}>
							{t(locale, 'chatSend')}
						</button>
					</div>
				</section>
			</div>
		</div>
	);
}

const Chat = () => <ChatContent />;

export default Chat;
