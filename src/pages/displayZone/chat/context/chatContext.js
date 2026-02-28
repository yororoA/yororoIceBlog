import React, { createContext, useContext, useCallback, useState, useEffect, useRef } from 'react';
import { getConversations, getHistory, sendMessage, hasPrivateHistory } from '../../../../utils/chat';
import { getUid } from '../../../../utils/auth';

const RENDER_BATCH = 5;
const PAGE_SIZE = 15;

function getConvKey(id, type) {
	return type === 'group' ? 'group' : id;
}

const ChatContext = createContext(null);

export function ChatProvider({ children }) {
	const uid = getUid();
	const [conversations, setConversations] = useState([]);
	const [activeId, setActiveId] = useState('group');
	const [activeType, setActiveType] = useState('group');
	const [loading, setLoading] = useState(false);
	const [sending, setSending] = useState(false);
	const [hasPrivateChecked, setHasPrivateChecked] = useState({});

	// 按会话 key 缓存：{ allLoaded, renderedCount, page, hasMore }
	const [cache, setCache] = useState({});
	const cacheRef = useRef({});
	useEffect(() => {
		cacheRef.current = cache;
	}, [cache]);

	const getTargetUserId = useCallback((id, type) => {
		if (type === 'group') return null;
		if (id === 'admin') return 'admin';
		return id;
	}, []);

	const loadConversations = useCallback(async () => {
		try {
			const list = await getConversations();
			setConversations(list);
		} catch (e) {
			console.error('loadConversations', e);
		}
	}, []);

	const loadHistory = useCallback(
		async (convId, convType, append = false) => {
			const key = getConvKey(convId, convType);
			const targetUserId = convType === 'group' ? null : (convId === 'admin' ? 'admin' : convId);

			if (convType === 'private' && targetUserId === 'admin') {
				const checked = hasPrivateChecked['admin'];
				if (!checked) {
					try {
						const has = await hasPrivateHistory('admin');
						setHasPrivateChecked((p) => ({ ...p, admin: true }));
						if (!has) {
							setCache((c) => ({ ...c, [key]: { allLoaded: [], renderedCount: RENDER_BATCH, page: 1, hasMore: false } }));
							setLoading(false);
							return;
						}
					} catch (e) {
						console.error('hasPrivateHistory', e);
						setLoading(false);
						return;
					}
				}
			}

			setLoading(true);
			try {
				const cached = cacheRef.current[key];
				const nextPage = append && cached ? cached.page : 1;
				const { items, hasMore: more } = await getHistory({
					type: convType,
					userId: targetUserId,
					page: nextPage,
					limit: PAGE_SIZE,
				});
				const normalized = items.map((m) => ({
					...m,
					createdAt: m.createdAt ? new Date(m.createdAt) : new Date(),
					isSent: m.uid === uid,
				}));
				setCache((prev) => {
					const cur = prev[key] || { allLoaded: [], renderedCount: RENDER_BATCH, page: 1, hasMore: false };
					if (append) {
						return {
							...prev,
							[key]: {
								allLoaded: [...cur.allLoaded, ...normalized],
								renderedCount: cur.renderedCount + normalized.length,
								page: nextPage + 1,
								hasMore: more,
							},
						};
					}
					return {
						...prev,
						[key]: {
							allLoaded: normalized,
							renderedCount: RENDER_BATCH,
							page: 2,
							hasMore: more,
						},
					};
				});
			} catch (e) {
				console.error('loadHistory', e);
			} finally {
				setLoading(false);
			}
		},
		[uid, hasPrivateChecked]
	);

	const addMessageToConversation = useCallback(
		(key, msg) => {
			const m = {
				...msg,
				createdAt: msg.createdAt ? new Date(msg.createdAt) : new Date(),
				isSent: msg.uid === uid,
			};
			setCache((prev) => {
				const cur = prev[key] || { allLoaded: [], renderedCount: RENDER_BATCH, page: 1, hasMore: false };
				return {
					...prev,
					[key]: {
						...cur,
						allLoaded: [m, ...(cur.allLoaded || [])],
						renderedCount: (cur.renderedCount || 0) + 1,
					},
				};
			});
		},
		[uid]
	);

	const loadMoreRendered = useCallback((key) => {
		setCache((prev) => {
			const cur = prev[key];
			if (!cur) return prev;
			const next = Math.min((cur.renderedCount || 0) + RENDER_BATCH, (cur.allLoaded || []).length);
			return { ...prev, [key]: { ...cur, renderedCount: next } };
		});
	}, []);

	const loadMoreHistory = useCallback(
		(convId, convType) => {
			const key = getConvKey(convId, convType);
			const cur = cacheRef.current[key];
			if (loading || !cur?.hasMore) return;
			loadHistory(convId, convType, true);
		},
		[loading, loadHistory]
	);

	const handleSend = useCallback(
		async (text, imgurl = '', replyto = '') => {
			if (!text?.trim()) return false;
			setSending(true);
			try {
				const targetUserId = getTargetUserId(activeId, activeType);
				const msg = await sendMessage({
					type: activeType,
					targetUserId: activeType === 'private' ? targetUserId : undefined,
					text: text.trim(),
					imgurl,
					replyto,
				});
				const key = getConvKey(activeId, activeType);
				addMessageToConversation(key, msg);
				return true;
			} catch (e) {
				console.error('sendMessage', e);
				return false;
			} finally {
				setSending(false);
			}
		},
		[activeId, activeType, getTargetUserId, addMessageToConversation]
	);

	const selectConversation = useCallback((id, type) => {
		setActiveId(id);
		setActiveType(type || 'private');
	}, []);

	useEffect(() => {
		loadConversations();
	}, [loadConversations]);

	// 切换会话：有缓存则用缓存，无则拉取
	useEffect(() => {
		const key = getConvKey(activeId, activeType);
		const cur = cache[key];
		if (cur && (cur.allLoaded?.length > 0 || cur.hasMore === false)) {
			return;
		}
		loadHistory(activeId, activeType, false);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [activeId, activeType]);

	// 全局监听 chat.new：按 chatType 更新对应会话缓存
	useEffect(() => {
		const handler = (e) => {
			const { chatType, convKey, data } = e.detail || {};
			if (!data || !data._id) return;
			const key = chatType === 'group' ? 'group' : convKey;
			if (key) addMessageToConversation(key, data);
		};
		window.addEventListener('chat.new', handler);
		return () => window.removeEventListener('chat.new', handler);
	}, [addMessageToConversation]);

	const key = getConvKey(activeId, activeType);
	const cur = cache[key] || { allLoaded: [], renderedCount: RENDER_BATCH, page: 1, hasMore: false };
	const allLoaded = cur.allLoaded || [];
	const renderedCount = Math.min(cur.renderedCount || RENDER_BATCH, allLoaded.length);
	const displayedMessages = [...allLoaded].reverse().slice(-renderedCount);
	const canLoadMoreRendered = renderedCount < allLoaded.length;
	const canLoadMoreHistory = cur.hasMore && !loading;

	return (
		<ChatContext.Provider
			value={{
				uid,
				conversations,
				activeId,
				activeType,
				messages: displayedMessages,
				allLoaded,
				canLoadMoreRendered,
				canLoadMoreHistory,
				loading,
				sending,
				loadMoreRendered: () => loadMoreRendered(key),
				loadMoreHistory: () => loadMoreHistory(activeId, activeType),
				handleSend,
				selectConversation,
				loadHistory: (append) => loadHistory(activeId, activeType, append),
			}}
		>
			{children}
		</ChatContext.Provider>
	);
}

export function useChat() {
	const ctx = useContext(ChatContext);
	if (!ctx) throw new Error('useChat must be used within ChatProvider');
	return ctx;
}
