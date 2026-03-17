import React, {useCallback, useState, useEffect, useRef, useContext} from 'react';
import { createPortal } from 'react-dom';
import preview from './ivPreview.module.less';
import { UiPersistContext } from '../../../pages/displayZone/context/uiPersistContext';
import { t } from '../../../i18n/uiText';


/* 图片预览
* @items: 每项为 [url, type] 或 [url, type, uploaderUsername]
* - url, type 必选；第三项可选，放大时在图片底部显示上传者（如 gallery 从 context 的 iv.username 传入）
* @prefix: 任意不与其他`IvPreview`组件重复的string,用于绑定key
* @showThumbnails: 是否渲染缩略图条（默认 true）；为 false 时仅提供放大层，由外部控制打开（如 article 详情内嵌图）
* @enlargedIndex: 受控模式下当前放大下标，null 为关闭
* @onEnlargedIndexChange: 受控模式下关闭/切换时回调
* @mode: 缩略图模式；'square' 为正方形裁剪（默认），'gallery' 用于 gallery 页随图片比例自适应 */
const IvPreview = ({ items, prefix, showThumbnails = true, enlargedIndex: controlledIndex, onEnlargedIndexChange, mode = 'square' }) => {
	const { locale } = useContext(UiPersistContext);
	const [internalIndex, setInternalIndex] = useState(null);
	const isControlled = controlledIndex !== undefined && onEnlargedIndexChange != null;
	const enlargedIndex = isControlled ? controlledIndex : internalIndex;
	const setEnlargedIndex = useCallback((v) => {
		const next = typeof v === 'function' ? v(enlargedIndex) : v;
		if (isControlled) onEnlargedIndexChange(next);
		else setInternalIndex(next);
	}, [isControlled, onEnlargedIndexChange, enlargedIndex]);
	const total = items.length;
	const thumbStripRef = useRef(null);
	const mediaWrapRef = useRef(null);
	const [imageScale, setImageScale] = useState(1);
	const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
	const [isPanning, setIsPanning] = useState(false);
	const dragRef = useRef({ isDragging: false, startX: 0, startY: 0, startOffsetX: 0, startOffsetY: 0 });
	const pinchRef = useRef({
		pinching: false,
		startDistance: 0,
		startScale: 1,
		startMidX: 0,
		startMidY: 0,
		startOffsetX: 0,
		startOffsetY: 0,
	});

	const viewIv = useCallback((e, index) => {
		e.stopPropagation();
		if (items[index]) setEnlargedIndex(index);
	}, [items, setEnlargedIndex]);

	const closeEnlarged = useCallback((e) => {
		e?.stopPropagation?.();
		setEnlargedIndex(null);
	}, [setEnlargedIndex]);

	const goPrev = useCallback((e) => {
		e?.stopPropagation?.();
		if (total <= 1) return;
		setEnlargedIndex((i) => (i - 1 + total) % total);
	}, [total, setEnlargedIndex]);

	const goNext = useCallback((e) => {
		e?.stopPropagation?.();
		if (total <= 1) return;
		setEnlargedIndex((i) => (i + 1) % total);
	}, [total, setEnlargedIndex]);

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
	const isImage = currentItem != null && currentItem[1] === 'image';

	useEffect(() => {
		if (enlargedIndex != null) {
			setImageScale(1);
			setPanOffset({ x: 0, y: 0 });
		}
	}, [enlargedIndex]);

	const zoomIn = useCallback((e) => {
		e?.stopPropagation?.();
		setImageScale((s) => Math.min(3, s + 0.25));
	}, []);
	const zoomOut = useCallback((e) => {
		e?.stopPropagation?.();
		setImageScale((s) => Math.max(0.5, s - 0.25));
	}, []);

	const getTouchDistance = useCallback((touches) => {
		if (!touches || touches.length < 2) return 0;
		const dx = touches[0].clientX - touches[1].clientX;
		const dy = touches[0].clientY - touches[1].clientY;
		return Math.hypot(dx, dy);
	}, []);

	const getTouchMid = useCallback((touches) => {
		if (!touches || touches.length < 2) return { x: 0, y: 0 };
		return {
			x: (touches[0].clientX + touches[1].clientX) / 2,
			y: (touches[0].clientY + touches[1].clientY) / 2,
		};
	}, []);

	const resetZoomPan = useCallback((e) => {
		e?.stopPropagation?.();
		setImageScale(1);
		setPanOffset({ x: 0, y: 0 });
	}, []);

	// 滚轮在图片上时用于缩放（passive: false 才能 preventDefault 阻止滚动）
	useEffect(() => {
		const wrap = mediaWrapRef.current;
		if (!wrap || !isImage) return;
		const onWheel = (e) => {
			e.preventDefault();
			const delta = e.deltaY > 0 ? -0.25 : 0.25;
			setImageScale((s) => Math.max(0.5, Math.min(3, s + delta)));
		};
		wrap.addEventListener('wheel', onWheel, { passive: false });
		return () => wrap.removeEventListener('wheel', onWheel);
	}, [isImage, enlargedIndex]);

	// 放大后拖拽图片自由平移（translate，图片与展示区域边界可有空隙）
	const onPanStart = useCallback((e) => {
		if (!isImage) return;
		if (e.touches && e.touches.length >= 2) {
			e.preventDefault();
			const distance = getTouchDistance(e.touches);
			const mid = getTouchMid(e.touches);
			dragRef.current.isDragging = false;
			pinchRef.current = {
				pinching: true,
				startDistance: Math.max(1, distance),
				startScale: imageScale,
				startMidX: mid.x,
				startMidY: mid.y,
				startOffsetX: panOffset.x,
				startOffsetY: panOffset.y,
			};
			setIsPanning(true);
			return;
		}
		e.preventDefault();
		setIsPanning(true);
		const clientX = e.touches ? e.touches[0].clientX : e.clientX;
		const clientY = e.touches ? e.touches[0].clientY : e.clientY;
		dragRef.current = {
			isDragging: true,
			startX: clientX,
			startY: clientY,
			startOffsetX: panOffset.x,
			startOffsetY: panOffset.y,
		};
	}, [getTouchDistance, getTouchMid, imageScale, isImage, panOffset.x, panOffset.y]);
	const onPanMove = useCallback((e) => {
		if (e.touches && e.touches.length >= 2) {
			e.preventDefault();
			if (!pinchRef.current.pinching) {
				const distance = getTouchDistance(e.touches);
				const mid = getTouchMid(e.touches);
				pinchRef.current = {
					pinching: true,
					startDistance: Math.max(1, distance),
					startScale: imageScale,
					startMidX: mid.x,
					startMidY: mid.y,
					startOffsetX: panOffset.x,
					startOffsetY: panOffset.y,
				};
			}
			const dist = getTouchDistance(e.touches);
			const mid = getTouchMid(e.touches);
			const ratio = dist / Math.max(1, pinchRef.current.startDistance);
			const nextScale = Math.max(0.5, Math.min(3, pinchRef.current.startScale * ratio));
			setImageScale(nextScale);
			setPanOffset({
				x: pinchRef.current.startOffsetX + (mid.x - pinchRef.current.startMidX),
				y: pinchRef.current.startOffsetY + (mid.y - pinchRef.current.startMidY),
			});
			return;
		}

		if (pinchRef.current.pinching) return;
		if (!dragRef.current.isDragging) return;
		e.preventDefault();
		const clientX = e.touches ? e.touches[0].clientX : e.clientX;
		const clientY = e.touches ? e.touches[0].clientY : e.clientY;
		const dx = clientX - dragRef.current.startX;
		const dy = clientY - dragRef.current.startY;
		setPanOffset({
			x: dragRef.current.startOffsetX + dx,
			y: dragRef.current.startOffsetY + dy,
		});
	}, [getTouchDistance, getTouchMid, imageScale, panOffset.x, panOffset.y]);
	const onPanEnd = useCallback((e) => {
		if (e?.touches && e.touches.length >= 2) return;
		pinchRef.current.pinching = false;
		dragRef.current.isDragging = false;
		setIsPanning(false);
	}, []);
	useEffect(() => {
		if (!isImage || enlargedIndex == null) return;
		const doc = document;
		doc.addEventListener('mousemove', onPanMove);
		doc.addEventListener('mouseup', onPanEnd);
		doc.addEventListener('touchmove', onPanMove, { passive: false });
		doc.addEventListener('touchend', onPanEnd);
		doc.addEventListener('touchcancel', onPanEnd);
		return () => {
			doc.removeEventListener('mousemove', onPanMove);
			doc.removeEventListener('mouseup', onPanEnd);
			doc.removeEventListener('touchmove', onPanMove);
			doc.removeEventListener('touchend', onPanEnd);
			doc.removeEventListener('touchcancel', onPanEnd);
		};
	}, [isImage, enlargedIndex, onPanMove, onPanEnd]);

	return (
		<>
			{showThumbnails && items.map((item, index) =>
				<div
					className={mode === 'gallery' ? preview.ivGallery : preview.iv}
					key={prefix + index}
					onClick={(e) => viewIv(e, index)}
				>
					{
						item[1] === 'image'
							? <img src={item[0]} alt="" id={`${prefix}-${index}`} loading="lazy" />
							: <video src={item[0]} id={`${prefix}-${index}`}/>
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
							<div
								ref={mediaWrapRef}
								className={`${preview.mediaWrap} ${isImage ? preview.mediaWrapZoomable : ''} ${isImage && isPanning ? preview.mediaWrapPanning : ''}`}
								onMouseDown={isImage ? onPanStart : undefined}
								onTouchStart={isImage ? onPanStart : undefined}
								role={isImage ? 'img' : undefined}
								aria-label={isImage ? '可拖拽平移、滚轮与双指缩放' : undefined}
							>
								{currentItem[1] === 'image' ? (
									<div
										className={preview.panLayer}
										style={{ transform: `translate(${panOffset.x}px, ${panOffset.y}px)` }}
									>
										<img
											src={currentItem[0]}
											alt=""
											key={enlargedIndex}
											draggable={false}
											style={{ transform: `scale(${imageScale})`, transformOrigin: 'center center' }}
										/>
									</div>
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
								<span className={preview.uploaderLabel}>{t(locale, 'uploaderBy', currentUploader)}</span>
							</div>
						)}
						{(isImage || hasMultiple) && (
							<div className={preview.bottomBar}>
								{isImage && (
									<div className={preview.zoomBtns}>
										<button type="button" className={preview.zoomBtn} onClick={zoomOut} aria-label="缩小" title="缩小">
											<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
												<circle cx="11" cy="11" r="8" />
												<path d="M21 21l-4.35-4.35" />
												<line x1="8" y1="11" x2="14" y2="11" />
											</svg>
										</button>
										<button type="button" className={preview.zoomBtn} onClick={zoomIn} aria-label="放大" title="放大">
											<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
												<circle cx="11" cy="11" r="8" />
												<path d="M21 21l-4.35-4.35" />
												<line x1="11" y1="8" x2="11" y2="14" />
												<line x1="8" y1="11" x2="14" y2="11" />
											</svg>
										</button>
										<button type="button" className={preview.zoomBtn} onClick={resetZoomPan} aria-label="复位" title="复位">
											<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
												<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
												<path d="M3 3v5h5" />
											</svg>
										</button>
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
													<img src={item[0]} alt="" loading="lazy" />
												) : (
													<video src={item[0]} muted />
												)}
											</button>
										))}
									</div>
								)}
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