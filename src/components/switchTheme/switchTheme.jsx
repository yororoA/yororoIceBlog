import React, {useCallback,useState} from 'react';
import sT from './switch.module.less';


// 切换主题深浅色
const SwitchTheme = () => {
	const [mode, setMode] = useState(localStorage.getItem('themeMode') || 'light');

	// 将主题的更改存储到localstorage
	const handleSwitch = useCallback(e => {
		let newMode;
		if (mode==='light') newMode = 'dark';
		else newMode = 'light';
		setMode(newMode);
		localStorage.setItem('themeMode', newMode);
	}, [mode]);

	return (
		<div className={sT.entire}>
			<label htmlFor="switchTheme">{'Dark Mode'}</label>
			<input type="checkbox" onChange={handleSwitch} id={'switchTheme'} checked={mode==='dark'} className={sT.theme_checkbox}/>
		</div>
	);
};

export default SwitchTheme;