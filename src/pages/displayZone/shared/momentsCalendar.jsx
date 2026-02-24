import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './momentsCalendar.module.less';
import { UiPersistContext } from '../context/uiPersistContext';
import { MomentsListContext } from '../moments/context/momentsListContext';
import { KnowledgeListContext } from '../knowledge/context/knowledgeListContext';
import { t } from '../../../i18n/uiText';

const WEEKDAY_LEN = 7;
const getLocaleForCalendar = (locale) => (locale === 'zh' ? 'zh-CN' : locale === 'ja' ? 'ja-JP' : 'en-US');

const toDateKey = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

/** 日历用「创建日」统一取日期，moments 与 articles 均使用 createdAt */
const getItemDate = (item) => {
  const raw = item.createdAt;
  if (raw == null) return null;
  return raw instanceof Date ? raw : new Date(raw);
};

const initialViewDate = () => new Date();

// 涂鸦路径：从左上往右下的“之”字形，stroke-width 会让它变成色块
const SCRIBBLE_PATH_D = "M 20,25 Q 55,20 85,25 L 15,45 L 85,55 L 15,70 L 80,80";

const MomentsCalendar = ({ visible = true, mode = 'moments' }) => {
  const { locale } = useContext(UiPersistContext);
  const [momentsData] = useContext(MomentsListContext);
  const [articlesData] = useContext(KnowledgeListContext);
  const navigate = useNavigate();
  const listData = useMemo(
    () => (mode === 'articles' ? (articlesData || []) : (momentsData || [])),
    [mode, articlesData, momentsData]
  );
  // articles 与 moments 路由的日历视图、选中日期状态独立
  const [viewDateByMode, setViewDateByMode] = useState(() => ({
    moments: initialViewDate(),
    articles: initialViewDate(),
  }));
  const [selectedDateKeyByMode, setSelectedDateKeyByMode] = useState({
    moments: toDateKey(initialViewDate()), // Default to current date
    articles: toDateKey(initialViewDate()), // Default to current date
  });
  const viewDate = viewDateByMode[mode];
  const setViewDate = useCallback(
    (updater) => {
      setViewDateByMode((prev) => ({ ...prev, [mode]: typeof updater === 'function' ? updater(prev[mode]) : updater }));
    },
    [mode]
  );
  const selectedDateKey = selectedDateKeyByMode[mode];
  const setSelectedDateKey = useCallback(
    (value) => {
      setSelectedDateKeyByMode((prev) => ({ ...prev, [mode]: value }));
    },
    [mode]
  );
  const [isClosing, setIsClosing] = useState(false);
  const [isListOpen, setIsListOpen] = useState(false);
  const closeTimeoutRef = useRef(null);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const today = useMemo(() => {
    const d = new Date();
    return d.getFullYear() === year && d.getMonth() === month ? d.getDate() : null;
  }, [year, month]);

  const todayDateKey = useMemo(() => {
    if (today == null) return null;
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(today).padStart(2, '0')}`;
  }, [year, month, today]);

  const daysWithItems = useMemo(() => {
    const set = new Set();
    listData.forEach((item) => {
      const date = getItemDate(item);
      if (date != null && !Number.isNaN(date.getTime())) set.add(toDateKey(date));
    });
    return set;
  }, [listData]);

  const weekDayNames = useMemo(() => {
    const base = new Date(2024, 0, 1);
    return Array.from({ length: WEEKDAY_LEN }, (_, i) => {
      const d = new Date(base);
      d.setDate(base.getDate() + i);
      return d.toLocaleDateString(getLocaleForCalendar(locale), { weekday: 'short' });
    });
  }, [locale]);

  const { daysInMonth, startOffset } = useMemo(() => {
    const first = new Date(year, month, 1);
    const last = new Date(year, month + 1, 0);
    const daysInMonth = last.getDate();
    const firstWeekday = first.getDay();
    const startOffset = (firstWeekday + 6) % 7;
    return { daysInMonth, startOffset };
  }, [year, month]);

  const cells = useMemo(() => {
    const list = [];
    for (let i = 0; i < startOffset; i++) list.push({ empty: true });
    for (let d = 1; d <= daysInMonth; d++) {
      const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const isToday = dateKey === todayDateKey;
      const hasItem = daysWithItems.has(dateKey);
      list.push({
        day: d,
        dateKey,
        isToday,
        hasItem,
        empty: false,
      });
    }
    return list;
  }, [startOffset, daysInMonth, todayDateKey, daysWithItems, month, year]);

  const itemsOnSelectedDate = useMemo(() => {
    if (!selectedDateKey || !listData.length) return [];
    return listData
      .filter((item) => {
        const date = getItemDate(item);
        return date != null && !Number.isNaN(date.getTime()) && toDateKey(date) === selectedDateKey;
      })
      .sort((a, b) => {
        const dA = getItemDate(a)?.getTime?.() ?? 0;
        const dB = getItemDate(b)?.getTime?.() ?? 0;
        return dB - dA;
      });
  }, [selectedDateKey, listData]);

  const selectedDateLabel = useMemo(() => {
    if (!selectedDateKey) return '';
    const [y, m, d] = selectedDateKey.split('-');
    const date = new Date(Number(y), Number(m) - 1, Number(d));
    return date.toLocaleDateString(getLocaleForCalendar(locale), { month: 'short', day: 'numeric', weekday: 'short' });
  }, [selectedDateKey, locale]);

  const monthLabel = useMemo(() => {
    return viewDate.toLocaleDateString(getLocaleForCalendar(locale), { year: 'numeric', month: 'long' });
  }, [viewDate, locale]);

  const handleCellClick = useCallback((cell) => {
    if (!cell.hasItem) return;
    if (selectedDateKey === cell.dateKey) {
      setSelectedDateKey(null);
    } else {
      setSelectedDateKey(cell.dateKey);
      setIsClosing(false);
    }
  }, [selectedDateKey, setSelectedDateKey]);

  const handleCloseDayList = useCallback(() => {
    setIsClosing(true);
  }, []);

  useEffect(() => {
    if (!selectedDateKey) return;
    const id = requestAnimationFrame(() => {
      requestAnimationFrame(() => setIsListOpen(true));
    });
    return () => cancelAnimationFrame(id);
  }, [selectedDateKey]);

  useEffect(() => {
    if (!isClosing) return;
    closeTimeoutRef.current = window.setTimeout(() => {
      setSelectedDateKey(null);
      setIsClosing(false);
      setIsListOpen(false);
    }, 300);
    return () => {
      if (closeTimeoutRef.current) window.clearTimeout(closeTimeoutRef.current);
    };
  }, [isClosing, setSelectedDateKey]);

  const handleOpenItem = useCallback((id) => {
    if (mode === 'articles') {
      navigate(`/town/articles?kid=${id}`);
    } else {
      navigate(`/town/moments?mid=${id}`);
    }
  }, [navigate, mode]);

  const goPrev = () => setViewDate((d) => new Date(d.getFullYear(), d.getMonth() - 1));
  const goNext = () => setViewDate((d) => new Date(d.getFullYear(), d.getMonth() + 1));

  return (
    <aside className={`${styles.rightLane}${visible ? '' : ` ${styles.rightLaneHidden}`}`} aria-label={t(locale, 'calendarTitle')}>
      <div className={styles.stack}>
        <div className={`${styles.card} page-enter`}>
          <div className={styles.calendarHeader}>
            <button type="button" className={styles.navBtn} onClick={goPrev} aria-label={t(locale, mode === 'articles' ? 'previousArticle' : 'previousMoment')}>
              ‹
            </button>
            <span className={styles.monthLabel}>{monthLabel}</span>
            <button type="button" className={styles.navBtn} onClick={goNext} aria-label={t(locale, mode === 'articles' ? 'nextArticle' : 'nextMoment')}>
              ›
            </button>
          </div>
          <div className={styles.weekdays}>
            {weekDayNames.map((name, wIdx) => (
              <span key={name} className={`${styles.weekday}${wIdx >= 5 ? ` ${styles.weekdayWeekend}` : ''}`}>{name}</span>
            ))}
          </div>
          <div className={styles.grid}>
            {cells.map((cell, idx) => {
              const isSelected = selectedDateKey === cell.dateKey;
              const isTodayOnly = cell.isToday && todayDateKey && !isSelected;

              if (cell.empty) {
                return <span key={`e-${idx}`} className={styles.cell} />;
              }

              const renderCellContent = () => (
                <span className={styles.cellInner}>
                  <span className={styles.cellNum}>{cell.day}</span>
                  {!isSelected && <span className={styles.cellDot} aria-hidden />}
                </span>
              );

              if (cell.hasItem) {
                return (
                  <button
                    key={cell.day}
                    type="button"
                    onClick={() => handleCellClick(cell)}
                    className={`
                      ${styles.cell} ${styles.cellDay} ${styles.cellClickable}
                      ${isSelected ? ` ${styles.cellSelected}` : ''}
                      ${isTodayOnly ? ` ${styles.cellTodayRing}` : ''} 
                      ${styles.cellHasMoment}
                    `}
                  >
                    {isSelected && (
                      <svg className={styles.animeScribble} viewBox="0 0 100 100" fill="none">
                        <path className={styles.scribblePath} d={SCRIBBLE_PATH_D} />
                      </svg>
                    )}
                    {isTodayOnly && !isSelected && (
                      <svg className={styles.animeScribble} viewBox="0 0 100 100" fill="none">
                        <path className={styles.scribblePathToday} d={SCRIBBLE_PATH_D} />
                      </svg>
                    )}
                    {renderCellContent()}
                  </button>
                );
              }

              return (
                <span
                  key={cell.day}
                  className={`
                    ${styles.cell} ${styles.cellDay}
                    ${isSelected ? ` ${styles.cellSelected}` : ''}
                    ${isTodayOnly ? ` ${styles.cellTodayRing}` : ''}
                  `}
                >
                  {isSelected && (
                    <svg className={styles.animeScribble} viewBox="0 0 100 100" fill="none">
                      <path className={styles.scribblePath} d={SCRIBBLE_PATH_D} />
                    </svg>
                  )}
                  {isTodayOnly && !isSelected && (
                    <svg className={styles.animeScribble} viewBox="0 0 100 100" fill="none">
                      <path className={styles.scribblePathToday} d={SCRIBBLE_PATH_D} />
                    </svg>
                  )}
                  {isSelected ? <span className={styles.cellInner}>{cell.day}</span> : cell.day}
                </span>
              );
            })}
          </div>
          {selectedDateKey && (
            <div
              key={selectedDateKey}
              className={`${styles.dayListWrap}${isListOpen && !isClosing ? ` ${styles.dayListWrapOpen}` : ''}${isClosing ? ` ${styles.dayListWrapLeave}` : ''}`}
            >
              <div className={`${styles.dayList} ${styles.dayListEnter}${isClosing ? ` ${styles.dayListLeave}` : ''}`}>
              <div className={styles.dayListHeader}>
                <span className={styles.dayListTitle}>{t(locale, mode === 'articles' ? 'articlesOnDate' : 'momentsOnDate', selectedDateLabel)}</span>
                <button type="button" className={styles.dayListClose} onClick={handleCloseDayList} aria-label={t(locale, 'deny')}>
                  ×
                </button>
              </div>
              {itemsOnSelectedDate.length === 0 ? (
                <p className={styles.dayListEmpty}>{t(locale, mode === 'articles' ? 'noArticlesOnDate' : 'noMomentsOnDate')}</p>
              ) : (
                <ul className={styles.dayListUl}>
                  {itemsOnSelectedDate.map((item) => {
                    const title = (item.title || item.content || t(locale, mode === 'articles' ? 'article' : 'moment')).slice(0, 28);
                    const titleTrunc = (item.title || item.content || '').length > 28;
                    const author = item.username || '—';
                    return (
                      <li key={item._id} className={styles.dayListItem}>
                        <button type="button" className={styles.dayListLink} onClick={() => handleOpenItem(item._id)}>
                          <span className={styles.dayListTitleText}>{title}{titleTrunc ? '…' : ''}</span>
                          <span className={styles.dayListMeta}>
                            <span className={styles.dayListAuthor}>{author}</span>
                            <span className={styles.dayListArrow} aria-hidden>→</span>
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
              </div>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};

export default MomentsCalendar;