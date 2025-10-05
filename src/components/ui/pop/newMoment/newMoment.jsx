import React, {useCallback, useRef, useState} from 'react';
import IvPreview from "../../image_video_preview/ivPreview";
import card from './newMomentPop.module.less';
import CommonBtn from "../../../btn/commonBtn/commonBtn";
import CloseButton from "../../../ui/close/CloseButton";
import acknowledge from '../../acknowledge.module.less';
import ToDraft from "../littlePop/toDraft/toDraft";


// 选择的图片/视频预览图
const NmIvPreview = ({images, videos}) => {
	const items = [];
	images.forEach(item => {
		const url = URL.createObjectURL(item);
		items.push([url, 'image']);
	});
	videos.forEach(item => {
		const url = URL.createObjectURL(item);
		items.push([url, 'video']);
	});
	return <IvPreview items={items} prefix={localStorage.getItem('uid')}/>;
};


// 编辑界面
const NewMoment = ({onClose}) => {
	const [images, setImages] = useState([]);
	const [videos, setVideos] = useState([]);
	const addFile = e => {
		const files = e.target.files;
		for (const file of files) {
			const fileType = file.type.split('/').at(0);
			if (fileType === 'image') setImages(prevState => [...prevState, file]);
			else if (fileType === 'video') setVideos(prevState => [...prevState, file]);
		}
	}

	// 检查是否完成必填项
	const [allCompleted, setAllCompleted] = useState(false);
	const handleCheckRequired = useCallback(e => {
		const fd = new FormData(formRef.current);
		const fv = Object.fromEntries(fd.entries());
		// 需要有非空格的有效值输入才能通过检测
		const allComped$ = Object.entries(fv).filter(item => typeof item[1] === 'string').every(item => item[1].trim().length !== 0);
		setAllCompleted(allComped$);
	}, []);

	// 关闭弹窗
	const [viewPop, setViewPop] = useState(false);

	// 草稿/发布post
	const published = useRef(false);
	const addApi = useRef(`${process.env.REACT_APP_SERVER_HOST}:9999/api/moments/post`);
	const handleSubmitMoment = async (e) => {
		e.preventDefault();
		const formElements = e.currentTarget;
		// const files = Array.from(formElements.files.files);

		const fd = new FormData();
		const contentHasValue$ = formElements.content.value.trim().length !== 0; // 检测是否存在有效内容
		fd.append('title', formElements.title.value.trim() || '');
		fd.append('content', contentHasValue$ ? formElements.content.value : '');
		fd.append('published', String(published.current));
		fd.append('acknowledge', String(formElements.acknowledge.checked || false));

		const fileDescriptions = {};
		if (images.length !== 0) {
			images.forEach((file, index) => {
				fileDescriptions[file.name] = index;
			});
			fd.append('descriptions', JSON.stringify(fileDescriptions));

			for (const file of images) {
				fd.append('files', file, file.name);
			}
		}
		if (videos.length !== 0) {
			videos.forEach((file, index) => {
				fileDescriptions[file.name] = index;
			});
			fd.append('descriptions', JSON.stringify(fileDescriptions));

			for (const file of videos) {
				fd.append('files', file, file.name);
			}
		}

		try {
			const resp = await fetch(addApi.current, {
				method: "POST",
				body: fd,
				credentials: "include"
			});

			const data = await resp.json();

			if (!resp.ok) {
				console.log('upload failed\n', data);
			}
		} catch (err) {
			console.error(err);
		} finally {
			// 重置发布状态，避免下一次提交被误判
			published.current = false;
			// 关闭编辑界面
			onClose();
		}
	}

	// 编辑界面点击关闭按钮是否触发toDraft弹窗逻辑
	const formRef = useRef();
	const handleCloseEdit = useCallback(() => {
		// 检查是否有已填写项
		const fd = new FormData(formRef.current);
		const fv = Object.fromEntries(fd.entries());
		// 需要有非空格的有效值输入才能通过检测
		const haveValue = Object.entries(fv).filter(item => typeof item[1] === 'string').some(item => item[1].trim().length !== 0);
		if (haveValue) setViewPop(true);
		else onClose();
	}, [onClose]);

	return (
		<>
			<form action="" className={card.entire} onChange={handleCheckRequired} onSubmit={handleSubmitMoment}
						ref={formRef}>
				<>
					<CloseButton onClick={handleCloseEdit}/>
					{viewPop && <ToDraft onDeny={onClose} onConfirm={() => published.current = false}/>}
				</>
				<section>
					<label htmlFor='newTitle'>{'title'}</label>
					<input type="text" required={true} name={'title'} id={'newTitle'}/>
				</section>

				<section>
					<label htmlFor="newContent">{'content'}</label>
					<textarea required={true} placeholder={'文本内容'} name={'content'} id={'newContent'}/>
				</section>

				<section id={'iv'}>
					{(images.length !== 0 || videos.length !== 0) && <NmIvPreview images={images} videos={videos}/>}
					<label htmlFor={'files'}></label>
					<input type='file' name={'files'} id={'files'} multiple={true} accept={'image/*, video/*'}
								 onChange={addFile}/>
				</section>

				<section className={acknowledge.acknowledge}>
					<input type="checkbox" id='acknowledge' name='acknowledge'/>
					<label htmlFor="acknowledge">{'commit to gallery at the same time'}</label>
				</section>

				<CommonBtn type={"submit"} text={'Publish'} disabled={!allCompleted} onClick={() => published.current = true}/>
			</form>
		</>
	);
};

export default NewMoment;