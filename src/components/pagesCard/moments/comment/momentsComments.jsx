import React, {useCallback, useContext, useEffect, useRef, useState} from 'react';
import card from './comments.module.less';
import MomentIdContext from "../../../../pages/displayZone/moments/momentIdContext";
import CommentCard from "./commentCard";
import CommonBtn from "../../../btn/commonBtn/commonBtn";

const MomentsComments = ({sCMH}) => {
	const {comments} = useContext(MomentIdContext);

	// check value to control sendBtn style
	const [hasContent, setHasContent] = useState(false);
	const handleComment = useCallback(e => {
		if (e.target.value.length === 0) setHasContent(false);
		else setHasContent(true);
	}, []);
	// upload comment to server
	const handleSend = useCallback(e => {

	}, []);

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
					{comments.length===0?<h4>{'this moment has no comments yet...'}</h4>:<CommentCard/>}
				</section>
			</div>
			<div className={card.cAll}>
				<input type="textarea" id={'livComment'} placeholder={'Click to leave ur comment'} onChange={handleComment}/>
				<label htmlFor="livComment"></label>
				<CommonBtn text={'Send'} onClick={handleSend} className={`${hasContent ? card.btnActive : card.btnInacitive}`}/>
			</div>
		</div>
	);
};

export default MomentsComments;