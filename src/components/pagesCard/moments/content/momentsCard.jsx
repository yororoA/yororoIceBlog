import React, {useCallback, useContext, useEffect, useState} from 'react';
import testImg from '../../../../assets/images/test.jpg';
import card from './card.module.less';
import Like from "../../../ui/feedback/like";
import IvPreview from "../../../ui/image_video_preview/ivPreview";
import MomentIdContext from "../../../../pages/displayZone/moments/momentIdContext";
import {getFiles} from "../../../../utils/getFiles";
import {sendMomentLike} from "../../../../utils/sendMomentLike";
import Pop from "../../../ui/pop/pop";
import MomentDetails from "../../../../pages/displayZone/moments/momentDetails/momentDetails";

const MomentsCard = ({liked, preview}) => {
	// {uid,username, comments, content, title, createdAt, _id, likes, filenames}
	const momentItem = useContext(MomentIdContext);
	const {uid, username, content, title, createdAt, _id, likes, filenames} = momentItem;
	const [ivs, setIvs] = useState([]);

	// 文字截断  只有 preview=true (大页面预览)时启用
	const contentForRender = content.split(/\r\n|\r|\n/);
	const [overflow, setOverflow] = useState(false);
	const [overflowSite, setOverflowSite] = useState(-1);
	const [maxRenderedPLines, setPlines] = useState(0);
	useEffect(() => {
		if (preview) {
			const maxDisplayChars = 500;
			let renderedCharsBeforeOverflow = 0;
			let overflow = false;
			let overflowSite = -1;
			let maxRenderedPLines = 0;

			for (const contentForRenderElement of contentForRender) {
				if (renderedCharsBeforeOverflow + contentForRenderElement.length >= maxDisplayChars) {
					overflow = true;
					overflowSite = maxDisplayChars - renderedCharsBeforeOverflow;
					break;
				}
				renderedCharsBeforeOverflow += contentForRenderElement.length;
				maxRenderedPLines += 1;
			}

			setOverflow(overflow);
			setOverflowSite(overflowSite);
			setPlines(maxRenderedPLines);
		}
	}, [contentForRender, preview]);
	const texts = [];
	for (let i = 0; i < contentForRender.length; i++) {
		if (overflow && i >= maxRenderedPLines - 1) {
			if (overflowSite !== -1) {
				texts.push(<p className={card.caLink}
											key={`${_id}_content_${i}`}>{`${contentForRender[i].slice(0, overflowSite)}`}</p>);
				texts.push(<p className={card.caLink} key={`${_id}_content_${i + 1}`}>{'...view more'}</p>);
				break;
			}
			texts.push(<p className={card.caLink} key={`${_id}_content_${i}`}>{'view more'}</p>);
			break;
		}
		texts.push(<p className={card.caLink} key={`${_id}_content_${i}`}>{contentForRender[i]}</p>);
	}


	// 获取moment对应的文件
	useEffect(() => {
		// 首次异步获取媒体
		async function f() {
			const ivs = await getFiles(filenames, 'moments');
			setIvs(ivs);
		}

		if (filenames.length !== 0) f();
	}, [filenames]);

	// 点赞
	const [like, setLike] = useState(liked); // 是否点赞
	const [likeNumbers, setLikeNumbers] = useState(likes); // 点赞数量
	const onFeedBackChange = useCallback(async e => {
		const checked = e.target.checked;
		setLike(checked);
		setLikeNumbers(prev => checked ? prev + 1 : prev - 1);
		await sendMomentLike(_id, checked);
	}, [_id]);


	// 查看 moment 详情
	const [showDetails, setShowDetails] = useState(false);

	return (
		<>
			<div className={card.entire} onClick={preview ? () => setShowDetails(true) : undefined}>
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
			{showDetails &&
				<Pop isLittle={false} onClose={()=>setShowDetails(false)}>
					<MomentDetails/>
				</Pop>
			}
		</>
	);
};

export default MomentsCard;

