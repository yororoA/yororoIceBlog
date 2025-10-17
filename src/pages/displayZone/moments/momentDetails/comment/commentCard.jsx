import React from 'react';
import testImg from '../../../../../assets/images/test.jpg';
import comment from './comment.module.less';
import IvPreview from "../../../../../components/ui/image_video_preview/ivPreview";



const CommentCard = ({infos}) => {
	// {content, createdAt, likes, momentId, uid, username, _id}
	const {content, createdAt, uid, username} = infos;
	const key = `${uid}_comment_${createdAt}`

	return (
		<div className={comment.item} id={key} key={key}>
			<img src={testImg} alt="" className={comment.headshot}/>
			<div className={comment.content}>
				<h4>{username}</h4>
				<p className={comment.text}>{content}</p>
				{/*<div className={comment.imgPre}>*/}
				{/*	<IvPreview items={testimgs.map(item=>[item, 'image'])} prefix={'av'}/>*/}
				{/*</div>*/}
			</div>
		</div>
	);
};

export default CommentCard;