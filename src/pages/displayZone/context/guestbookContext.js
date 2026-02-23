import { createContext } from 'react';

/** value: [guestbookComments, setGuestbookComments] — 留言列表，由 DisplayZone 初始拉取并随 SSE guestbook.new 更新 */
export const GuestbookContext = createContext([[], () => {}]);
