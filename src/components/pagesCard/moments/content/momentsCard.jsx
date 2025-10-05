import React, {useCallback, useContext, useEffect, useRef, useState} from 'react';
import testImg from '../../../../assets/images/test.jpg';
import card from './card.module.less';
import Like from "../../../ui/feedback/like";
import IvPreview from "../../../ui/image_video_preview/ivPreview";
import MomentIdContext from "../../../../pages/displayZone/moments/momentIdContext";
import {getMomentFiles} from "../../../../utils/getMomentFiles";
import {sendMomentLike} from "../../../../utils/sendMomentLike";

const MomentsCard = ({sCTH, liked}) => {
	// {uid,username, comments, content, title, createdAt, _id, likes, filenames}
	const momentItem = useContext(MomentIdContext);
	const {uid, username, content, title, createdAt, _id, likes, filenames} = momentItem;
	const [ivs, setIvs] = useState([]);

	const cardRef = useRef();
	// 获取moment对应的文件
	useEffect(() => {
		// 首次异步获取媒体
		async function f() {
			const ivs = await getMomentFiles(filenames, 'moments');
			setIvs(ivs);
		}

		if (filenames.length !== 0) f();
	}, [filenames]);

	// 监测尺寸变化并测量
	useEffect(() => {
		if (!cardRef.current) return;
		const el = cardRef.current;
		const measure = () => sCTH(el?.offsetHeight || 0);
		// 初次测量
		measure();
		// 尺寸变化自动测量
		const ro = typeof ResizeObserver !== 'undefined'
			? new ResizeObserver(measure)
			: null;
		if (ro) ro.observe(el);
		// 退化：窗口尺寸变化时也测一次
		const onResize = () => measure();
		window.addEventListener('resize', onResize);
		return () => {
			if (ro) ro.disconnect();
			window.removeEventListener('resize', onResize);
		};
	}, [sCTH]);

	// 点赞
	const [like, setLike] = useState(liked); // 是否点赞
	const [likeNumbers, setLikeNumbers] = useState(likes); // 点赞数量
	const onFeedBackChange = useCallback(async e => {
		const checked = e.target.checked;
		setLike(checked);
		setLikeNumbers(prev => checked ? prev + 1 : prev - 1);
		await sendMomentLike(_id, checked);
	}, [_id]);


	return (
		<div className={card.entire} ref={cardRef}>
			<div className={card.content}>
				{/* alt=username */}
				<img src={testImg} alt="headshot" className={card.headshot} id={uid}/>
				<div className={card.body}>
					<h4>{username}</h4>
					<u><h4>{title}</h4></u>
					{content.split('\r\n').map((item, index) =>
						<p className={card.text}
							 key={`${_id}_content_${index}`}>{item}</p>)}
					<div className={card.live}>
						<IvPreview items={ivs.map(item => [item.url, 'image'])} prefix={`${_id}_iv`}/>
					</div>
				</div>
			</div>
			<div className={card.footer}>
				<Like onChange={onFeedBackChange} checked={like} likes={likeNumbers} _id={_id}/>
			</div>
		</div>
	);
};

export default MomentsCard;