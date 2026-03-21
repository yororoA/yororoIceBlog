import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { lazy, useEffect, Suspense } from "react";
import BowClickEffect from './components/ui/clickBow/BowClickEffect';
import { isCrawler } from './utils/isCrawler';

const TITLE_SUFFIX = ' - YororoIce Town';
const PAGE_TITLES = {
	'/account': `Account${TITLE_SUFFIX}`,
	'/account/login': `Login${TITLE_SUFFIX}`,
	'/account/register': `Register${TITLE_SUFFIX}`,
	'/account/town-law': `Town Law${TITLE_SUFFIX}`,
	'/town': 'YororoIce Town',
	'/town/': 'YororoIce Town',
	'/town/moments': `Moments${TITLE_SUFFIX}`,
	'/town/gallery': `Gallery${TITLE_SUFFIX}`,
	'/town/articles': `Articles${TITLE_SUFFIX}`,
	'/town/archive': `Archive${TITLE_SUFFIX}`,
	'/town/lol': `LOL${TITLE_SUFFIX}`,
	'/town/chat': `Chat${TITLE_SUFFIX}`,
	'/town/chat/group': `Chat${TITLE_SUFFIX}`,
	'/town/chat/private': `Chat${TITLE_SUFFIX}`,
	'/town/other': `Other${TITLE_SUFFIX}`,
};

const Account = lazy(() => import('./pages/account/account'));
const Login = lazy(() => import('./pages/account/loginCard/loginCard'));
const Register = lazy(() => import('./pages/account/loginCard/registerCard'));
const TownLawPage = lazy(() => import('./pages/account/townLaw/townLawPage'));

const DisplayZone = lazy(() => import('./pages/displayZone/displayZone'));
const Home = lazy(() => import('./pages/displayZone/home/home'));
const Moments = lazy(() => import('./pages/displayZone/moments/moments'));
const GalleryEntire = lazy(() => import('./pages/displayZone/gallery/context/galleryContext'));
const Knowledge = lazy(() => import('./pages/displayZone/knowledge/knowledge'));
const Archive = lazy(() => import('./pages/displayZone/archive/archive'));
const About = lazy(() => import('./pages/displayZone/about/about'));
const Lol = lazy(() => import('./pages/displayZone/lol/lol'));
const Chat = lazy(() => import('./pages/displayZone/chat/chat'));

// 创建一个在Router内部的组件来处理导航逻辑
function AppContent() {
	const navigate = useNavigate();
	const location = useLocation();

	useEffect(() => {
		const currentPath = window.location.pathname;
		const pathname = currentPath.split('/').filter(item => item !== '').at(-1);
		const isAccountRoute = currentPath.startsWith('/account');
		const crawler = isCrawler();
		const hasToken = localStorage.getItem('token') || sessionStorage.getItem('token') || localStorage.getItem('guest_token') || sessionStorage.getItem('yororoToken');
		if (pathname === undefined && !isAccountRoute && !crawler) navigate('/town');
		if (!hasToken && !isAccountRoute && pathname !== 'login' && pathname !== 'register' && !crawler) {
			sessionStorage.setItem('guest_auth_pending', '1');
		}
	}, [navigate]);

	// 401 跳转登录的中间标记在进入 account 路由后应立即清除，避免后续返回 town 时被旧标记误判。
	useEffect(() => {
		if (!location.pathname.startsWith('/account')) return;
		try {
			sessionStorage.removeItem('auth_redirecting');
		} catch (_) {}
	}, [location.pathname]);

	useEffect(() => {
		const path = location.pathname.replace(/\/$/, '') || '/';
		if (path.startsWith('/town/chat')) {
			document.title = PAGE_TITLES['/town/chat'];
			return;
		}
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
					<Route path='chat/*' element={<Chat />} />
					<Route path='other' element={<About />} />
				</Route>


				{/* account page */}
				<Route path="/account" element={<Account />}>
					<Route path='login' element={<Login />} />
					<Route path='register' element={<Register />} />
					<Route path='town-law' element={<TownLawPage />} />
				</Route>
			</Routes>
		</Suspense>
	);
}

function App() {
	return (
		<>
			<BowClickEffect />
			<Router>
				<AppContent />
			</Router>
		</>
	);
}

export default App;
