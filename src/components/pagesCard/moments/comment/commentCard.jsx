import React from 'react';
import testImg from '../../../../assets/images/test.jpg';
import comment from './comment.module.less';
import IvPreview from "../../../ui/image_video_preview/ivPreview";



const CommentCard = () => {
	const testimgs = [testImg, testImg, testImg, testImg, testImg, testImg];


	return (
		<div className={comment.item}>
			<img src={testImg} alt="" className={comment.headshot}/>
			<div className={comment.content}>
				<h4 id='username'>{'username'}</h4>
				<p className={comment.text}>{'CommentCommentCommentCommentCommentCommentCommentCommentCommentCommentCommentCommentCommentComment'}</p>
				<div className={comment.imgPre}>
					<IvPreview items={testimgs.map(item=>[item, 'image'])} prefix={'av'}/>
				</div>
			</div>
		</div>
	);
};

export default CommentCard;