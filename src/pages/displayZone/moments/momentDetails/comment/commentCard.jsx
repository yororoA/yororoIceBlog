import React, {useContext, useRef, useState} from 'react';
import testImg from '../../../../../assets/images/test.jpg';
import comment from './comment.module.less';
import IvPreview from "../../../../../components/ui/image_video_preview/ivPreview";
import Like from "../../../../../components/ui/feedback/like";
import {CommentsLikedContext} from "../../context/commentsLikedContext";
import LittlePop from "../../../../../components/ui/pop/littlePop/littlePop";
import CommentBelong from "../../../../../components/ui/pop/littlePop/commentBelong/commentBelong";


const CommentCard = ({infos}) => {
	// {content, createdAt, likes, momentId, uid, username, _id}
	const {content, createdAt, uid, username, likes, _id} = infos;
	const key = `${uid}_comment_${createdAt}`
	// todo 评论点赞处理
	const {likedComments, commentLikedChange} = useContext(CommentsLikedContext);
	const [liked, setLiked] = useState(likedComments.includes(_id));
	const onChange = (e) => {
		const checked = e.target.checked;
		setLiked(checked);
		commentLikedChange(checked, _id);
	}

	// todo 评论回复
	// reply logic
	const [onReply, setOR] = useState(false);
	const endReply = () => setOR(false);

	// todo 评论点赞, 评论嵌套
	return (
		<div className={comment.item} id={key} key={key}>
			<img src={testImg} alt="" className={comment.headshot}/>
			<div className={comment.content}>
				<div className={comment.left}>
					<h4>
						<em>{username}</em>
					</h4>
					<p className={comment.text}>{content}</p>
				</div>
				<div className={comment.right}>
					<Like type={'comment'} _id={_id} likes={likes} onChange={onChange} checked={liked}/>
					<p className={comment.reply} onClick={() => setOR(true)}>{'reply'}</p>
				</div>
				{/*<div className={comment.imgPre}>*/}
				{/*	<IvPreview items={testimgs.map(item=>[item, 'image'])} prefix={'av'}/>*/}
				{/*</div>*/}
			</div>
			{onReply && <CommentBelong belongUser={username} belongMSG={content} belongId={_id} onEnd={endReply}/>}
		</div>
	);
};

export default CommentCard;