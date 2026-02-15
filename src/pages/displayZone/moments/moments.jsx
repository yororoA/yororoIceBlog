import React, {useCallback, useContext, useEffect, useRef, useState} from 'react';
import { useSearchParams } from "react-router-dom";
import MomentsCard from "../../../components/pagesCard/moments/content/momentsCard";
import moments from './moments.module.less';
import MomentIdContext from "./context/momentIdContext";
import { MomentsListContext } from "./context/momentsListContext";
import CommonBtn from "../../../components/btn/commonBtn/commonBtn";
import addContent from "../../../components/btn/addContent.module.less";
import Pop from "../../../components/ui/pop/pop";
import NewMoment from "../../../components/ui/pop/newMoment/newMoment";
import {getMoments} from "../../../utils/getMoments";
import {getLikesList} from "../../../utils/getLikesList";
import {useSelector} from "react-redux";
import {CommentsLikedContext} from "./context/commentsLikedContext";
import { isGuest } from "../../../utils/auth";


const MomentItem = ({data, liked, openDetailsOnMount, onCloseDetails, onOpenDetails, isDeleting}) => {
	// {uid,username, comments, content, title, createdAt, _id, likes, filenames, updatedAt}
	const [dt, setDt] = useState(data);
	// new comment updated
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
			<div className={`${moments.item}${isDeleting ? ` ${moments.itemDeleting}` : ''}`}>
				<MomentsCard liked={liked} preview={true} openDetailsOnMount={openDetailsOnMount} onCloseDetails={onCloseDetails} onOpenDetails={onOpenDetails}/>
			</div>
		</MomentIdContext>
	)
}


const Moments = () => {
	const [momentsData, setMomentsData, likedMoments, setLikedMoments, , , deletingIds = [], , pendingNewMoments = [], loadPendingNewMoments] = useContext(MomentsListContext);
	const pendingCount = pendingNewMoments.length;
	const [editing, setEditing] = useState(false);

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

	// 首次无数据时拉取并写入 context；与 gallery 一致，避免切换路由重复加载
	const fetchMoments = useCallback(async () => {
		const data = await getMoments();
		const liked = await getLikesList();
		setMomentsData(data);
		setLikedMoments(liked);
	}, [setMomentsData, setLikedMoments]);
	useEffect(() => {
		if (momentsData.length === 0 && !editing) fetchMoments();
	}, [editing, momentsData.length, fetchMoments]);

	// 由 context 中的 momentsData / likedMoments 渲染列表
	const [elements, setElements] = useState([]);
	useEffect(() => {
		if (momentsData.length === 0) {
			setElements([]);
			return;
		}
		setElements(momentsData.map(item => (
			<MomentItem
				data={item}
				liked={likedMoments.includes(item._id)}
				key={item._id}
				openDetailsOnMount={midFromQuery === item._id}
				onCloseDetails={onCloseDetails}
				onOpenDetails={onOpenDetails}
				isDeleting={deletingIds.includes(item._id)}
			/>
		)));
	}, [momentsData, likedMoments, midFromQuery, onCloseDetails, onOpenDetails, deletingIds]);

	// 发布新 moment 关闭弹层后刷新列表并更新 context
	const handleCloseNewMoment = useCallback(() => {
		setEditing(false);
		fetchMoments();
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
			console.log(commentsLiked)
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
		<>
			<section id={'header'}>
				<span>{'Moments'}</span>
				{!isGuest() && <CommonBtn className={addContent.new} text={'New Moment'} onClick={() => setEditing(true)}/>}
			</section>
			{pendingCount > 0 && (
				<button type="button" className={moments.newBanner} onClick={loadPendingNewMoments}>
					存在 {pendingCount} 条新 moment，点击加载
				</button>
			)}
			{editing &&
				<Pop isLittle={false}>
					<NewMoment onClose={handleCloseNewMoment}/>
				</Pop>}
			<div className={moments.entire}>
				<CommentsLikedContext value={{likedComments, commentLikedChange}}>
					{elements.length > 0 ? elements : 'no moments yet'}
				</CommentsLikedContext>
			</div>
		</>
	);
};

export default Moments;