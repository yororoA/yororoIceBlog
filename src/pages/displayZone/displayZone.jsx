import React, {useCallback, useEffect} from 'react';
import logo from '../../assets/images/logo.png'
import SwitchTheme from "../../components/switchTheme/switchTheme";
import page from './page.module.less';
import {Outlet, useNavigate} from "react-router-dom";

const DisplayZone = () => {
	const navigate = useNavigate();
	// default home page
	const pathname = window.location.pathname.split('/').filter(item => item !== '').at(-1);
	useEffect(() => {
		if (pathname === 'town') navigate('moments');
	}, [pathname, navigate]);
	// click to nav link
	const handleRedirect = useCallback(e => {
		if (e.target.id) navigate(e.target.id);
	}, [navigate]);


	return (
		<div className={page.entire}>
			<nav>
				<img src={logo} alt="logo"/>
				<div className={page.link} onClick={handleRedirect}>
					{/* 生活动态 */}
					<span id={'moments'}>{'Moments'}</span>
					{/* 美图, 相册等图片展示 */}
					<span id={'gallery'}>{'Gallery'}</span>
					{/* 技术博客 */}
					<span id={'knowledge'}>{'Knowledge'}</span>
					{/* 归档 */}
					<span id={'archive'}>{'Archive'}</span>
					{/* 项目 */}
					<span id={'projects'}>{'Projects'}</span>
					{/* 个人简介等 */}
					<span id={'about'}>{'About'}</span>
					{/* 访客留言 */}
					<span id={'talk'}>{'Talk'}</span>
				</div>
				<SwitchTheme/>
			</nav>
			<main>
				<Outlet/>
			</main>
		</div>
	);
};

export default DisplayZone;