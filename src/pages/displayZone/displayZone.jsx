import React, {useCallback, useEffect, useState} from 'react';
import logo from '../../assets/images/logo.png'
import SwitchTheme from "../../components/switchTheme/switchTheme";
import page from './page.module.less';
import {Outlet, useNavigate} from "react-router-dom";
import {connectSSE, disconnectSSE} from "../../utils/sse/connect";
import {useDispatch} from "react-redux";
import {updatedCommentSlice, updatedMomentLikesSlice, updatedMomentSlice} from "../../store/slices";

const DisplayZone = () => {
	const uid = localStorage.getItem('uid');
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

	// store新状态派发器
	const dispatch = useDispatch();
	const dispatchFn = useCallback((payload) => {
		const {momentNew} = updatedMomentSlice.actions;
		const {commentNew} = updatedCommentSlice.actions;
		const {momentLikesUpdated} = updatedMomentLikesSlice.actions;
		// payload: {type, data}
		const {type, data} = payload;
		if (data.uid === uid) return;
		console.log(data, '\n', typeof data);
		switch (type) {
			case 'moment.new':
				dispatch(momentNew(data));
				break;
			case 'comment.new':
				dispatch(commentNew(data));
				break;
			case 'moment.like':
				dispatch(momentLikesUpdated(data));
				break;
			default:
				break;
		}
	}, [dispatch, uid]);
	// sse连接
	const [connect, setConnect] = useState(false);
	useEffect(() => {
		setConnect(true)
		connectSSE(dispatchFn).catch(()=>setConnect(false));

		return () => disconnectSSE();
	}, [dispatchFn]);


	return (
		<>
			{/*{connect &&*/}
			{/*	}*/}
			<div className={page.entire}>
				<div className={page.navBox}>
					<nav>
						<img src={logo} className={page.logo} alt="logo"/>
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
				</div>
				<main>
					<Outlet/>
				</main>
			</div>
		</>
	);
};

export default DisplayZone;