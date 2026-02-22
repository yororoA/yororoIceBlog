import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import logo from '../../assets/images/logo.png'
import SwitchTheme from "../../components/switchTheme/switchTheme";
import page from './page.module.less';
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { connectSSE, disconnectSSE } from "../../utils/sse/connect";
import { useDispatch } from "react-redux";
import { updatedCommentSlice, updatedMomentLikesSlice } from "../../store/slices";
import StatusBoardStack from '../../components/ui/pop/status/statusBoardStack';
import { SuccessBoardContext } from '../../components/ui/pop/status/successBoardContext';
import Pop from '../../components/ui/pop/pop';
import Announcement from '../../components/ui/announcement/announcement';
import { homeAnnouncementMarkdown } from '../../config/announcementMarkdown';
import { GalleryContext } from './gallery/context/galleryContext';
import { MomentsListContext } from './moments/context/momentsListContext';
import { KnowledgeListContext } from './knowledge/context/knowledgeListContext';
import { ArchiveListContext } from './archive/context/archiveListContext';
import { ScrollContainerContext } from './scrollContainerContext';
import { UiPersistContext } from './context/uiPersistContext';
import ProfileMiniCard from './shared/profileMiniCard';
import { getUid, logout } from '../../utils/auth';

const DisplayZone = () => {
	const uid = getUid();
	// gallery 的 ivs、hasMore 放在 DisplayZone，切换路由时不会卸载，回来时图片仍在且不会重复请求
	const [galleryIvs, setGalleryIvs] = useState([]);
	const [galleryHasMore, setGalleryHasMore] = useState(true);
	// moments 列表、已点赞 id、各 moment 的文件缓存放在 DisplayZone，避免切换路由后重复加载
	const [momentsData, setMomentsData] = useState([]);
	const [likedMoments, setLikedMoments] = useState([]);
	const [momentsFilesCache, setMomentsFilesCache] = useState({});
	const [deletingIds, setDeletingIds] = useState([]);
	// 累计收到的 moment.new 的 _id（及完整数据），moment.delete 时从其中移除；点击加载后按顺序写入列表并清空
	const [pendingNewMoments, setPendingNewMoments] = useState([]);
	// knowledge 列表、已点赞 id、分类列表放在 DisplayZone，避免切换路由后重复加载
	const [articlesData, setArticlesData] = useState([]);
	const [likedArticles, setLikedArticles] = useState([]);
	const [categories, setCategories] = useState([]);
	// archive 列表、统计信息、年份列表放在 DisplayZone，避免切换路由后重复加载
	const [archiveData, setArchiveData] = useState([]);
	const [archiveStats, setArchiveStats] = useState({});
	const [archiveYears, setArchiveYears] = useState(['all']);
	// 页面级 UI 状态缓存：切路由不丢失
	const [langViewMode, setLangViewMode] = useState('pie');
	const [articlesSelectedCategory, setArticlesSelectedCategory] = useState('all');
	const [archiveSelectedType, setArchiveSelectedType] = useState('all');
	const [archiveSelectedYear, setArchiveSelectedYear] = useState('all');
	const [linksExpanded, setLinksExpanded] = useState(true);
	const [guestbookExpanded, setGuestbookExpanded] = useState(true);
	const [linksSelectedCategory, setLinksSelectedCategory] = useState('all');
	const [successList, setSuccessList] = useState([]);
	const [failedList, setFailedList] = useState([]);
	const [showConnectedBoard, setShowConnectedBoard] = useState(true);
	const showSuccess = useCallback((content) => {
		setSuccessList(prev => [...prev, { id: Date.now(), content }]);
	}, []);
	const showFailed = useCallback((content) => {
		setFailedList(prev => [...prev, { id: Date.now(), content }]);
	}, []);
	const removeSuccess = useCallback((id) => {
		setSuccessList(prev => prev.filter(item => item.id !== id));
	}, []);
	const removeFailed = useCallback((id) => {
		setFailedList(prev => prev.filter(item => item.id !== id));
	}, []);
	const navigate = useNavigate();
	const location = useLocation();
	const scrollContainerRef = useRef(null);

	// 若有 mid 查询参数，则跳到 moments 页并用现有逻辑展示对应 moment
	useEffect(() => {
		const q = new URLSearchParams(location.search);
		const mid = q.get('mid');
		const isOnMoments = location.pathname.endsWith('moments');
		if (mid && !isOnMoments) {
			navigate('/town/moments?' + location.search, { replace: true });
		}
	}, [location.search, location.pathname, navigate]);

	// 公告状态管理：每个用户只弹出一次，关闭后不再主动弹出
	const [showAnnouncement, setShowAnnouncement] = useState(false);

	// 首次进入时检查是否需要自动弹出公告
	// 如果用户之前选择了"下次不再显示"，则不再弹出（向后兼容）
	useEffect(() => {
		const dismissed = localStorage.getItem('welcomeAnnouncementDismissed') === '1';
		const seen = sessionStorage.getItem('welcomeAnnouncementSeen') === '1';
		if (!dismissed && !seen) {
			setShowAnnouncement(true);
		}
	}, []);

	const handleCloseAnnouncement = useCallback((proceed) => {
		setShowAnnouncement(false);
		sessionStorage.setItem('welcomeAnnouncementSeen', '1');
		if (typeof proceed === 'function') proceed();
	}, []);

	// 手动打开公告（通过按钮）
	const handleOpenAnnouncement = useCallback(() => {
		setShowAnnouncement(true);
	}, []);

	// default home page - 现在首页是公告页面，不需要跳转
	// const pathname = window.location.pathname.split('/').filter(item => item !== '').at(-1);
	// useEffect(() => {
	// 	if (pathname === 'town') navigate('moments');
	// }, [pathname, navigate]);
	// click to nav link
	const handleRedirect = useCallback(e => {
		if (e.target.id === 'home' || (e.target.id === '' && e.target.textContent === 'Home')) {
			navigate('/town');
		} else if (e.target.id) {
			navigate(e.target.id);
		}
	}, [navigate]);
	const handleLogout = useCallback(() => {
		logout();
		navigate('/account/login');
	}, [navigate]);

	// 标记 moment 为删除中：先淡出，动画结束后再从列表与缓存移除
	const DELETE_ANIM_MS = 450;
	const markMomentDeleting = useCallback((id) => {
		// 双 rAF：先等一帧绘制出 opacity:1，下一帧再加 deleting，transition 才能从 1→0 正常播放
		let rafId2;
		const rafId1 = requestAnimationFrame(() => {
			rafId2 = requestAnimationFrame(() => {
				setDeletingIds(prev => (prev.includes(id) ? prev : [...prev, id]));
			});
		});
		const t = setTimeout(() => {
			setMomentsData(prev => prev.filter(m => m._id !== id));
			setMomentsFilesCache(prev => {
				const next = { ...prev };
				delete next[id];
				return next;
			});
			setDeletingIds(prev => prev.filter(x => x !== id));
		}, DELETE_ANIM_MS);
		return () => {
			cancelAnimationFrame(rafId1);
			if (rafId2 != null) cancelAnimationFrame(rafId2);
			clearTimeout(t);
		};
	}, []);

	// 将 SSE 的 moment 规范成与 getMoments 一致的结构
	const normalizeMoment = useCallback((d) => {
		if (!d || !d._id) return null;
		const { uid, username, comments, content, title, createdAt, _id, likes, filenames, updatedAt } = d;
		return {
			uid, username, title, content, _id,
			likes: likes ?? [],
			comments: comments ?? [],
			createdAt: createdAt ? new Date(createdAt) : new Date(),
			updatedAt: updatedAt ? new Date(updatedAt) : new Date(),
			filenames: filenames === undefined ? [] : (Array.isArray(filenames) ? filenames : Object.keys(filenames)),
		};
	}, []);

	// 点击「加载」：按 moment.new 先后顺序插入列表并清空 pending
	const loadPendingNewMoments = useCallback(() => {
		if (pendingNewMoments.length === 0) return;
		setMomentsData(prev => [...pendingNewMoments, ...prev]);
		setPendingNewMoments([]);
	}, [pendingNewMoments]);

	// store新状态派发器 + moment.new 计入 pending，moment.delete 从 pending 移除并走删除过渡
	const dispatch = useDispatch();
	const dispatchFn = useCallback((payload) => {
		const { commentNew } = updatedCommentSlice.actions;
		const { momentLikesUpdated } = updatedMomentLikesSlice.actions;
		const { type, data } = payload;
		// moment.delete：从 pending 中移除该 _id；若已在列表中则标记删除中
		if (type === 'moment.delete' && data?._id) {
			setPendingNewMoments(prev => prev.filter(m => m._id !== data._id));
			markMomentDeleting(data._id);
			return;
		}
		// moment.new：当前用户发的直接插入列表，其他人的计入 pending
		if (type === 'moment.new' && data?._id) {
			const norm = normalizeMoment(data);
			if (!norm) return;
			if (data.uid === uid) {
				setMomentsData(prev => [norm, ...prev]);
			} else {
				setPendingNewMoments(prev => [...prev, norm]);
			}
			return;
		}
		if (data.uid === uid) return;
		switch (type) {
			case 'comment.new':
				dispatch(commentNew(data));
				break;
			case 'moment.like':
				dispatch(momentLikesUpdated(data));
				break;
			default:
				break;
		}
	}, [dispatch, uid, markMomentDeleting, normalizeMoment]);
	// sse连接
	const [connect, setConnect] = useState(false);
	useEffect(() => {
		setConnect(true)
		connectSSE(dispatchFn).catch(() => setConnect(false));

		return () => disconnectSSE();
	}, [dispatchFn]);
	// 断线后下次连接时再显示 Connected 板
	useEffect(() => {
		if (!connect) setShowConnectedBoard(true);
	}, [connect]);


	return (
		<SuccessBoardContext.Provider value={{ showSuccess, showFailed }}>
			{showAnnouncement && (
				<Pop isLittle={false} onClose={handleCloseAnnouncement}>
					<Announcement markdown={homeAnnouncementMarkdown} />
				</Pop>
			)}
			{((showConnectedBoard && connect) || successList.length > 0 || failedList.length > 0) && (
				<StatusBoardStack
					showConnected={connect && showConnectedBoard}
					onConnectedClose={() => setShowConnectedBoard(false)}
					successList={successList}
					onRemoveSuccess={removeSuccess}
					failedList={failedList}
					onRemoveFailed={removeFailed}
				/>
			)}
			<div className={page.entire} ref={scrollContainerRef}>
				<div className={page.navBox}>
					<nav>
						<img src={logo} className={page.logo} alt="logo" onClick={() => navigate('/town')} style={{ cursor: 'pointer' }} />
						<div className={page.link} onClick={handleRedirect}>
							<span
								id="home"
								className={location.pathname === '/town' || location.pathname === '/town/' ? page.activeLink : ''}
							>
								Home
							</span>
							{['moments', 'articles', 'gallery', 'archive', 'other'].map(name => (
								<span
									key={name}
									id={name}
									className={location.pathname.includes(name) ? page.activeLink : ''}
								>
									{name.charAt(0).toUpperCase() + name.slice(1)}
								</span>
							))}
						</div>
						<div className={page.navRight}>
							<span className={page.announcementBtn} onClick={handleOpenAnnouncement} title="查看公告">
								<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
									<path d="M20 2H4C2.9 2 2 2.9 2 4V22L6 18H20C21.1 18 22 17.1 22 16V4C22 2.9 21.1 2 20 2ZM20 16H5.17L4 17.17V4H20V16ZM11 11H13V13H11V11ZM11 7H13V9H11V7Z" fill="currentColor" />
								</svg>
							</span>
							<span className={page.linkLogout} onClick={handleLogout}>{'Log out'}</span>
							<SwitchTheme />
						</div>
					</nav>
				</div>
				<main>
					<UiPersistContext.Provider
						value={{
							langViewMode,
							setLangViewMode,
							articlesSelectedCategory,
							setArticlesSelectedCategory,
							archiveSelectedType,
							setArchiveSelectedType,
							archiveSelectedYear,
							setArchiveSelectedYear,
							linksExpanded,
							setLinksExpanded,
							guestbookExpanded,
							setGuestbookExpanded,
							linksSelectedCategory,
							setLinksSelectedCategory,
						}}
					>
						<ProfileMiniCard visible={location.pathname.includes('/moments') || location.pathname.includes('/articles')} />
						<ScrollContainerContext.Provider value={scrollContainerRef}>
							<GalleryContext.Provider value={[galleryIvs, setGalleryIvs, galleryHasMore, setGalleryHasMore]}>
								<MomentsListContext.Provider value={[momentsData, setMomentsData, likedMoments, setLikedMoments, momentsFilesCache, setMomentsFilesCache, deletingIds, markMomentDeleting, pendingNewMoments, loadPendingNewMoments]}>
									<KnowledgeListContext.Provider value={[articlesData, setArticlesData, likedArticles, setLikedArticles, categories, setCategories]}>
										<ArchiveListContext.Provider value={[archiveData, setArchiveData, archiveStats, setArchiveStats, archiveYears, setArchiveYears]}>
											<Outlet />
										</ArchiveListContext.Provider>
									</KnowledgeListContext.Provider>
								</MomentsListContext.Provider>
							</GalleryContext.Provider>
						</ScrollContainerContext.Provider>
					</UiPersistContext.Provider>
				</main>
			</div>
			{createPortal(
				<footer className={page.globalFooter}>
					<p className={page.globalFooterCopyright}>© 2025 yororoIce. All rights reserved.</p>
				</footer>,
				document.body
			)}
		</SuccessBoardContext.Provider>
	);
};

export default DisplayZone;
