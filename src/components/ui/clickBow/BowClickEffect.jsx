import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import styles from './BowClickEffect.module.css';

const BASE_COLOR = '#e7efea';
const STROKE_COLOR = '#9aaba2';
const DIRECTIONS = [
	[1, 0],
	[-1, 0],
	[0, 1],
	[0, -1],
];

const randomInRange = (min, max) => Math.random() * (max - min) + min;
const toKey = (r, c) => `${r}:${c}`;
const fromKey = (key) => key.split(':').map(Number);
const inBounds = (r, c, rows, cols) => r >= 0 && c >= 0 && r < rows && c < cols;

const readGridSize = () => {
	const raw = getComputedStyle(document.documentElement).getPropertyValue('--page-grid-size').trim();
	const parsed = Number.parseFloat(raw);
	if (Number.isFinite(parsed) && parsed > 10) return parsed;
	return 34;
};

const buildGridMetrics = () => {
	const cell = readGridSize();
	const viewportWidth = Math.max(0, Math.floor(window.visualViewport?.width || window.innerWidth));
	const viewportHeight = Math.max(0, Math.floor(window.visualViewport?.height || window.innerHeight));
	const cols = Math.max(8, Math.floor(viewportWidth / cell));
	const rows = Math.max(8, Math.floor(viewportHeight / cell));
	return { cell, cols, rows };
};

const applySurroundedFlip = (board, rows, cols) => {
	const updates = {};
	const keys = Object.keys(board);
	for (let i = 0; i < keys.length; i += 1) {
		const key = keys[i];
		const [r, c] = fromKey(key);
		const color = board[key];
		const rival = color === 'black' ? 'white' : 'black';
		let surrounded = true;
		for (let d = 0; d < DIRECTIONS.length; d += 1) {
			const [dr, dc] = DIRECTIONS[d];
			const nr = r + dr;
			const nc = c + dc;
			if (!inBounds(nr, nc, rows, cols) || board[toKey(nr, nc)] !== rival) {
				surrounded = false;
				break;
			}
		}
		if (surrounded) updates[key] = rival;
	}
	if (Object.keys(updates).length === 0) return board;
	return { ...board, ...updates };
};

const countQualifiedRegions = (board, rows, cols, targetColor) => {
	const visited = new Set();
	const keys = Object.keys(board);
	let count = 0;
	for (let i = 0; i < keys.length; i += 1) {
		const seed = keys[i];
		if (visited.has(seed) || board[seed] !== targetColor) continue;
		let minR = Infinity;
		let maxR = -Infinity;
		let minC = Infinity;
		let maxC = -Infinity;
		const queue = [seed];
		visited.add(seed);
		for (let q = 0; q < queue.length; q += 1) {
			const [r, c] = fromKey(queue[q]);
			if (r < minR) minR = r;
			if (r > maxR) maxR = r;
			if (c < minC) minC = c;
			if (c > maxC) maxC = c;
			for (let d = 0; d < DIRECTIONS.length; d += 1) {
				const [dr, dc] = DIRECTIONS[d];
				const nr = r + dr;
				const nc = c + dc;
				if (!inBounds(nr, nc, rows, cols)) continue;
				const nk = toKey(nr, nc);
				if (visited.has(nk) || board[nk] !== targetColor) continue;
				visited.add(nk);
				queue.push(nk);
			}
		}
		const diameter = Math.max(maxR - minR + 1, maxC - minC + 1);
		if (diameter >= 4) count += 1;
	}
	return count;
};

const BowSvg = () => (
	<svg viewBox="0 0 128 96" aria-hidden="true" focusable="false">
		<path
			d="M61 40C43 45 18 39 12 24C8 15 11 8 18 6C27 4 40 8 48 18L61 40Z"
			fill={BASE_COLOR}
			stroke={STROKE_COLOR}
			strokeWidth="2.6"
			strokeLinejoin="round"
		/>
		<path
			d="M67 40C85 45 110 39 116 24C120 15 117 8 110 6C101 4 88 8 80 18L67 40Z"
			fill={BASE_COLOR}
			stroke={STROKE_COLOR}
			strokeWidth="2.6"
			strokeLinejoin="round"
		/>
		<path
			d="M61 40L33 74C29 78 23 75 24 69L28 46"
			fill={BASE_COLOR}
			stroke={STROKE_COLOR}
			strokeWidth="2.6"
			strokeLinejoin="round"
		/>
		<path
			d="M67 40L95 74C99 78 105 75 104 69L100 46"
			fill={BASE_COLOR}
			stroke={STROKE_COLOR}
			strokeWidth="2.6"
			strokeLinejoin="round"
		/>
		<rect x="56" y="32" width="16" height="16" rx="5" fill="#dde8e1" stroke={STROKE_COLOR} strokeWidth="2.4" />
	</svg>
);

const BowClickEffect = () => {
	const [bows, setBows] = useState([]);
	const [stones, setStones] = useState({});
	const [grid, setGrid] = useState(() => buildGridMetrics());
	const idRef = useRef(0);
	const clickRef = useRef(0);

	const addBow = useCallback((x, y) => {
		const id = idRef.current += 1;
		const duration = randomInRange(980, 1450);
		const size = randomInRange(44, 68);
		const driftX = randomInRange(-34, 34);
		const driftY = randomInRange(-108, -72);
		const rotate = randomInRange(-20, 20);
		const hue = randomInRange(-14, 12);
		const rotateStart = rotate * 0.42;

		setBows((prev) => ([
			...prev,
			{ id, x, y, size, duration, driftX, driftY, rotate, rotateStart, hue },
		]));

		window.setTimeout(() => {
			setBows((prev) => prev.filter((item) => item.id !== id));
		}, duration + 120);
	}, []);

	const rebuildGrid = useCallback(() => {
		setGrid(buildGridMetrics());
	}, []);

	useEffect(() => {
		window.addEventListener('resize', rebuildGrid);
		window.addEventListener('theme-mode-change', rebuildGrid);
		return () => {
			window.removeEventListener('resize', rebuildGrid);
			window.removeEventListener('theme-mode-change', rebuildGrid);
		};
	}, [rebuildGrid]);

	useEffect(() => {
		setStones((prev) => {
			const next = {};
			const keys = Object.keys(prev);
			for (let i = 0; i < keys.length; i += 1) {
				const key = keys[i];
				const [r, c] = fromKey(key);
				if (inBounds(r, c, grid.rows, grid.cols)) next[key] = prev[key];
			}
			return next;
		});
	}, [grid.rows, grid.cols]);

	useEffect(() => {
		const onPointerDown = (e) => {
			if (typeof e.clientX !== 'number' || typeof e.clientY !== 'number') return;
			if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
				addBow(e.clientX, e.clientY);
				if (Math.random() > 0.55) addBow(e.clientX + randomInRange(-10, 10), e.clientY + randomInRange(-6, 8));
			}
		};

		const onClick = (e) => {
			if (typeof e.clientX !== 'number' || typeof e.clientY !== 'number') return;

			setStones((prev) => {
				const totalCells = grid.rows * grid.cols;
				const occupied = Object.keys(prev).length;
				if (occupied >= totalCells) {
					clickRef.current = 0;
					return {};
				}

				let row = -1;
				let col = -1;
				for (let attempt = 0; attempt < 36; attempt += 1) {
					const rr = Math.floor(Math.random() * grid.rows);
					const cc = Math.floor(Math.random() * grid.cols);
					if (!prev[toKey(rr, cc)]) {
						row = rr;
						col = cc;
						break;
					}
				}
				if (row < 0) {
					for (let r = 0; r < grid.rows && row < 0; r += 1) {
						for (let c = 0; c < grid.cols; c += 1) {
							if (!prev[toKey(r, c)]) {
								row = r;
								col = c;
								break;
							}
						}
					}
				}
				if (row < 0) return prev;

				clickRef.current += 1;
				const placingColor = clickRef.current % 2 === 1 ? 'black' : 'white';
				let next = { ...prev, [toKey(row, col)]: placingColor };
				next = applySurroundedFlip(next, grid.rows, grid.cols);

				const blackRegions = countQualifiedRegions(next, grid.rows, grid.cols, 'black');
				const whiteRegions = countQualifiedRegions(next, grid.rows, grid.cols, 'white');
				if (blackRegions >= 3 || whiteRegions >= 3) {
					clickRef.current = 0;
					return {};
				}

				return next;
			});
		};

		window.addEventListener('pointerdown', onPointerDown, true);
		window.addEventListener('click', onClick, true);
		return () => {
			window.removeEventListener('pointerdown', onPointerDown, true);
			window.removeEventListener('click', onClick, true);
		};
	}, [addBow, grid.cols, grid.rows]);

	const stoneEntries = useMemo(() => Object.entries(stones).map(([key, color]) => {
		const [r, c] = fromKey(key);
		return { key, r, c, color };
	}), [stones]);
	const stoneSize = Math.max(12, Math.min(24, grid.cell * 0.62));

	return createPortal(
		<>
			<div className={styles.gridLayer} aria-hidden>
				{stoneEntries.map((stone) => (
					<span
						key={stone.key}
						className={`${styles.stone} ${stone.color === 'black' ? styles.stoneBlack : styles.stoneWhite}`}
						style={{
							left: `${(stone.c + 0.5) * grid.cell}px`,
							top: `${(stone.r + 0.5) * grid.cell}px`,
							width: `${stoneSize}px`,
							height: `${stoneSize}px`,
						}}
					>
						<span className={styles.stoneRipple} />
					</span>
				))}
			</div>
			<div className={styles.bowLayer} aria-hidden>
				{bows.map((item) => (
					<span
						key={item.id}
						className={styles.bow}
						style={{
							left: `${item.x}px`,
							top: `${item.y}px`,
							width: `${item.size}px`,
							height: `${item.size * 0.75}px`,
							'--bow-duration': `${item.duration}ms`,
							'--bow-drift-x': `${item.driftX}px`,
							'--bow-drift-y': `${item.driftY}px`,
							'--bow-rotate': `${item.rotate}deg`,
							'--bow-rotate-start': `${item.rotateStart}deg`,
							'--bow-hue': `${item.hue}deg`,
						}}
					>
						<BowSvg />
					</span>
				))}
			</div>
		</>,
		document.body,
	);
};

export default BowClickEffect;
