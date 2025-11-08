import React, {useContext, useState} from 'react';
import testImg from '../../../../../assets/images/test.jpg';
import comment from './comment.module.less';
import IvPreview from "../../../../../components/ui/image_video_preview/ivPreview";
import Like from "../../../../../components/ui/feedback/like";
import {CommentsLikedContext} from "../../context/commentsLikedContext";


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

	// todo 评论点赞, 评论嵌套
	return (
		<div className={comment.item} id={key} key={key}>
			<img src={testImg} alt="" className={comment.headshot}/>
			<div className={comment.content}>
				<h4>
					<em>{username}</em>
					<Like type={'comment'} _id={_id} likes={likes} onChange={onChange} checked={liked}/>
				</h4>
				<p className={comment.text}>{content}</p>
				{/*<div className={comment.imgPre}>*/}
				{/*	<IvPreview items={testimgs.map(item=>[item, 'image'])} prefix={'av'}/>*/}
				{/*</div>*/}
			</div>
		</div>
	);
};

export default CommentCard;