import adminImg from '../assets/images/admin.png';
import binesImg from '../assets/images/bines.png';
import { getAvatarColor, getAvatarLetter } from './avatarColor';

export const ADMIN_UIDS = ['u_mg94ixwg_df9ff1a129ad44a6', 'u_mg94t4ce_6485ab4d88f2f8db'];
export const BINES_UID = 'u_mlkpl8fl_52a3d8c2068b281a';

export function getSpecialAvatarImage(uid) {
	if (!uid) return null;
	if (uid === 'admin' || ADMIN_UIDS.includes(uid)) return adminImg;
	if (uid === BINES_UID) return binesImg;
	return null;
}

export function getUserAvatar(uid, displayName = '') {
	const avatarImg = getSpecialAvatarImage(uid);
	const avatarLetter = !avatarImg && displayName ? getAvatarLetter(displayName) : null;
	const avatarColor = avatarLetter ? getAvatarColor(uid || displayName) : null;
	return { avatarImg, avatarLetter, avatarColor };
}

export function stripGuestPrefix(name = '') {
	return String(name || '').replace(/^Guest_/i, '');
}

function getCurrentGuestInfo() {
	if (typeof localStorage === 'undefined') return { guestUid: '', guestDisplayName: '' };
	return {
		guestUid: localStorage.getItem('guest_uid') || '',
		guestDisplayName: localStorage.getItem('guest_display_name') || '',
	};
}

export function isLikelyGuestUser(uid, name = '') {
	const uidText = String(uid || '');
	const n = String(name || '');
	const { guestUid } = getCurrentGuestInfo();
	if (uidText && guestUid && uidText === guestUid) return true;
	if (/^Guest_/i.test(n)) return true;
	if (/^(g_|guest[_-])/i.test(uidText)) return true;
	return false;
}

export function resolveDisplayName(uid, username = '', { stripGuestPrefixForGuest = false } = {}) {
	const fallback = String(username || uid || '');
	const { guestUid, guestDisplayName } = getCurrentGuestInfo();
	const isGuestUser = isLikelyGuestUser(uid, fallback);
	if (!isGuestUser) return fallback;
	const guestBasedName = uid && guestUid && uid === guestUid ? (guestDisplayName || fallback) : fallback;
	return stripGuestPrefixForGuest ? stripGuestPrefix(guestBasedName) : guestBasedName;
}

export function getIdentityAvatar(uid, username = '', { stripGuestPrefixForGuest = false } = {}) {
	const displayName = resolveDisplayName(uid, username, { stripGuestPrefixForGuest });
	const { avatarImg, avatarLetter, avatarColor } = getUserAvatar(uid, displayName);
	return { displayName, avatarImg, avatarLetter, avatarColor };
}
