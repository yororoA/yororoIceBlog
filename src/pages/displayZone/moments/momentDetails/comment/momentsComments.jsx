import React, { useCallback, useContext, useEffect, useRef, useState } from 'react';
import card from './comments.module.less';
import CommentCard from './commentCard';
import CommonBtn from '../../../../../components/btn/commonBtn/commonBtn';
import { addComment } from '../../../../../utils/addComment';
import { getComments } from '../../../../../utils/getComments';
import { treeBuilder } from '../../../../../utils/treeBuilder';
import { MomentDetailsCtx } from '../../../../../components/pagesCard/moments/content/momentsCard';
import { SuccessBoardContext } from '../../../../../components/ui/pop/status/successBoardContext';
import { isGuest } from '../../../../../utils/auth';
import { useWheelInertia } from '../../../../../hooks/useWheelInertia';

/** 递归渲染单条评论及其回复（树节点） */
const CommentTreeNode = ({ node }) => {
	if (!node) return null;
	return (
		<div className={card.commentNode} key={node._id}>
			<CommentCard infos={node} />
			{node.children && node.children.length > 0 && (
				<div className={card.commentChildren}>
					{node.children.map((child) => (
						<CommentTreeNode key={child._id} node={child} />
					))}
				</div>
			)}
		</div>
	);
};

const MomentsComments = () => {
	const { momentItem, setCommentToDt } = useContext(MomentDetailsCtx);
	const { showSuccess } = useContext(SuccessBoardContext);
	const { _id } = momentItem;
	const comments = momentItem.comments;

	const [commentTree, setCommentTree] = useState([]);
	useEffect(() => {
		async function f() {
			const data = await getComments(comments);
			if (typeof data !== 'object' || !Array.isArray(data)) return;
			const normalized = data.map((c) => ({
				...c,
				_id: String(c._id),
				belong: c.belong != null && c.belong !== '' ? String(c.belong) : undefined,
			}));
			const roots = treeBuilder(normalized, '_id', 'belong');
			setCommentTree(roots);
		}
		if (comments.length !== 0) f();
		else setCommentTree([]);
	}, [comments]);

	// check value to control sendBtn style
	const [hasContent, setHasContent] = useState(false);
	const [content, setContent] = useState(''); // the content of commentInput
	const handleComment = useCallback(e => {
		setHasContent(e.target.value.length !== 0);
		setContent(e.target.value);
	}, []);
	// upload comment to server
	const handleSend = useCallback(async () => {
		const payload = {
			momentId: _id, comment: content
		};
		const resp = await addComment(payload);
		if (resp.message === 'ok') {
			setHasContent(false);
			setContent('');
			const new_id = resp.data._id;
			setCommentToDt(new_id);
			showSuccess('Commented');
		}
	}, [_id, content, setCommentToDt, showSuccess]);

	const mainScrollRef = useRef(null);
	useWheelInertia(mainScrollRef);

	return (
		<div className={card.entire} onClick={e => e.stopPropagation()}>
			<div ref={mainScrollRef} className={card.main}>
				<h3>{'Comments'}</h3>
				<section className={card.body}>
					{comments.length === 0 ? (
						<h4>{'this moment has no comments yet...'}</h4>
					) : (
						commentTree.map((node) => <CommentTreeNode key={node._id} node={node} />)
					)}
				</section>
			</div>
			{!isGuest() && (
				<div className={card.cAll}>
					<input type="textarea" id={'livComment'} placeholder={'Click to leave ur comment'} onChange={handleComment}
								 value={content}/>
					<label htmlFor="livComment"></label>
					<CommonBtn text={'Send'} onClick={handleSend} className={`${hasContent ? card.btnActive : card.btnInacitive}`}/>
				</div>
			)}
		</div>
	);
};

export default MomentsComments;