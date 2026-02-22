import adminImg from '../../../assets/images/admin.png';

export const PROFILE = {
  author: 'yororoIce',
  avatar: adminImg,
  description: 'Time mends the wounds, love soothes the scars.',
  email: '3364817735song@gmail.com',
  github: 'https://github.com/yororoA',
  bilibili: 'https://space.bilibili.com/411513480',
  x: 'https://x.com/yororo_ice',
  steam: 'https://steamcommunity.com/profiles/76561199041131347/',
  skills: ['JavaScript', 'TypeScript', 'React', 'Node.js', 'Python', 'Golang', 'Rust', 'MongoDB'],
  interests: ['Coding', 'Photography', 'Travel', 'Reading', 'Music', 'Gaming', 'Anime'],
};

export const SOCIAL_LINKS = [
  { name: 'GitHub', url: PROFILE.github, show: PROFILE.github },
  { name: 'BiliBili', url: PROFILE.bilibili, show: PROFILE.bilibili },
  { name: 'X (Twitter)', url: PROFILE.x, show: PROFILE.x },
  { name: 'Steam', url: PROFILE.steam, show: PROFILE.steam },
].filter(link => link.show);
