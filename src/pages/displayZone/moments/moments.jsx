import React, {useEffect, useRef, useState} from 'react';
import MomentsCard from "../../../components/pagesCard/moments/content/momentsCard";
import MomentsComments from "../../../components/pagesCard/moments/comment/momentsComments";
import moments from './moments.module.less';
import MomentIdContext from "./momentIdContext";
import CommonBtn from "../../../components/btn/commonBtn/commonBtn";
import addContent from "../../../components/btn/addContent.module.less";
import Pop from "../../../components/ui/pop/pop";
import NewMoment from "../../../components/ui/pop/newMoment/newMoment";
import {getMoments} from "../../../utils/getMoments";
import {getLikesList} from "../../../utils/getLikesList";


const MomentItem = ({data, liked}) => {
	// 将moment卡片高度设定为内容展示区高度(有评论区高度限制
	const heightRef = useRef();
	const [contentHeight, setContentHeight] = useState(0);
	const [commentHeight, setCommentHeight] = useState(0);
	useEffect(() => {
		// console.log(contentHeight, commentHeight);
		heightRef.current.style.height = `${Math.max(contentHeight, commentHeight)}px`;
	}, [contentHeight, commentHeight]);


	return (
		<MomentIdContext value={data}>
			<div className={moments.item} ref={heightRef}>
				<MomentsCard sCTH={setContentHeight} liked={liked}/>
				<MomentsComments sCMH={setCommentHeight}/>
			</div>
		</MomentIdContext>
	)
}


const Moments = () => {
	// 根据是否在编辑新moment控制moments获取以及编辑区域显示
	const [editing, setEditing] = useState(false);


	useEffect(() => {
		async function f() {
			const data = await getMoments();
			const liked = await getLikesList(); // 已点赞列表
			setElements(data.map(item => (
				<div className={moments.entire} key={item._id}>
					<MomentItem data={item} liked={liked.includes(item._id)}/>
				</div>
			)));
		}

		// 未处在编辑状态时获取moments列表
		if (!editing) f();
	}, [editing]);

	const [elements, setElements] = useState('no moments yet' || []);


	return (
		<>
			<section id={'header'}>
				<span>{'Moments'}</span>
				<CommonBtn className={addContent.new} text={'New Moment'} onClick={() => setEditing(true)}/>
			</section>
			{editing &&
				<Pop isLittle={false}>
					<NewMoment onClose={() => setEditing(false)}/>
				</Pop>}
			{elements}
		</>
	);
};

export default Moments;