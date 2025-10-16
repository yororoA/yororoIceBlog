import React, {useEffect, useState} from 'react';
import MomentsCard from "../../../components/pagesCard/moments/content/momentsCard";
import moments from './moments.module.less';
import MomentIdContext from "./momentIdContext";
import CommonBtn from "../../../components/btn/commonBtn/commonBtn";
import addContent from "../../../components/btn/addContent.module.less";
import Pop from "../../../components/ui/pop/pop";
import NewMoment from "../../../components/ui/pop/newMoment/newMoment";
import {getMoments} from "../../../utils/getMoments";
import {getLikesList} from "../../../utils/getLikesList";


const MomentItem = ({data, liked}) => {


	return (
		<MomentIdContext value={data}>
			<div className={moments.item}>
				<MomentsCard liked={liked} preview={true}/>
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
				<MomentItem data={item} liked={liked.includes(item._id)} key={item._id}/>
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
			<div className={moments.entire}>
				{elements}
			</div>
		</>
	);
};

export default Moments;