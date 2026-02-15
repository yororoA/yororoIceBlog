import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { lazy, useEffect, Suspense } from "react";

const Account = lazy(() => import('./pages/account/account'));
const Login = lazy(() => import('./pages/account/loginCard/loginCard'));
const Register = lazy(() => import('./pages/account/loginCard/registerCard'));

const DisplayZone = lazy(() => import('./pages/displayZone/displayZone'));
const Moments = lazy(() => import('./pages/displayZone/moments/moments'));
const GalleryEntire = lazy(() => import('./pages/displayZone/gallery/context/galleryContext'));

// 创建一个在Router内部的组件来处理导航逻辑
function AppContent() {
	const navigate = useNavigate();

	useEffect(() => {
		// redirect to account page if no token exist
		const pathname = window.location.pathname.split('/').filter(item => item !== '').at(-1);
		// console.log(pathname)
		const hasToken = localStorage.getItem('token') || sessionStorage.getItem('token') || localStorage.getItem('guest_token') || sessionStorage.getItem('yororoToken');
		if (!hasToken && pathname !== 'login' && pathname !== 'register') {
			navigate('/account');
		} else if (pathname === undefined) navigate('/town');
	}, [navigate]);

	return (
		<Suspense fallback={null}>
			<Routes>
				{/* access allowed only after account */}
				<Route path='/town' element={<DisplayZone />}>
					<Route path='moments' element={<Moments />} />
					<Route path='gallery' element={<GalleryEntire />} />
				</Route>


				{/* account page */}
				<Route path="/account" element={<Account />}>
					<Route path='login' element={<Login />} />
					<Route path='register' element={<Register />} />
				</Route>
			</Routes>
		</Suspense>
	);
}

function App() {
	return (
		<>
			<Router>
				<AppContent />
			</Router>
		</>
	);
}

export default App;
