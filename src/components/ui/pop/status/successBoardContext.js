import { createContext } from 'react';

/** value: { showSuccess, showFailed }，用于成功/失败时弹出状态栏 */
export const SuccessBoardContext = createContext({ showSuccess: () => {}, showFailed: () => {} });
