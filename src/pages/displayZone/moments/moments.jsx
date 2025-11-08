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


	return (
		<MomentIdContext value={{momentItem: dt, setCommentToDt}}>
			<div className={moments.item}>
				<MomentsCard liked={liked} preview={true}/>
			</div>
		</MomentIdContext>
	)
}


const Moments = () => {
	// 根据是否在编辑新moment控制moments获取以及编辑区域显示
	const [editing, setEditing] = useState(false);

	// 获取moments相关信息
	const [elements, setElements] = useState('no moments yet' || []);
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
				<CommonBtn className={addContent.new} text={'New Moment'} onClick={() => setEditing(true)}/>
			</section>
			{editing &&
				<Pop isLittle={false}>
					<NewMoment onClose={() => setEditing(false)}/>
				</Pop>}
			<div className={moments.entire}>
				<CommentsLikedContext value={{likedComments, commentLikedChange}}>
					{elements}
				</CommentsLikedContext>
			</div>
		</>
	);
};

export default Moments;