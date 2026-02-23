import React, {useCallback, useEffect, useState} from 'react';
import sT from './switch.module.less';

const SunIcon = () => (
	<svg className={sT.iconSvg} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
		<circle cx="12" cy="12" r="4"/>
		<path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>
	</svg>
);
const MoonIcon = () => (
	<svg className={sT.iconSvg} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
		<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
	</svg>
);

// 切换主题深浅色
const SwitchTheme = () => {
	const [mode, setMode] = useState(localStorage.getItem('themeMode') || 'light');

	// 将当前模式同步到 html[data-theme]，以便使用 CSS 变量覆盖实现主题
	useEffect(() => {
		document.documentElement.setAttribute('data-theme', mode);
	}, [mode]);

	// 将主题的更改存储到localstorage
	const handleSwitch = useCallback(() => {
		const newMode = mode === 'light' ? 'dark' : 'light';
		setMode(newMode);
		localStorage.setItem('themeMode', newMode);
	}, [mode]);

	return (
		<div className={sT.entire}>
			<label htmlFor="switchTheme" className={sT.track}>
				<input type="checkbox" onChange={handleSwitch} id="switchTheme" checked={mode === 'dark'} className={sT.theme_checkbox} aria-label="切换深浅色主题"/>
				<span className={sT.knob}>
					{mode === 'dark' ? <MoonIcon /> : <SunIcon />}
				</span>
			</label>
		</div>
	);
};

export default SwitchTheme;