import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { lazy, useEffect, Suspense } from "react";

const TITLE_SUFFIX = ' - YororoIce Town';
const PAGE_TITLES = {
	'/account': `Account${TITLE_SUFFIX}`,
	'/account/login': `Login${TITLE_SUFFIX}`,
	'/account/register': `Register${TITLE_SUFFIX}`,
	'/town': 'YororoIce Town',
	'/town/': 'YororoIce Town',
	'/town/moments': `Moments${TITLE_SUFFIX}`,
	'/town/gallery': `Gallery${TITLE_SUFFIX}`,
	'/town/articles': `Articles${TITLE_SUFFIX}`,
	'/town/archive': `Archive${TITLE_SUFFIX}`,
	'/town/lol': `Lol${TITLE_SUFFIX}`,
	'/town/other': `Other${TITLE_SUFFIX}`,
};

const Account = lazy(() => import('./pages/account/account'));
const Login = lazy(() => import('./pages/account/loginCard/loginCard'));
const Register = lazy(() => import('./pages/account/loginCard/registerCard'));

const DisplayZone = lazy(() => import('./pages/displayZone/displayZone'));
const Home = lazy(() => import('./pages/displayZone/home/home'));
const Moments = lazy(() => import('./pages/displayZone/moments/moments'));
const GalleryEntire = lazy(() => import('./pages/displayZone/gallery/context/galleryContext'));
const Knowledge = lazy(() => import('./pages/displayZone/knowledge/knowledge'));
const Archive = lazy(() => import('./pages/displayZone/archive/archive'));
const About = lazy(() => import('./pages/displayZone/about/about'));
const Lol = lazy(() => import('./pages/displayZone/lol/lol'));

// 创建一个在Router内部的组件来处理导航逻辑
function AppContent() {
	const navigate = useNavigate();
	const location = useLocation();

	useEffect(() => {
		const pathname = window.location.pathname.split('/').filter(item => item !== '').at(-1);
		const hasToken = localStorage.getItem('token') || sessionStorage.getItem('token') || localStorage.getItem('guest_token') || sessionStorage.getItem('yororoToken');
		if (!hasToken && pathname !== 'login' && pathname !== 'register') {
			navigate('/account');
		} else if (pathname === undefined) navigate('/town');
	}, [navigate]);

	useEffect(() => {
		const path = location.pathname.replace(/\/$/, '') || '/';
		document.title = PAGE_TITLES[path] ?? PAGE_TITLES[path + '/'] ?? 'YororoIce Town';
	}, [location.pathname]);

	return (
		<Suspense fallback={null}>
			<Routes>
				{/* access allowed only after account */}
				<Route path='/town' element={<DisplayZone />}>
					<Route index element={<Home />} />
					<Route path='moments' element={<Moments />} />
					<Route path='gallery' element={<GalleryEntire />} />
					<Route path='articles' element={<Knowledge />} />
					<Route path='archive' element={<Archive />} />
					<Route path='lol' element={<Lol />} />
					<Route path='other' element={<About />} />
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
