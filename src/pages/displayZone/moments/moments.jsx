import React, {useCallback, useContext, useEffect, useLayoutEffect, useRef, useState} from 'react';
import { useSearchParams } from "react-router-dom";
import MomentsCard from "../../../components/pagesCard/moments/content/momentsCard";
import { MomentDetailsCtx } from "../../../components/pagesCard/moments/content/momentsCard";
import moments from './moments.module.less';
import MomentIdContext from "./context/momentIdContext";
import { MomentsListContext } from "./context/momentsListContext";
import CommonBtn from "../../../components/btn/commonBtn/commonBtn";
import addContent from "../../../components/btn/addContent.module.less";
import Pop from "../../../components/ui/pop/pop";
import NewMoment from "../../../components/ui/pop/newMoment/newMoment";
import MomentDetails from "./momentDetails/momentDetails";
import {getMoments} from "../../../utils/getMoments";
import {getLikesList} from "../../../utils/getLikesList";
import {getFiles} from "../../../utils/getFiles";
import {incrementMomentView} from "../../../utils/incrementMomentView";
import {useSelector} from "react-redux";
import {CommentsLikedContext} from "./context/commentsLikedContext";
import { isGuest } from "../../../utils/auth";
import adminImg from '../../../assets/images/admin.png';
import binesImg from '../../../assets/images/bines.png';


const MomentItem = ({data, liked, onOpenDetails, onRequestDetail, isDeleting}) => {
	const [dt, setDt] = useState(data);
	const [visible, setVisible] = useState(false);
	const [animFinished, setAnimFinished] = useState(false);
	const ref = useRef(null);

	useLayoutEffect(() => {
		const el = ref.current;
		if (!el) { setVisible(true); return; }
		const { top, bottom } = el.getBoundingClientRect();
		if (top < window.innerHeight && bottom > 0) {
			setVisible(true);
			return;
		}
		const observer = new IntersectionObserver(
			([entry]) => {
				if (entry.isIntersecting) {
					setVisible(true);
					observer.unobserve(el);
				}
			},
			{ threshold: 0.1 },
		);
		observer.observe(el);
		return () => observer.disconnect();
	}, []);

	const setCommentToDt = (newComment_id) => {
		setDt(prev => ({
			...prev,
			comments: [...prev.comments, newComment_id]
		}));
	}
	const newCommentFromSSE = useSelector(state => state.commentNew.infos);
	useEffect(() => {
		if (newCommentFromSSE.momentId === data._id) {
			setCommentToDt(newCommentFromSSE._id);
		}
	}, [data._id, newCommentFromSSE]);

	return (
		<MomentIdContext value={{momentItem: dt, setCommentToDt}}>
			<div
				ref={ref}
				className={`${moments.item}${visible ? ` ${moments.itemVisible}` : ''}${visible && !animFinished ? ` ${moments.itemEnterAnim}` : ''}${isDeleting ? ` ${moments.itemDeleting}` : ''}`}
				onAnimationEnd={() => setAnimFinished(true)}
				onMouseEnter={() => setAnimFinished(true)}
			>
				<MomentsCard
					liked={liked}
					preview={true}
					onOpenDetails={onOpenDetails}
					onRequestDetail={onRequestDetail}
				/>
			</div>
		</MomentIdContext>
	)
}


const Moments = () => {
	const [
		momentsData,
		setMomentsData,
		likedMoments,
		setLikedMoments,
		momentsFilesCache,
		setMomentsFilesCache,
		deletingIds = [],
		markMomentDeleting,
		pendingNewMoments = [],
		loadPendingNewMoments,
	] = useContext(MomentsListContext);
	const pendingCount = pendingNewMoments.length;
	const [editing, setEditing] = useState(false);
	const [loading, setLoading] = useState(false);

	const [searchParams, setSearchParams] = useSearchParams();
	const midFromQuery = searchParams.get('mid');

	// 关闭详情时去掉 URL 中的 mid，恢复为 /town/moments（用 ref 避免 effect 依赖导致列表重拉）
	const clearMidFromUrl = useCallback(() => {
		if (!searchParams.get('mid')) return;
		const next = new URLSearchParams(searchParams);
		next.delete('mid');
		setSearchParams(next, { replace: true });
	}, [searchParams, setSearchParams]);
	const clearMidFromUrlRef = useRef(clearMidFromUrl);
	clearMidFromUrlRef.current = clearMidFromUrl;
	const onCloseDetails = useCallback(() => clearMidFromUrlRef.current?.(), []);

	// 点击展示详情时在地址上拼接 mid（用 ref 避免 effect 依赖）
	const setMidInUrl = useCallback((id) => {
		const next = new URLSearchParams(searchParams);
		next.set('mid', id);
		setSearchParams(next, { replace: true });
	}, [searchParams, setSearchParams]);
	const setMidInUrlRef = useRef(setMidInUrl);
	setMidInUrlRef.current = setMidInUrl;
	const onOpenDetails = useCallback((id) => setMidInUrlRef.current?.(id), []);

	const [detailMomentId, setDetailMomentId] = useState(null);
	const [detailLike, setDetailLike] = useState(false);
	const [detailLikeNumbers, setDetailLikeNumbers] = useState(0);
	const [detailFilesInfos, setDetailFilesInfos] = useState([]);
	const isManuallyClosedRef = useRef(false);

	const detailMoment = detailMomentId ? momentsData.find(item => item._id === detailMomentId) || null : null;
	const detailIndex = detailMoment ? momentsData.findIndex(item => item._id === detailMoment._id) : -1;
	const hasPrevDetail = detailIndex > 0;
	const hasNextDetail = detailIndex >= 0 && detailIndex < momentsData.length - 1;

	const handleRequestDetail = useCallback((momentItem) => {
		if (!momentItem?._id) return;
		isManuallyClosedRef.current = false;
		setDetailMomentId(momentItem._id);
	}, []);

	useEffect(() => {
		if (!midFromQuery) {
			setDetailMomentId(null);
			isManuallyClosedRef.current = false;
			return;
		}
		if (isManuallyClosedRef.current) return;
		if (momentsData.some(item => item._id === midFromQuery)) {
			setDetailMomentId(midFromQuery);
		}
	}, [midFromQuery, momentsData]);

	useEffect(() => {
		if (!detailMoment) return;
		setDetailLike(likedMoments.includes(detailMoment._id));
		setDetailLikeNumbers(detailMoment.likes || 0);
	}, [detailMoment, likedMoments]);

	useEffect(() => {
		if (!detailMoment) {
			setDetailFilesInfos([]);
			return;
		}
		const currentId = detailMoment._id;
		const cached = momentsFilesCache[currentId];
		if (cached !== undefined) {
			setDetailFilesInfos(cached);
			return;
		}
		if (!detailMoment.filenames || detailMoment.filenames.length === 0) {
			setDetailFilesInfos([]);
			return;
		}
		let cancelled = false;
		async function fetchDetailFiles() {
			const result = await getFiles(detailMoment.filenames, 'moments');
			const list = result || [];
			if (cancelled) return;
			setDetailFilesInfos(list);
			setMomentsFilesCache(prev => ({ ...prev, [currentId]: list }));
		}
		fetchDetailFiles();
		return () => {
			cancelled = true;
		};
	}, [detailMoment, momentsFilesCache, setMomentsFilesCache]);

	const setCommentToDt = useCallback((newCommentId) => {
		if (!detailMomentId || !newCommentId) return;
		setMomentsData(prev => prev.map(item => {
			if (item._id !== detailMomentId) return item;
			if (item.comments?.includes(newCommentId)) return item;
			return { ...item, comments: [...(item.comments || []), newCommentId] };
		}));
	}, [detailMomentId, setMomentsData]);

	const handlePrevDetail = useCallback((e) => {
		e?.stopPropagation?.();
		if (!hasPrevDetail) return;
		const prev = momentsData[detailIndex - 1];
		if (!prev) return;
		onOpenDetails(prev._id);
		setDetailMomentId(prev._id);
		incrementMomentView(prev._id);
	}, [detailIndex, hasPrevDetail, momentsData, onOpenDetails]);

	const handleNextDetail = useCallback((e) => {
		e?.stopPropagation?.();
		if (!hasNextDetail) return;
		const next = momentsData[detailIndex + 1];
		if (!next) return;
		onOpenDetails(next._id);
		setDetailMomentId(next._id);
		incrementMomentView(next._id);
	}, [detailIndex, hasNextDetail, momentsData, onOpenDetails]);

	const onMomentDeleted = useCallback(() => {
		if (!detailMomentId) return;
		markMomentDeleting(detailMomentId);
		setDetailMomentId(null);
		onCloseDetails();
	}, [detailMomentId, markMomentDeleting, onCloseDetails]);

	const handleCloseDetailPop = useCallback((proceed) => {
		isManuallyClosedRef.current = true;
		setDetailMomentId(null);
		onCloseDetails();
		if (typeof proceed === 'function') proceed();
	}, [onCloseDetails]);

	const detailHeadshotType = detailMoment
		? (['u_mg94ixwg_df9ff1a129ad44a6', 'u_mg94t4ce_6485ab4d88f2f8db'].includes(detailMoment.uid) ? adminImg : detailMoment.uid === 'u_mlkpl8fl_52a3d8c2068b281a' ? binesImg : null)
		: null;

	// 首次无数据时拉取并写入 context；与 gallery 一致，避免切换路由重复加载
	const fetchMoments = useCallback(async () => {
		setLoading(true);
		try {
			const data = await getMoments();
			const liked = await getLikesList();
			setMomentsData(data);
			setLikedMoments(liked);
		} finally {
			setLoading(false);
		}
	}, [setMomentsData, setLikedMoments]);
	useEffect(() => {
		if (momentsData.length === 0 && !editing) fetchMoments();
	}, [editing, momentsData.length, fetchMoments]);

	// 直接根据数据渲染列表，midFromQuery 变化时只更新 props 不整表替换，避免关闭详情时卡片重挂载导致 Pop 关闭动画重播
	const listContent = loading && momentsData.length === 0
		? null
		: momentsData.length === 0
			? 'no moments yet'
			: momentsData.map(item => (
			<MomentItem
				data={item}
				liked={likedMoments.includes(item._id)}
				key={item._id}
				onOpenDetails={onOpenDetails}
				onRequestDetail={handleRequestDetail}
				isDeleting={deletingIds.includes(item._id)}
			/>
		));
	const elements = listContent;

	// 发布新 moment 关闭弹层后刷新列表并更新 context
	const handleCloseNewMoment = useCallback(() => {
		setEditing(false);
		fetchMoments();
	}, [fetchMoments]);

	// Pop 的关闭：先请求子组件（可弹草稿确认）；无参调用表示动画结束，执行 setEditing(false)
	const newMomentCloseRef = useRef(null);
	const handlePopClose = useCallback((proceed) => {
		if (proceed === undefined || typeof proceed !== 'function') {
			setEditing(false);
			fetchMoments();
			return;
		}
		newMomentCloseRef.current?.(proceed);
	}, [fetchMoments]);

	// 获取用户已点赞评论信息
	const [likedComments, setLikedComments] = useState([]);
	const commentLikedChange = (state = true, commentId) => {
		if (state) setLikedComments(prevState => [...prevState, commentId]);
		else setLikedComments(prevState => prevState.filter(item => item !== commentId));
	}
	useEffect(() => {
		const f = async () => {
			const commentsLiked = await getLikesList('moments/comments');
			setLikedComments(commentsLiked);
		}

		f();
		const DELAY = 600000;
		const commentsLikedFetchInterval = setInterval(f, DELAY);

		return () => {
			clearInterval(commentsLikedFetchInterval);
		}
	}, []);


	return (
		<CommentsLikedContext value={{likedComments, commentLikedChange}}>
			<div className="page-enter">
				<section id={'header'}>
					<span>{'Moments'}</span>
					{!isGuest() && <CommonBtn className={addContent.new} text={'New Moment'} onClick={() => setEditing(true)}/>}
				</section>
				{pendingCount > 0 && (
					<button type="button" className={moments.newBanner} onClick={loadPendingNewMoments}>
						存在 {pendingCount} 条新 moment，点击加载
					</button>
				)}
				<div className={moments.entire}>
				{loading && momentsData.length === 0 ? (
					<div className={moments.loading}>
						<span className={moments.loadingDot} />
						Loading...
					</div>
				) : (
					elements
				)}
				</div>
			</div>
			{detailMoment && (
				<Pop isLittle={false} onClose={handleCloseDetailPop}>
					<MomentDetailsCtx
						value={{
							momentItem: detailMoment,
							filesInfos: detailFilesInfos,
							like: detailLike,
							setLike: setDetailLike,
							setLikeNumbers: setDetailLikeNumbers,
							likeNumbers: detailLikeNumbers,
							setCommentToDt,
							onMomentDeleted,
							hasPrevDetail,
							hasNextDetail,
							onPrevDetail: handlePrevDetail,
							onNextDetail: handleNextDetail,
						}}
					>
						<MomentDetails headshotType={detailHeadshotType} />
					</MomentDetailsCtx>
				</Pop>
			)}
			{editing && !isGuest() &&
				<Pop isLittle={false} onClose={handlePopClose}>
					<NewMoment onClose={handleCloseNewMoment} registerCloseHandler={newMomentCloseRef}/>
				</Pop>}
		</CommentsLikedContext>
	);
};

export default Moments;