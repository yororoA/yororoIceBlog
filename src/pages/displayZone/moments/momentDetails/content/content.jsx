import React, { useCallback, useContext, useRef } from 'react';
import Like from "../../../../../components/ui/feedback/like";
import IvPreview from "../../../../../components/ui/image_video_preview/ivPreview";
import {sendMomentLike} from "../../../../../utils/sendMomentLike";
import {deleteMoment} from "../../../../../utils/deleteMoment";
import {MomentDetailsCtx} from "../../../../../components/pagesCard/moments/content/momentsCard";
import { SuccessBoardContext } from "../../../../../components/ui/pop/status/successBoardContext";
import { getUid, isGuest } from "../../../../../utils/auth";
import {getAvatarColor} from '../../../../../utils/avatarColor';
import { UiPersistContext } from "../../../context/uiPersistContext";
import { t } from "../../../../../i18n/uiText";
import { useWheelInertia } from '../../../../../hooks/useWheelInertia';
import card from './content.module.less';


// {uid,username, comments, content, title, createdAt, _id, likes, filenames}
const Content = ({ headshotType }) => {
	const {
		momentItem,
		like,
		filesInfos,
		setLike,
		setLikeNumbers,
		likeNumbers,
		onMomentDeleted,
		hasPrevDetail,
		hasNextDetail,
		onPrevDetail,
		onNextDetail,
	} = useContext(MomentDetailsCtx);
	const { locale } = useContext(UiPersistContext);
	const { showSuccess, showFailed } = useContext(SuccessBoardContext);

	// const {uid, username, content, title, createdAt, _id} = momentItem;
	const {uid, username, content, title, _id} = momentItem;
	const admin = ['u_mg94ixwg_df9ff1a129ad44a6', 'u_mg94t4ce_6485ab4d88f2f8db'];
	const currentUid = getUid();
	const canDelete = !isGuest() && (currentUid === uid || admin.includes(currentUid));
	const contentForRender = content.split(/\r\n|\n|\r/);

	// 直接使用 context 的 filesInfos，避免 useState 只取首帧导致有图时不更新
	const ivs = filesInfos || [];
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
		if (checked) showSuccess('Liked');
	}, [_id, showSuccess, setLike, setLikeNumbers]);

	const handleShare = useCallback((e) => {
		e.stopPropagation();
		const url = `${window.location.origin}/town/moments?mid=${_id}`;
		navigator.clipboard.writeText(url).then(() => showSuccess('Link copied')).catch(() => {});
	}, [_id, showSuccess]);

	const handleDelete = useCallback(async (e) => {
		e.stopPropagation();
		try {
			await deleteMoment(_id, uid);
			onMomentDeleted?.();
		} catch (err) {
			showFailed(err.message || 'Delete failed');
		}
	}, [_id, uid, onMomentDeleted, showFailed]);

	const contentScrollRef = useRef(null);
	useWheelInertia(contentScrollRef);

	return (
		<div ref={contentScrollRef} className={card.entire} onClick={e=>e.stopPropagation()}>
			<div className={card.content}>
				{/* alt=username */}
				{headshotType ? (
					<img src={headshotType} alt="headshot" className={card.headshot} id={uid}/>
				) : (
					<div className={card.avatarInitial} id={uid} style={{backgroundColor: getAvatarColor(uid)}}>
						{username ? username.charAt(0).toUpperCase() : '?'}
					</div>
				)}
				<div className={card.body}>
					<h4>{username}</h4>
					<h2 className={card.title}>{title}</h2>
					{texts}
					<div className={card.live}>
						<IvPreview items={ivs.map(item => [item.url, 'image'])} prefix={`${_id}_iv`}/>
					</div>
				</div>
			</div>
			<div className={card.footer}>
				<Like onChange={onFeedBackChange} checked={like} likes={likeNumbers} _id={_id} disabled={isGuest()}/>
				<div className={card.actions}>
					<button type="button" className={card.actionBtn} onClick={onPrevDetail} disabled={!hasPrevDetail}>{t(locale, 'previousMoment')}</button>
					<button type="button" className={card.actionBtn} onClick={onNextDetail} disabled={!hasNextDetail}>{t(locale, 'nextMoment')}</button>
					{canDelete && (
						<button type="button" className={card.actionBtn} onClick={handleDelete}>{t(locale, 'delete')}</button>
					)}
					<button type="button" className={card.actionBtn} onClick={handleShare}>{t(locale, 'share')}</button>
				</div>
			</div>
		</div>
	);
}
export default Content;


