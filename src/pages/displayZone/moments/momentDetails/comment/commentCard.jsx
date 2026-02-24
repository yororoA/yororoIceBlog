import React, { useContext, useState } from 'react';
import comment from './comment.module.less';
import { getAvatarColor } from '../../../../../utils/avatarColor';
import Like from "../../../../../components/ui/feedback/like";
import { CommentsLikedContext } from "../../context/commentsLikedContext";
import CommentBelong from "../../../../../components/ui/pop/littlePop/commentBelong/commentBelong";
import { sendCommentLike } from "../../../../../utils/sendCommentLike";
import { formatDateTime } from "../../../../../utils/formatDateTime";
import { SuccessBoardContext } from "../../../../../components/ui/pop/status/successBoardContext";
import { isGuest } from "../../../../../utils/auth";
import { MomentDetailsCtx } from "../../../../../components/pagesCard/moments/content/momentsCard";
import adminImg from '../../../../../assets/images/admin.png';
import binesImg from '../../../../../assets/images/bines.png';

const CommentCard = ({ infos }) => {
	// {content, createdAt, likes, momentId, uid, username, _id, belong}
	const { content, createdAt, uid, username, likes, _id } = infos;
	const { momentItem, setCommentToDt } = useContext(MomentDetailsCtx);
	const admin = ['u_mg94ixwg_df9ff1a129ad44a6', 'u_mg94t4ce_6485ab4d88f2f8db'];
	const bines = 'u_mlkpl8fl_52a3d8c2068b281a';
	const headshotType = admin.includes(uid) ? adminImg : bines === uid ? binesImg : null;
	const key = `${uid}_comment_${createdAt}`
	// 评论点赞处理
	const {likedComments, commentLikedChange} = useContext(CommentsLikedContext);
	const { showSuccess } = useContext(SuccessBoardContext);
	const isLiked = likedComments.includes(_id);
	const [likeCount, setLikeCount] = useState(likes);

	const onChange = async (e) => {
		const checked = e.target.checked;
		const prevLiked = isLiked;
		const prevCount = likeCount;

		// 先更新本地上下文，保证交互流畅
		commentLikedChange(checked, _id);

		try {
			const result = await sendCommentLike(_id, checked);
			if (result.ok && result.data && result.data.data) {
				const {likes: serverLikes, hasLiked} = result.data.data;
				if (typeof serverLikes === 'number') setLikeCount(serverLikes);
				// 以服务端 hasLiked 为准同步上下文
				if (typeof hasLiked === 'boolean') {
					commentLikedChange(hasLiked, _id);
				}
				if (checked) showSuccess('Liked');
			} else {
				// 请求失败：回滚本地状态
				commentLikedChange(prevLiked, _id);
				setLikeCount(prevCount);
			}
		} catch (err) {
			console.error('发送评论点赞失败:', err);
			commentLikedChange(prevLiked, _id);
			setLikeCount(prevCount);
		}
	}

	const [onReply, setOR] = useState(false);
	const endReply = () => setOR(false);

	const createdTimeForDisplay = formatDateTime(createdAt);
	return (
		<div className={comment.item} id={key} key={key}>
			{headshotType ? (
				<img src={headshotType} alt="headshot" className={comment.headshot}/>
			) : (
				<div className={comment.avatarInitial} style={{backgroundColor: getAvatarColor(uid)}}>
					{username ? username.charAt(0).toUpperCase() : '?'}
				</div>
			)}
			<div className={comment.content}>
				<div className={comment.left}>
					<div className={comment.meta}>
						<h4>
							<em>{username}</em>
						</h4>
						{createdTimeForDisplay && <span className={comment.date}>{createdTimeForDisplay}</span>}
					</div>
					<p className={comment.text}>{content}</p>
				</div>
				<div className={comment.right}>
					<Like type={'comment'} _id={_id} likes={likeCount} onChange={onChange} checked={isLiked} disabled={isGuest()} />
					{!isGuest() && (
						<p className={comment.reply} onClick={() => setOR(true)} role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && setOR(true)}>{'reply'}</p>
					)}
				</div>
			</div>
			{onReply && momentItem && setCommentToDt && (
				<CommentBelong
					belongUser={username}
					belongMSG={content}
					belongId={_id}
					momentId={momentItem._id}
					setCommentToDt={setCommentToDt}
					onEnd={endReply}
				/>
			)}
		</div>
	);
};

export default CommentCard;