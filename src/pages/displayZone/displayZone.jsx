import React, { useCallback, useEffect, useState } from 'react';
import logo from '../../assets/images/logo.png'
import SwitchTheme from "../../components/switchTheme/switchTheme";
import page from './page.module.less';
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { connectSSE, disconnectSSE } from "../../utils/sse/connect";
import { useDispatch } from "react-redux";
import { updatedCommentSlice, updatedMomentLikesSlice, updatedMomentSlice } from "../../store/slices";
import StatusBoardStack from '../../components/ui/pop/status/statusBoardStack';
import { SuccessBoardContext } from '../../components/ui/pop/status/successBoardContext';
import Pop from '../../components/ui/pop/pop';
import Announcement from '../../components/ui/announcement/announcement';
import { homeAnnouncementMarkdown } from '../../config/announcementMarkdown';
import { GalleryContext } from './gallery/context/galleryContext';
import { MomentsListContext } from './moments/context/momentsListContext';
import { getUid, logout } from '../../utils/auth';

const DisplayZone = () => {
	const uid = getUid();
	// gallery 的 ivs 放在 DisplayZone，切换路由时不会卸载，回来时图片仍在
	const [galleryIvs, setGalleryIvs] = useState([]);
	// moments 列表、已点赞 id、各 moment 的文件缓存放在 DisplayZone，避免切换路由后重复加载
	const [momentsData, setMomentsData] = useState([]);
	const [likedMoments, setLikedMoments] = useState([]);
	const [momentsFilesCache, setMomentsFilesCache] = useState({});
	const [deletingIds, setDeletingIds] = useState([]);
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

	// 若有 mid 查询参数，则跳到 moments 页并用现有逻辑展示对应 moment
	useEffect(() => {
		const q = new URLSearchParams(location.search);
		const mid = q.get('mid');
		const isOnMoments = location.pathname.endsWith('moments');
		if (mid && !isOnMoments) {
			navigate('/town/moments?' + location.search, { replace: true });
		}
	}, [location.search, location.pathname, navigate]);

	// 首页公告：未选「下次不再显示」时，当前会话首次进入展示一次
	const [showAnnouncement, setShowAnnouncement] = useState(
		() => localStorage.getItem('welcomeAnnouncementDismissed') !== '1' && sessionStorage.getItem('welcomeAnnouncementSeen') !== '1'
	);
	const handleCloseAnnouncement = useCallback((dontShowAgain) => {
		setShowAnnouncement(false);
		sessionStorage.setItem('welcomeAnnouncementSeen', '1');
		if (dontShowAgain) localStorage.setItem('welcomeAnnouncementDismissed', '1');
	}, []);

	// default home page
	const pathname = window.location.pathname.split('/').filter(item => item !== '').at(-1);
	useEffect(() => {
		if (pathname === 'town') navigate('moments');
	}, [pathname, navigate]);
	// click to nav link
	const handleRedirect = useCallback(e => {
		if (e.target.id) navigate(e.target.id);
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

	// store新状态派发器 + moment.delete 时走删除过渡
	const dispatch = useDispatch();
	const dispatchFn = useCallback((payload) => {
		const { momentNew } = updatedMomentSlice.actions;
		const { commentNew } = updatedCommentSlice.actions;
		const { momentLikesUpdated } = updatedMomentLikesSlice.actions;
		const { type, data } = payload;
		// moment.delete：先标记删除中（淡出），动画结束后再移除
		if (type === 'moment.delete' && data?._id) {
			markMomentDeleting(data._id);
			return;
		}
		if (data.uid === uid) return;
		console.log(data, '\n', typeof data);
		switch (type) {
			case 'moment.new':
				dispatch(momentNew(data));
				break;
			case 'comment.new':
				dispatch(commentNew(data));
				break;
			case 'moment.like':
				dispatch(momentLikesUpdated(data));
				break;
			default:
				break;
		}
	}, [dispatch, uid, markMomentDeleting]);
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
					<Announcement markdown={homeAnnouncementMarkdown} onClose={handleCloseAnnouncement} />
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
			<div className={page.entire}>
				<div className={page.navBox}>
					<nav>
						<img src={logo} className={page.logo} alt="logo" />
						<div className={page.link} onClick={handleRedirect}>
							{/* 生活动态 */}
							<span id={'moments'}>{'Moments'}</span>
							{/* 美图, 相册等图片展示 */}
							<span id={'gallery'}>{'Gallery'}</span>
							{/* 技术博客 */}
							<span id={'knowledge'}>{'Knowledge'}</span>
							{/* 归档 */}
							<span id={'archive'}>{'Archive'}</span>
							{/* 个人简介等 */}
							<span id={'about'}>{'About'}</span>
						</div>
						<span className={page.linkLogout} onClick={handleLogout}>{'Log out'}</span>
						<SwitchTheme />
					</nav>
				</div>
				<main>
					<GalleryContext.Provider value={[galleryIvs, setGalleryIvs]}>
						<MomentsListContext.Provider value={[momentsData, setMomentsData, likedMoments, setLikedMoments, momentsFilesCache, setMomentsFilesCache, deletingIds, markMomentDeleting]}>
							<Outlet />
						</MomentsListContext.Provider>
					</GalleryContext.Provider>
				</main>
			</div>
		</SuccessBoardContext.Provider>
	);
};

export default DisplayZone;
