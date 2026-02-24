import React, { useCallback, useContext, useEffect, useRef, useState } from 'react';
import Content from './content/content';
import MomentsComments from './comment/momentsComments';
import { UiPersistContext } from '../../context/uiPersistContext';
import { t } from '../../../../i18n/uiText';
import { useWheelInertia } from '../../../../hooks/useWheelInertia';
import mdc from './md.module.less';

const LAYOUT_KEY = 'momentDetailLayout';
const LAYOUT_TWO = 'twoCol';
const LAYOUT_ONE = 'singleCol';

const IconTwoCol = () => (
	<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
		<rect x="3" y="4" width="8" height="16" rx="1" />
		<rect x="13" y="4" width="8" height="16" rx="1" />
	</svg>
);

const IconSingleCol = () => (
	<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
		<rect x="6" y="3" width="12" height="18" rx="1" />
	</svg>
);

const MomentDetails = ({ headshotType }) => {
	const { locale } = useContext(UiPersistContext);
	const [layout, setLayout] = useState(() => {
		try {
			const v = localStorage.getItem(LAYOUT_KEY);
			return v === LAYOUT_ONE ? LAYOUT_ONE : LAYOUT_TWO;
		} catch {
			return LAYOUT_TWO;
		}
	});

	useEffect(() => {
		try {
			localStorage.setItem(LAYOUT_KEY, layout);
		} catch (_) {}
	}, [layout]);

	const isSingle = layout === LAYOUT_ONE;
	const toggleLayout = useCallback(() => {
		setLayout((prev) => (prev === LAYOUT_TWO ? LAYOUT_ONE : LAYOUT_TWO));
	}, []);

	const scrollRef = useRef(null);
	useWheelInertia(scrollRef, isSingle);

	return (
		<div ref={scrollRef} className={`${mdc.entire} ${isSingle ? mdc.entireSingleCol : ''}`}>
			<button
				type="button"
				className={mdc.layoutToggle}
				onClick={toggleLayout}
				title={isSingle ? t(locale, 'momentDetailLayoutToTwo') : t(locale, 'momentDetailLayoutToSingle')}
				aria-label={isSingle ? t(locale, 'momentDetailLayoutToTwo') : t(locale, 'momentDetailLayoutToSingle')}
			>
				{isSingle ? <IconTwoCol /> : <IconSingleCol />}
			</button>
			<Content headshotType={headshotType} />
			<MomentsComments />
		</div>
	);
};

export default MomentDetails;