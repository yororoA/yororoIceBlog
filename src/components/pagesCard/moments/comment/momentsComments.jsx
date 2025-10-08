import React, {useCallback, useContext, useEffect, useRef, useState} from 'react';
import card from './comments.module.less';
import MomentIdContext from "../../../../pages/displayZone/moments/momentIdContext";
import CommentCard from "./commentCard";
import CommonBtn from "../../../btn/commonBtn/commonBtn";
import {addComment} from "../../../../utils/addComment";
import {getComments} from "../../../../utils/getComments";

const MomentsComments = ({sCMH}) => {
	// {uid,username, comments, content, title, createdAt, _id, likes, filenames}
	const item = useContext(MomentIdContext);
	const {_id} = item;
	const [comments,setComments] = useState(item.comments);


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
			setComments(prev => [...prev, resp.data._id]);
		}
	}, [content, _id]);

	const CMHref = useRef();
	useEffect(() => {
		if (!CMHref.current) return;
		const el = CMHref.current;
		const measure = () => sCMH(parseFloat(window.getComputedStyle(el).minHeight) || 0);
		// 初次测量
		measure();
		// 监听尺寸变化
		const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(measure) : null;
		if (ro) ro.observe(el);
		// 回退：窗口尺寸变化时测量
		const onResize = () => measure();
		window.addEventListener('resize', onResize);
		return () => {
			if (ro) ro.disconnect();
			window.removeEventListener('resize', onResize);
		};
	}, [sCMH]);


	return (
		<div className={card.entire} ref={CMHref}>
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