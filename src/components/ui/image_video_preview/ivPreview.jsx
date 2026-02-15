import React, {useCallback, useState, useEffect, useRef} from 'react';
import { createPortal } from 'react-dom';
import preview from './ivPreview.module.less';


/* 图片预览
* @items: 每项为 [url, type] 或 [url, type, uploaderUsername]
* - url, type 必选；第三项可选，放大时在图片底部显示上传者（如 gallery 从 context 的 iv.username 传入）
* @prefix: 任意不与其他`IvPreview`组件重复的string,用于绑定key */
const IvPreview = ({items, prefix}) => {
	// 当前放大预览的下标: null 表示未打开
	const [enlargedIndex, setEnlargedIndex] = useState(null);
	const total = items.length;
	const thumbStripRef = useRef(null);

	const viewIv = useCallback((e, index) => {
		e.stopPropagation();
		if (items[index]) setEnlargedIndex(index);
	}, [items]);

	const closeEnlarged = useCallback((e) => {
		e?.stopPropagation?.();
		setEnlargedIndex(null);
	}, []);

	const goPrev = useCallback((e) => {
		e?.stopPropagation?.();
		if (total <= 1) return;
		setEnlargedIndex((i) => (i - 1 + total) % total);
	}, [total]);

	const goNext = useCallback((e) => {
		e?.stopPropagation?.();
		if (total <= 1) return;
		setEnlargedIndex((i) => (i + 1) % total);
	}, [total]);

	// 键盘：左右切换、Esc 关闭
	useEffect(() => {
		if (enlargedIndex == null) return;
		const onKey = (e) => {
			if (e.key === 'Escape') closeEnlarged();
			else if (e.key === 'ArrowLeft') goPrev(e);
			else if (e.key === 'ArrowRight') goNext(e);
		};
		window.addEventListener('keydown', onKey);
		return () => window.removeEventListener('keydown', onKey);
	}, [enlargedIndex, closeEnlarged, goPrev, goNext]);

	// 小图条滚动：当前选中小图在可视区域内居中，用自定义动画控制速度
	const THUMB_SCROLL_DURATION = 380;
	useEffect(() => {
		if (enlargedIndex == null || total <= 1 || !thumbStripRef.current) return;
		const strip = thumbStripRef.current;
		const activeThumb = strip.children[enlargedIndex];
		if (!activeThumb) return;
		const stripWidth = strip.clientWidth;
		const thumbWidth = activeThumb.offsetWidth;
		const targetLeft = Math.max(0, Math.min(
			activeThumb.offsetLeft - stripWidth / 2 + thumbWidth / 2,
			Math.max(0, strip.scrollWidth - stripWidth)
		));
		const startLeft = strip.scrollLeft;
		if (Math.abs(targetLeft - startLeft) < 2) return;
		const start = performance.now();
		const easeOut = (t) => 1 - (1 - t) ** 2;
		const tick = (now) => {
			const elapsed = now - start;
			const t = Math.min(1, elapsed / THUMB_SCROLL_DURATION);
			strip.scrollLeft = startLeft + (targetLeft - startLeft) * easeOut(t);
			if (t < 1) requestAnimationFrame(tick);
		};
		const id = requestAnimationFrame(tick);
		return () => cancelAnimationFrame(id);
	}, [enlargedIndex, total]);

	// 阻止点击内容区域关闭，只允许点击遮罩关闭
	const onContentClick = useCallback((e) => e.stopPropagation(), []);

	const currentItem = enlargedIndex != null ? items[enlargedIndex] : null;
	const hasMultiple = total > 1;
	const rawUploader = currentItem != null ? currentItem[2] : null;
	const currentUploader = rawUploader != null && rawUploader !== '' && String(rawUploader).trim() !== '' ? String(rawUploader).trim() : null;

	return (
		<>
			{items.map((item, index) =>
				<div className={preview.iv} key={prefix + index} onClick={(e) => viewIv(e, index)}>
					{
						item[1] === 'image' ? <img src={item[0]} alt="" id={`${prefix}-${index}`}/> :
							<video src={item[0]} id={`${prefix}-${index}`}/>
					}
					<label htmlFor={`${prefix}-${index}`}>
						<svg viewBox="0 0 1024 1024" version="1.1"
								 xmlns="http://www.w3.org/2000/svg">
							<path
								d="M977.216 909.056l-166.4-166.464a435.072 435.072 0 0 0 95.872-272.896 437.376 437.376 0 1 0-437.312 437.312 434.752 434.752 0 0 0 273.664-96.512l166.336 166.336a48.512 48.512 0 0 0 68.8 0.896 48.64 48.64 0 0 0-0.96-68.672zM128.064 469.76a341.312 341.312 0 1 1 682.624 0A341.312 341.312 0 0 1 128 469.76z"
								fill="#ffffff"></path>
							<path
								d="M627.52 427.648H511.488V311.744c0-23.872-18.88-43.328-42.112-43.328s-42.112 19.456-42.112 43.328v115.968H311.296a42.816 42.816 0 0 0-43.328 42.176c0 23.296 19.456 42.048 43.328 42.048h115.968v115.968c0 23.872 18.88 43.392 42.112 43.392s42.112-19.52 42.112-43.392V511.936h115.968a42.816 42.816 0 0 0 43.328-42.112 42.752 42.752 0 0 0-43.264-42.176z"
								fill="#ffffff"></path>
						</svg>
					</label>
				</div>)}

			{currentItem && createPortal(
				<div className={preview.enlargedWrap} onClick={closeEnlarged} role="dialog" aria-modal="true">
					<div className={preview.enlargedContent} onClick={onContentClick}>
						<div className={preview.mediaRow}>
							{hasMultiple && (
								<button type="button" className={`${preview.navBtn} ${preview.navPrev}`} onClick={goPrev} aria-label="上一张" />
							)}
							<div className={preview.mediaWrap}>
								{currentItem[1] === 'image' ? (
									<img src={currentItem[0]} alt="" key={enlargedIndex} />
								) : (
									<video src={currentItem[0]} controls autoPlay key={enlargedIndex} />
								)}
							</div>
							{hasMultiple && (
								<button type="button" className={`${preview.navBtn} ${preview.navNext}`} onClick={goNext} aria-label="下一张" />
							)}
						</div>
						{currentUploader && (
							<div className={preview.uploaderBar}>
								<span className={preview.uploaderLabel}>上传者：{currentUploader}</span>
							</div>
						)}
						{hasMultiple && (
							<div className={preview.thumbStrip} ref={thumbStripRef}>
								{items.map((item, i) => (
									<button
										type="button"
										key={i}
										className={i === enlargedIndex ? preview.thumbActive : preview.thumb}
										onClick={(e) => { e.stopPropagation(); setEnlargedIndex(i); }}
										aria-label={`第 ${i + 1} 张`}
									>
										{item[1] === 'image' ? (
											<img src={item[0]} alt="" />
										) : (
											<video src={item[0]} muted />
										)}
									</button>
								))}
							</div>
						)}
						<button type="button" className={preview.closeBtn} onClick={closeEnlarged} aria-label="关闭" />
					</div>
				</div>,
				document.body
			)}
		</>
	);
};

export default IvPreview;