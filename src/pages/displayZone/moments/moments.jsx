import React, {useEffect, useState} from 'react';
import MomentsCard from "../../../components/pagesCard/moments/content/momentsCard";
import moments from './moments.module.less';
import MomentIdContext from "./context/momentIdContext";
import CommonBtn from "../../../components/btn/commonBtn/commonBtn";
import addContent from "../../../components/btn/addContent.module.less";
import Pop from "../../../components/ui/pop/pop";
import NewMoment from "../../../components/ui/pop/newMoment/newMoment";
import {getMoments} from "../../../utils/getMoments";
import {getLikesList} from "../../../utils/getLikesList";
import {useSelector} from "react-redux";
import {CommentsLikedContext} from "./context/commentsLikedContext";


const MomentItem = ({data, liked}) => {
	// {uid,username, comments, content, title, createdAt, _id, likes, filenames}
	const [dt, setDt] = useState(data);
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


	const [likedComments, setLikedComments] = useState([]);
	useEffect(() => {
		const DELAY = 600000;

		const commentsLikedFetchInterval = setInterval(async () => {
			const commentsLiked = await getLikesList('comments');
			setLikedComments(commentsLiked);
		}, DELAY);

		return () => {
			clearInterval(commentsLikedFetchInterval);
		}
	}, []);

	return (
		<MomentIdContext value={{momentItem: dt, setCommentToDt}}>
			<CommentsLikedContext value={{likedComments}}>
				<div className={moments.item}>
					<MomentsCard liked={liked} preview={true}/>
				</div>
			</CommentsLikedContext>
		</MomentIdContext>
	)
}


const Moments = () => {
	// 根据是否在编辑新moment控制moments获取以及编辑区域显示
	const [editing, setEditing] = useState(false);


	useEffect(() => {
		async function f() {
			const data = await getMoments();
			const likedMoments = await getLikesList(); // 已点赞列表
			setElements(data.map(item => (
				<MomentItem data={item} liked={likedMoments.includes(item._id)} key={item._id}/>
			)));
		}

		// 未处在编辑状态时获取moments列表
		if (!editing) f();
	}, [editing]);

	const [elements, setElements] = useState('no moments yet' || []);


	return (
		<>
			<section id={'header'}>
				<span>{'Moments'}</span>
				<CommonBtn className={addContent.new} text={'New Moment'} onClick={() => setEditing(true)}/>
			</section>
			{editing &&
				<Pop isLittle={false}>
					<NewMoment onClose={() => setEditing(false)}/>
				</Pop>}
			<div className={moments.entire}>
				{elements}
			</div>
		</>
	);
};

export default Moments;