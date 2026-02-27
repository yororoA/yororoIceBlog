import { createContext } from "react";

/** value: [archiveData, setArchiveData, stats, setStats, years, setYears] */
export const ArchiveListContext = createContext([[], () => {}, {}, () => {}, ['all'], () => {}]);
