import React from 'react';
import testImg from '../../../../../assets/images/test.jpg';
import comment from './comment.module.less';
import IvPreview from "../../../../../components/ui/image_video_preview/ivPreview";



const CommentCard = ({infos}) => {
	// {content, createdAt, likes, momentId, uid, username, _id}
	const {content, createdAt, uid, username, likes} = infos;
	const key = `${uid}_comment_${createdAt}`

	// todo 评论点赞, 评论嵌套
	return (
		<div className={comment.item} id={key} key={key}>
			<img src={testImg} alt="" className={comment.headshot}/>
			<div className={comment.content}>
				<h4>
					<em>{username}</em>

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