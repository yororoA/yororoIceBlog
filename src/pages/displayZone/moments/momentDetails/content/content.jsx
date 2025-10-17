import React, {useCallback, useContext, useState} from 'react';
import testImg from '../../../../../assets/images/test.jpg';
import Like from "../../../../../components/ui/feedback/like";
import IvPreview from "../../../../../components/ui/image_video_preview/ivPreview";
import {sendMomentLike} from "../../../../../utils/sendMomentLike";
import {MomentDetailsCtx} from "../../../../../components/pagesCard/moments/content/momentsCard";
import card from './content.module.less';


// {uid,username, comments, content, title, createdAt, _id, likes, filenames}
const Content = () => {
	const {momentItem, like, filesInfos, setLike, setLikeNumbers, likeNumbers} = useContext(MomentDetailsCtx);

	const {uid, username, content, title, createdAt, _id} = momentItem;
	const contentForRender = content.split(/\r\n|\n|\r/);

	// img / video
	const [ivs,] = useState([...filesInfos]);
	// texts
	const texts = [];
	contentForRender.map((item, index) => texts.push(<p className={card.caLink}
																											key={`${_id}_content_${index}`}>{item}</p>));

	// 点赞
	const onFeedBackChange = useCallback(async e => {
		const checked = e.target.checked;
		setLike(checked);
		setLikeNumbers(prev => checked ? prev + 1 : prev - 1);
		await sendMomentLike(_id, checked);
	}, [_id]);

	return (
		<div className={card.entire} onClick={e=>e.stopPropagation()}>
			<div className={card.content}>
				{/* alt=username */}
				<img src={testImg} alt="headshot" className={card.headshot} id={uid}/>
				<div className={card.body}>
					<h4>{username}</h4>
					<u><h4>{title}</h4></u>
					{texts}
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
}
export default Content;


