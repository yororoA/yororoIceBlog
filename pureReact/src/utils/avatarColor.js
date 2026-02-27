/**
 * Generate a consistent avatar background color from a string (uid/username).
 * Uses warm/neutral tones — no blue or purple.
 */
const AVATAR_COLORS = [
  '#6b7280', '#78716c', '#71717a', '#737373',
  '#92400e', '#065f46', '#9d174d', '#b45309',
  '#047857', '#374151', '#57534e', '#525252',
];

export const getAvatarColor = (str = '') => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
};
