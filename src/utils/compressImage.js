const DEFAULTS = {
	maxWidthOrHeight: 1920,
	maxSizeMB: 1.5,
	quality: 0.82,
	minQuality: 0.55,
	qualityStep: 0.08,
};

const SKIP_TYPES = new Set(['image/gif', 'image/svg+xml']);

const isBrowserFile = (v) => typeof File !== 'undefined' && v instanceof File;

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const loadImageElement = (file) => new Promise((resolve, reject) => {
	const objectUrl = URL.createObjectURL(file);
	const img = new Image();
	img.onload = () => {
		URL.revokeObjectURL(objectUrl);
		resolve(img);
	};
	img.onerror = (e) => {
		URL.revokeObjectURL(objectUrl);
		reject(e);
	};
	img.src = objectUrl;
});

const drawToCanvas = async (file, width, height) => {
	const canvas = document.createElement('canvas');
	canvas.width = Math.max(1, Math.round(width));
	canvas.height = Math.max(1, Math.round(height));
	const ctx = canvas.getContext('2d', { alpha: true });
	if (!ctx) throw new Error('无法创建 canvas 上下文');

	if (typeof createImageBitmap === 'function') {
		const bitmap = await createImageBitmap(file);
		ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
		bitmap.close();
		return canvas;
	}

	const img = await loadImageElement(file);
	ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
	return canvas;
};

const getImageSize = async (file) => {
	if (typeof createImageBitmap === 'function') {
		const bitmap = await createImageBitmap(file);
		const size = { width: bitmap.width, height: bitmap.height };
		bitmap.close();
		return size;
	}
	const img = await loadImageElement(file);
	return { width: img.naturalWidth, height: img.naturalHeight };
};

const canvasToBlob = (canvas, type, quality) =>
	new Promise((resolve, reject) => {
		canvas.toBlob((blob) => {
			if (blob) resolve(blob);
			else reject(new Error('图片压缩失败：toBlob 返回空值'));
		}, type, quality);
	});

export async function compressImageFile(file, options = {}) {
	if (!isBrowserFile(file)) return file;
	if (!file.type?.startsWith('image/')) return file;
	if (SKIP_TYPES.has(file.type)) return file;
	try {

		const {
			maxWidthOrHeight,
			maxSizeMB,
			quality,
			minQuality,
			qualityStep,
		} = { ...DEFAULTS, ...options };

		const maxBytes = Math.max(0.1, Number(maxSizeMB)) * 1024 * 1024;
		const startQuality = clamp(Number(quality), 0.1, 0.98);
		const floorQuality = clamp(Number(minQuality), 0.1, startQuality);
		const step = clamp(Number(qualityStep), 0.01, 0.3);

		const sideLimit = Math.max(64, Number(maxWidthOrHeight) || DEFAULTS.maxWidthOrHeight);
		const { width, height } = await getImageSize(file);
		const ratio = Math.min(1, sideLimit / Math.max(width, height));
		const targetWidth = Math.round(width * ratio);
		const targetHeight = Math.round(height * ratio);

		if (!targetWidth || !targetHeight) return file;

		const canvas = await drawToCanvas(file, targetWidth, targetHeight);
		let currentQuality = startQuality;
		let bestBlob = await canvasToBlob(canvas, file.type, currentQuality);

		while (
			bestBlob.size > maxBytes &&
			currentQuality - step >= floorQuality &&
			(file.type === 'image/jpeg' || file.type === 'image/webp')
		) {
			currentQuality = clamp(currentQuality - step, floorQuality, startQuality);
			bestBlob = await canvasToBlob(canvas, file.type, currentQuality);
		}

		if (bestBlob.size >= file.size) return file;

		return new File([bestBlob], file.name, {
			type: bestBlob.type || file.type,
			lastModified: file.lastModified,
		});
	} catch (_) {
		return file;
	}
}

export async function compressImageFiles(files, options = {}) {
	if (!files || files.length === 0) return [];
	const list = Array.from(files);
	return Promise.all(list.map((f) => compressImageFile(f, options)));
}
