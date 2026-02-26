import React, {useCallback, useContext, useEffect, useMemo, useRef, useState} from 'react';
import IvPreview from "../../image_video_preview/ivPreview";
import card from './newMomentPop.module.less';
import CommonBtn from "../../../btn/commonBtn/commonBtn";
import acknowledge from '../../acknowledge.module.less';
import ToDraft from "../littlePop/toDraft/toDraft";
import { SuccessBoardContext } from "../status/successBoardContext";
import { UiPersistContext } from "../../../../pages/displayZone/context/uiPersistContext";
import { t } from "../../../../i18n/uiText";

const uidPrefix = () => localStorage.getItem('uid') || 'nm_iv';

// 选择的图片/视频预览：支持单条移除
const NmIvPreview = React.memo(({ images, videos, onRemoveImage, onRemoveVideo }) => {
	const urlRef = useRef([]);
	const { imageUrls, videoUrls } = useMemo(() => {
		urlRef.current.forEach(u => URL.revokeObjectURL(u));
		urlRef.current = [];
		const imageUrls = [];
		const videoUrls = [];
		images.forEach(file => {
			const url = URL.createObjectURL(file);
			urlRef.current.push(url);
			imageUrls.push(url);
		});
		videos.forEach(file => {
			const url = URL.createObjectURL(file);
			urlRef.current.push(url);
			videoUrls.push(url);
		});
		return { imageUrls, videoUrls };
	}, [images, videos]);
	useEffect(() => () => {
		urlRef.current.forEach(u => URL.revokeObjectURL(u));
		urlRef.current = [];
	}, []);

	const canRemove = Boolean(onRemoveImage || onRemoveVideo);

	if (canRemove) {
		return (
			<>
				{imageUrls.map((url, i) => (
					<div key={`img-${i}`} className={card.nmIvItem}>
						<img src={url} alt="" loading="lazy" />
						<button
							type="button"
							className={card.nmIvRemove}
							onClick={(e) => { e.preventDefault(); e.stopPropagation(); onRemoveImage?.(i); }}
							aria-label="移除图片"
						>
							×
						</button>
					</div>
				))}
				{videoUrls.map((url, j) => (
					<div key={`vid-${j}`} className={card.nmIvItem}>
						<video src={url} muted />
						<button
							type="button"
							className={card.nmIvRemove}
							onClick={(e) => { e.preventDefault(); e.stopPropagation(); onRemoveVideo?.(j); }}
							aria-label="移除视频"
						>
							×
						</button>
					</div>
				))}
			</>
		);
	}

	const items = [...imageUrls.map(u => [u, 'image']), ...videoUrls.map(u => [u, 'video'])];
	return <IvPreview items={items} prefix={uidPrefix()} />;
});


// 编辑界面；若父级通过 registerCloseHandler 注入 ref，则 Pop 的关闭会触发与内部关闭相同的逻辑（含草稿确认）
const NewMoment = ({ onClose, registerCloseHandler }) => {
	const { showSuccess } = useContext(SuccessBoardContext);
	const { locale } = useContext(UiPersistContext);
	const [images, setImages] = useState([]);
	const [videos, setVideos] = useState([]);
	const addFiles = useCallback((fileList) => {
		if (!fileList?.length) return;
		for (const file of fileList) {
			const fileType = file.type?.split('/').at(0);
			if (fileType === 'image') setImages(prev => [...prev, file]);
			else if (fileType === 'video') setVideos(prev => [...prev, file]);
		}
	}, []);

	const addFile = e => {
		const files = e.target.files;
		if (files?.length) addFiles(Array.from(files));
		e.target.value = '';
	};

	const [dragOver, setDragOver] = useState(false);
	const handleDragOver = useCallback((e) => {
		e.preventDefault();
		e.stopPropagation();
		e.dataTransfer.dropEffect = 'copy';
		setDragOver(true);
	}, []);
	const handleDragLeave = useCallback((e) => {
		e.preventDefault();
		e.stopPropagation();
		setDragOver(false);
	}, []);
	const handleDrop = useCallback((e) => {
		e.preventDefault();
		e.stopPropagation();
		setDragOver(false);
		const files = e.dataTransfer?.files;
		if (files?.length) addFiles(Array.from(files));
	}, [addFiles]);

	const removeImageAt = useCallback((index) => {
		setImages(prev => prev.filter((_, i) => i !== index));
	}, []);
	const removeVideoAt = useCallback((index) => {
		setVideos(prev => prev.filter((_, i) => i !== index));
	}, []);

	// 检查是否完成必填项
	const [allCompleted, setAllCompleted] = useState(false);
	const handleCheckRequired = useCallback(() => {
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
	const addApi = useRef(`${process.env.REACT_APP_SERVER_HOST}/api/moments/post`);
	const handleSubmitMoment = async (e) => {
		e.preventDefault();
		const formElements = formRef.current;
		// const files = Array.from(formElements.files.files);

		const fd = new FormData();
		const contentHasValue$ = formElements.content.value.trim().length !== 0; // 检测是否存在有效内容
		fd.append('title', formElements.title.value.trim() || '');
		fd.append('content', contentHasValue$ ? formElements.content.value : '');
		fd.append('published', String(published.current));
		fd.append('acknowledge', String(formElements.acknowledge.checked || false));

		const fileDescriptions = {};
		if (published.current === true) { // 非草稿上传文件
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
		}

		try {
			const resp = await fetch(addApi.current, {
				method: "POST",
				body: fd,
				credentials: "include"
			});

			await resp.json();

			if (resp.ok && published.current) {
				showSuccess(t(locale, 'publish'));
			}
			if (!resp.ok) {
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

	// 编辑界面点击关闭（Pop 的 X/遮罩或内部关闭）：有内容则弹草稿确认，否则调用 proceed 让 Pop 执行关闭动画（父组件在动画结束后 setEditing(false)）
	const formRef = useRef();
	const handleCloseEdit = useCallback((proceed) => {
		if (!formRef.current) {
			proceed?.();
			return;
		}
		const fd = new FormData(formRef.current);
		const fv = Object.fromEntries(fd.entries());
		const formHasText = Object.entries(fv).filter(item => typeof item[1] === 'string').some(item => item[1].trim().length !== 0);
		const haveValue = formHasText || images.length > 0 || videos.length > 0;
		if (haveValue) setViewPop(true);
		else proceed?.();
	}, [images.length, videos.length]);

	useEffect(() => {
		if (registerCloseHandler) registerCloseHandler.current = handleCloseEdit;
		return () => { if (registerCloseHandler) registerCloseHandler.current = null; };
	}, [handleCloseEdit, registerCloseHandler]);

	// 文字输入
	const [title, setTitle] = useState('');
	const [content, setContent] = useState('');
	// 原始草稿数据
	const [previousDraft, setPreviousDraft] = useState({});
	// 恢复草稿弹窗
	const [viewRestore, setViewRestore] = useState(false);
	// 获取草稿
	const draftApi = useRef(`${process.env.REACT_APP_SERVER_HOST}/api/moments/get?isEditing=true`);
	useEffect(() => {
		// 获取草稿内容
		async function f() {
			const resp = await fetch(draftApi.current, {
				method: 'GET'
			});
			const data = await resp.json();
			if(data.data !== null){
				const {title, content} = data.data;
				setViewRestore(true);
				setPreviousDraft({title, content});
			}
		}

		f();
	}, []);

	return (
		<>
			<form action="" className={card.entire} onChange={handleCheckRequired} onSubmit={handleSubmitMoment}
						ref={formRef}>
				<>
					{/* 草稿保存弹窗：点击遮罩/关闭未选择时收起弹窗，回到表单，可再次点大弹窗 X 重选 */}
					{viewPop && <ToDraft
						title={t(locale, 'saveDraftTitle')}
						message={t(locale, 'saveDraftMessage')}
						onDeny={onClose}
						onDismiss={() => setViewPop(false)}
						onConfirm={() => {
						published.current = false;
						// 即使存在空required字段也强制提交
						formRef.current.noValidate = true;
						formRef.current.requestSubmit();
					}}/>}
					{/* 草稿恢复弹窗	*/}
					{viewRestore && <ToDraft
						onDeny={() => setViewRestore(false)}
						onDismiss={() => setViewRestore(false)}
						onConfirm={()=>{
							setTitle(previousDraft.title);
							setContent(previousDraft.content);
							setViewRestore(false);
						}}
						message={t(locale, 'restoreDraftMessage')}
					/>}
				</>
				<section>
					<label htmlFor='newTitle'>{t(locale, 'formTitle')}</label>
					<input type="text" required={true} name={'title'} id={'newTitle'} value={title}
								 onChange={e => setTitle(e.target.value)}/>
				</section>

				<section>
					<label htmlFor="newContent">{t(locale, 'formContent')}</label>
					<textarea required={true} placeholder={t(locale, 'formContentPlaceholder')} name={'content'} id={'newContent'} value={content}
										onChange={e => setContent(e.target.value)}/>
				</section>

				<section
					id={'iv'}
					className={dragOver ? card.dropZoneActive : ''}
					onDragOver={handleDragOver}
					onDragLeave={handleDragLeave}
					onDrop={handleDrop}
				>
					{(images.length !== 0 || videos.length !== 0) && (
						<NmIvPreview
							images={images}
							videos={videos}
							onRemoveImage={removeImageAt}
							onRemoveVideo={removeVideoAt}
						/>
					)}
					<label htmlFor={'files'}></label>
					<input type='file' name={'files'} id={'files'} multiple={true} accept={'image/*, video/*'}
								 onChange={addFile}/>
				</section>

				<section className={acknowledge.acknowledge}>
					<input type="checkbox" id='acknowledge' name='acknowledge'/>
					<label htmlFor="acknowledge">{t(locale, 'commitToGallery')}</label>
				</section>

				<CommonBtn type={"submit"} text={t(locale, 'publish')} disabled={!allCompleted} onClick={() => published.current = true}/>
			</form>
		</>
	);
};

export default NewMoment;