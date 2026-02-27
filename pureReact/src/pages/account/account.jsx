import React, { useEffect, useState, useRef } from 'react';
import page from './page.module.less'
import logo from '../../assets/images/logo.png'
import SwitchTheme from "../../components/switchTheme/switchTheme";
import { Outlet, useNavigate } from "react-router-dom";
import CommonBtn from "../../components/btn/commonBtn/commonBtn";
import { useWheelInertia } from '../../hooks/useWheelInertia';
import BackToTop from '../../components/backToTop/BackToTop';


// account page, no access with no account
const Account = () => {
	const [firstClick, setFirstClick] = useState(false);
	const navigate = useNavigate();
	const windowScrollRef = useRef(null);
	useWheelInertia(windowScrollRef);
	const handleFirstClick = () => {
		setFirstClick(true);
		navigate('./login');
	}
	const pathname = window.location.pathname.split('/').at(-1);
	useEffect(() => {
		if (pathname === 'login' || pathname === 'register') setFirstClick(true);
		else setFirstClick(false);
	}, [pathname]);


	return (
		<div className={page.entire}>
			<nav>
				<img src={logo} alt="logo"/>
				<SwitchTheme/>
			</nav>

			<main>
				<div className={`${page.welcome} ${firstClick && page.welComeFloat}`}>
					<h1>{firstClick ? 'Welcome' : 'Welcome to YoroBlog'}</h1>
					{firstClick &&
						<h3>{`${pathname === 'login' ? 'Login' : 'Register'} to Join My Town`}</h3>}
					{!firstClick &&
						<CommonBtn text={'Click to Login'} onClick={handleFirstClick}/>
					}
				</div>
				<Outlet/>
			</main>
			<BackToTop scrollContainerRef={windowScrollRef} />
		</div>
	);
};

export default Account;