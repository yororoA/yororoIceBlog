import React, {createContext, useCallback, useContext, useEffect, useState} from 'react';
import testImg from '../../../../assets/images/test.jpg';
import adminImg from '../../../../assets/images/admin.png';
import binesImg from '../../../../assets/images/bines.png';
import card from './card.module.less';
import Like from "../../../ui/feedback/like";
import IvPreview from "../../../ui/image_video_preview/ivPreview";
import MomentIdContext from "../../../../pages/displayZone/moments/context/momentIdContext";
import { MomentsListContext } from "../../../../pages/displayZone/moments/context/momentsListContext";
import { SuccessBoardContext } from "../../../ui/pop/status/successBoardContext";
import { getUid, isGuest } from "../../../../utils/auth";
import {getFiles} from "../../../../utils/getFiles";
import {sendMomentLike} from "../../../../utils/sendMomentLike";
import {deleteMoment} from "../../../../utils/deleteMoment";
import Pop from "../../../ui/pop/pop";
import MomentDetails from "../../../../pages/displayZone/moments/momentDetails/momentDetails";
import {formatDateTime} from "../../../../utils/formatDateTime";

// context of moment details
export const MomentDetailsCtx = createContext({});

const MomentsCard = ({liked, preview, openDetailsOnMount, onCloseDetails, onOpenDetails}) => {
	// {uid,username, comments, content, title, createdAt, _id, likes, filenames, updatedAt}
	const {momentItem, setCommentToDt} = useContext(MomentIdContext);
	const [, , , , momentsFilesCache, setMomentsFilesCache, , markMomentDeleting] = useContext(MomentsListContext);
	const { showSuccess, showFailed } = useContext(SuccessBoardContext);
	const {uid, username, content, title, createdAt, updatedAt, _id, likes, filenames} = momentItem;
	const admin = ['u_mg94ixwg_df9ff1a129ad44a6', 'u_mg94t4ce_6485ab4d88f2f8db'];
	const bines = 'u_mlkpl8fl_52a3d8c2068b281a';
	const headshotType = admin.includes(uid) ? adminImg : bines === uid ? binesImg : testImg;
	const cachedIvs = momentsFilesCache[_id];
	const [ivs, setIvs] = useState(() => cachedIvs ?? []);

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


	// 获取 moment 对应文件：先读 context 缓存，无则请求并写入缓存；游客模式不请求
	useEffect(() => {
		if (cachedIvs !== undefined) {
			setIvs(cachedIvs);
			return;
		}
		if (filenames.length === 0 || isGuest()) return;
		async function f() {
			const result = await getFiles(filenames, 'moments');
			const list = result || [];
			setIvs(list);
			setMomentsFilesCache(prev => ({ ...prev, [_id]: list }));
		}
		f();
	}, [filenames, _id, cachedIvs, setMomentsFilesCache]);

	// 点赞
	const [like, setLike] = useState(liked); // 是否点赞
	const [likeNumbers, setLikeNumbers] = useState(likes); // 点赞数量
	const onFeedBackChange = useCallback(async e => {
		const checked = e.target.checked;
		setLike(checked);
		setLikeNumbers(prev => checked ? prev + 1 : prev - 1);
		await sendMomentLike(_id, checked);
		if (checked) showSuccess('Liked');
	}, [_id, showSuccess]);


	// 查看 moment 详情（支持通过 URL 查询参数 mid 自动打开）
	const [showDetails, setShowDetails] = useState(false);
	// 有图时需等 getFiles 完成再打开详情，否则详情里图片无法展示
	useEffect(() => {
		if (!openDetailsOnMount) return;
		const mediaReady = filenames.length === 0 || ivs.length > 0;
		if (mediaReady) setShowDetails(true);
	}, [openDetailsOnMount, filenames.length, ivs.length]);

	// 展示时间：优先使用 updatedAt，没有则回退到 createdAt
	const displayTime = formatDateTime(updatedAt || createdAt);

	const currentUid = getUid();
	const canDelete = !isGuest() && (currentUid === uid || admin.includes(currentUid));

	const handleShare = useCallback((e) => {
		e.stopPropagation();
		const url = `${window.location.origin}/town/moments?mid=${_id}`;
		navigator.clipboard.writeText(url).then(() => showSuccess('Link copied')).catch(() => {});
	}, [_id, showSuccess]);

	const removeFromListAndClose = useCallback(() => {
		markMomentDeleting(_id);
		setShowDetails(false);
		showSuccess('Deleted');
	}, [_id, markMomentDeleting, showSuccess]);

	const handleDelete = useCallback(async (e) => {
		e.stopPropagation();
		try {
			await deleteMoment(_id, uid);
			removeFromListAndClose();
		} catch (err) {
			showFailed(err.message || 'Delete failed');
		}
	}, [_id, uid, removeFromListAndClose, showFailed]);

	return (
		<>
			<div className={card.entire} onClick={preview ? () => { setShowDetails(true); onOpenDetails?.(_id); } : undefined}>
				<div className={card.content}>
					{/* alt=username */}
					<img src={headshotType} alt="headshot" className={card.headshot} id={uid}/>
					<div className={card.body}>
						<h4>{username}</h4>
						<u><h4>{title}</h4></u>
						{displayTime && <p className={card.date}>{displayTime}</p>}
						{texts}
						<div className={card.live}>
							<IvPreview items={ivs.map(item => [item.url, 'image'])} prefix={`${_id}_iv`}/>
						</div>
					</div>
				</div>
				<div className={card.footer} onClick={e=>e.stopPropagation()}>
					<Like onChange={onFeedBackChange} checked={like} likes={likeNumbers} _id={_id} disabled={isGuest()}/>
					<div className={card.actions}>
						{canDelete && (
							<button type="button" className={card.actionBtn} onClick={handleDelete}>{'删除'}</button>
						)}
						<button type="button" className={card.actionBtn} onClick={handleShare}>{'分享'}</button>
					</div>
				</div>
			</div>
			{showDetails &&
				<Pop isLittle={false} onClose={() => { setShowDetails(false); onCloseDetails?.(); }}>
					<MomentDetailsCtx value={{momentItem, filesInfos: ivs, like, setLike, setLikeNumbers, likeNumbers, setCommentToDt, onMomentDeleted: removeFromListAndClose}}>
						<MomentDetails headshotType={headshotType} />
					</MomentDetailsCtx>
				</Pop>
			}
		</>
	);
};

export default MomentsCard;


