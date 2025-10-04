import React, {useEffect, useState} from 'react';
import page from './page.module.less'
import logo from '../../assets/images/logo.png'
import SwitchTheme from "../../components/switchTheme/switchTheme";
import {Outlet, useNavigate} from "react-router-dom";
import CommonBtn from "../../components/btn/commonBtn/commonBtn";


// account page, no access with no account
const Account = () => {
	// welcome text & btn display State
	const [firstClick, setFirstClick] = useState(false);
	// navigate to login, change the welcome text
	const navigate = useNavigate();
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
						// <button type={"button"} onClick={handleFirstClick}>{'Click to Login'}</button>}
						<CommonBtn text={'Click to Login'} onClick={handleFirstClick}/>
					}
				</div>
				<Outlet/>
			</main>
		</div>
	);
};

export default Account;