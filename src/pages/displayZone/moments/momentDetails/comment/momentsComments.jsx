import React, {use, useCallback, useContext, useEffect, useRef, useState} from 'react';
import card from './comments.module.less';
import CommentCard from "./commentCard";
import CommonBtn from "../../../../../components/btn/commonBtn/commonBtn";
import {addComment} from "../../../../../utils/addComment";
import {getComments} from "../../../../../utils/getComments";
import {MomentDetailsCtx} from "../../../../../components/pagesCard/moments/content/momentsCard";

const MomentsComments = () => {
	// {uid,username, comments, content, title, createdAt, _id, likes, filenames}
	const {momentItem, setCommentToDt} = useContext(MomentDetailsCtx);
	const {_id} = momentItem;
	const comments = momentItem.comments;

	// get comments by commentId(from the comments Array of ctx)
	const [elements, setElements] = useState([]);
	useEffect(() => {
		async function f() {
			const data = await getComments(comments);
			if (typeof data === 'object') {
				const elements = [];
				data.map(item => elements.push(
					<CommentCard infos={item} key={Math.floor(Math.random() * 1e10)}/>
				));
				setElements(elements);


				// todo 评论嵌套

			}
		}

		if (comments.length !== 0) f();
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
		}
	}, [_id, content, setCommentToDt]);

	return (
		<div className={card.entire} onClick={e => e.stopPropagation()}>
			<div className={card.main}>
				<h3>{'Comments'}</h3>
				<section className={card.body}>
					{comments.length === 0 ? <h4>{'this moment has no comments yet...'}</h4> : elements}
				</section>
			</div>
			<div className={card.cAll}>
				<input type="textarea" id={'livComment'} placeholder={'Click to leave ur comment'} onChange={handleComment}
							 value={content}/>
				<label htmlFor="livComment"></label>
				<CommonBtn text={'Send'} onClick={handleSend} className={`${hasContent ? card.btnActive : card.btnInacitive}`}/>
			</div>
		</div>
	);
};

export default MomentsComments;