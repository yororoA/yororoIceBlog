import { useEffect, useRef, useState } from 'react';
import styles from './BowClickEffect.module.css';

const BASE_COLOR = '#e7efea';
const STROKE_COLOR = '#9aaba2';

const randomInRange = (min, max) => Math.random() * (max - min) + min;

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
	const [items, setItems] = useState([]);
	const idRef = useRef(0);

	useEffect(() => {
		const addBow = (x, y) => {
			const id = idRef.current += 1;
			const duration = randomInRange(980, 1450);
			const size = randomInRange(42, 66);
			const driftX = randomInRange(-34, 34);
			const driftY = randomInRange(-104, -72);
			const rotate = randomInRange(-20, 20);
			const hue = randomInRange(-14, 12);

			setItems((prev) => ([
				...prev,
				{ id, x, y, size, duration, driftX, driftY, rotate, hue },
			]));

			window.setTimeout(() => {
				setItems((prev) => prev.filter((item) => item.id !== id));
			}, duration + 120);
		};

		const onPointerDown = (e) => {
			if (e.button !== 0) return;
			if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
			const x = e.clientX;
			const y = e.clientY;
			addBow(x, y);
			if (Math.random() > 0.55) {
				addBow(x + randomInRange(-10, 10), y + randomInRange(-6, 8));
			}
		};

		window.addEventListener('pointerdown', onPointerDown, { passive: true });
		return () => window.removeEventListener('pointerdown', onPointerDown);
	}, []);

	return (
		<div className={styles.layer} aria-hidden>
			{items.map((item) => (
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
						'--bow-hue': `${item.hue}deg`,
					}}
				>
					<BowSvg />
				</span>
			))}
		</div>
	);
};

export default BowClickEffect;
