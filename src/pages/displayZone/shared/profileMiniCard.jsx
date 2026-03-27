import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import styles from './profileMiniCard.module.less';
import { PROFILE, SOCIAL_LINKS } from './profileInfo';
import { UiPersistContext } from '../context/uiPersistContext';
import { t } from '../../../i18n/uiText';
import { SuccessBoardContext } from '../../../components/ui/pop/status/successBoardContext';

function renderSocialIcon(name) {
  const n = String(name || '').toLowerCase();
  if (n.includes('github')) {
    return (
      <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="currentColor">
        <path d="M10.303 16.652c-2.837-.344-4.835-2.385-4.835-5.028 0-1.074.387-2.235 1.031-3.008-.279-.709-.236-2.214.086-2.837.86-.107 2.02.344 2.708.967.816-.258 1.676-.386 2.728-.386 1.053 0 1.913.128 2.686.365.666-.602 1.848-1.053 2.708-.946.3.581.344 2.085.064 2.815.688.817 1.053 1.913 1.053 3.03 0 2.643-1.998 4.641-4.877 5.006.73.473 1.224 1.504 1.224 2.686v2.235c0 .644.537 1.01 1.182.752 3.889-1.483 6.94-5.372 6.94-10.185 0-6.081-4.942-11.044-11.022-11.044-6.081 0-10.98 4.963-10.98 11.044a10.84 10.84 0 0 0 7.112 10.206c.58.215 1.139-.172 1.139-.752v-1.719a2.768 2.768 0 0 1-1.032.215c-1.418 0-2.256-.773-2.857-2.213-.237-.58-.495-.924-.989-.988-.258-.022-.344-.129-.344-.258 0-.258.43-.451.86-.451.623 0 1.16.386 1.719 1.181.43.623.881.903 1.418.903.537 0 .881-.194 1.375-.688.365-.365.645-.687.903-.902Z" />
      </svg>
    );
  }
  if (n.includes('bili')) {
    return (
      <svg viewBox="0 0 18 18" fill="none" aria-hidden>
        <path fillRule="evenodd" clipRule="evenodd" d="M3.73252 2.67094C3.33229 2.28484 3.33229 1.64373 3.73252 1.25764C4.11291 0.890684 4.71552 0.890684 5.09591 1.25764L7.21723 3.30403C7.27749 3.36218 7.32869 3.4261 7.37081 3.49407H10.5789C10.6211 3.4261 10.6723 3.36218 10.7325 3.30403L12.8538 1.25764C13.2342 0.890684 13.8368 0.890684 14.2172 1.25764C14.6175 1.64373 14.6175 2.28484 14.2172 2.67094L13.364 3.49407H14C16.2091 3.49407 18 5.28493 18 7.49407V12.9996C18 15.2087 16.2091 16.9996 14 16.9996H4C1.79086 16.9996 0 15.2087 0 12.9996V7.49406C0 5.28492 1.79086 3.49407 4 3.49407H4.58579L3.73252 2.67094ZM4 5.42343C2.89543 5.42343 2 6.31886 2 7.42343V13.0702C2 14.1748 2.89543 15.0702 4 15.0702H14C15.1046 15.0702 16 14.1748 16 13.0702V7.42343C16 6.31886 15.1046 5.42343 14 5.42343H4ZM5 9.31747C5 8.76519 5.44772 8.31747 6 8.31747C6.55228 8.31747 7 8.76519 7 9.31747V10.2115C7 10.7638 6.55228 11.2115 6 11.2115C5.44772 11.2115 5 10.7638 5 10.2115V9.31747ZM12 8.31747C11.4477 8.31747 11 8.76519 11 9.31747V10.2115C11 10.7638 11.4477 11.2115 12 11.2115C12.5523 11.2115 13 10.7638 13 10.2115V9.31747C13 8.76519 12.5523 8.31747 12 8.31747Z" fill="currentColor" />
      </svg>
    );
  }
  if (n.includes('x')) {
    return (
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden>
        <path d="M21.742 21.75l-7.563-11.179 7.056-8.321h-2.456l-5.691 6.714-4.54-6.714H2.359l7.29 10.776L2.25 21.75h2.456l6.035-7.118 4.818 7.118h6.191-.008zM7.739 3.818L18.81 20.182h-2.447L5.29 3.818h2.447z" />
      </svg>
    );
  }
  if (n.includes('steam')) {
    return (
      <img src="https://store.akamai.steamstatic.com/public/shared/images/header/logo_steam.svg?t=962016" alt="" loading="lazy" />
    );
  }
  return null;
}

const GITHUB_USERNAME = 'yororoA';
const REFRESH_MS = 60 * 60 * 1000;
const CACHE_KEY = 'github_stats_cache_v2';
const FALLBACK_COLORS = ['#3b82f6', '#60a5fa', '#22c55e', '#f59e0b', '#a855f7'];
const GITHUB_LANG_COLORS = {
  Python: '#3572A5',
  JavaScript: '#f1e05a',
  TypeScript: '#3178c6',
  Vue: '#41b883',
  CSS: '#563d7c',
  HTML: '#e34c26',
  Less: '#1d365d',
  Batchfile: '#c1f12e',
  Shell: '#89e051',
  PHP: '#4f5d95',
  JSON: '#292929',
  Rust: '#dea584',
  Go: '#00ADD8',
  Java: '#b07219',
  C: '#555555',
  'C++': '#f34b7d',
  'C#': '#239120',
  Ruby: '#701516',
  Swift: '#F05138',
  Kotlin: '#A97BFF',
  Scala: '#c22d40',
};

const getLangColor = (name, index) => GITHUB_LANG_COLORS[name] || FALLBACK_COLORS[index % FALLBACK_COLORS.length];

const formatRelativeTime = (iso, locale, t) => {
  if (!iso) return '--';
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now - date;
  const diffM = Math.floor(diffMs / 60000);
  const diffH = Math.floor(diffMs / 3600000);
  const diffD = Math.floor(diffMs / 86400000);
  if (diffM < 1) return t(locale, 'githubJustNow');
  if (diffM < 60) return t(locale, 'githubMinutesAgo', diffM);
  if (diffH < 24) return t(locale, 'githubHoursAgo', diffH);
  if (diffD === 1) return t(locale, 'githubYesterday');
  if (diffD < 7) return t(locale, 'githubDaysAgo', diffD);
  return date.toLocaleString(locale === 'zh' ? 'zh-CN' : locale === 'ja' ? 'ja-JP' : locale === 'de' ? 'de-DE' : 'en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).replace(/\//g, '-');
};

const fetchJson = async (url) => {
  const resp = await fetch(url);
  let body = {};
  try {
    body = await resp.json();
  } catch {
    body = {};
  }
  if (!resp.ok || body?.success === false) {
    throw new Error(body?.message || `API ${resp.status}`);
  }
  return body;
};

const polarToCartesian = (cx, cy, r, angleDeg) => {
  const rad = (Math.PI / 180) * angleDeg;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
};

const PIE_CX = 130;
const PIE_CY = 66;
const PIE_R = 74;
const PIE_R_INNER = 44;
const PIE_VIEWBOX_W = 260;
const PIE_VIEWBOX_Y = -12;
const PIE_VIEWBOX_H = 170;

const describeDonutSegment = (cx, cy, R, r, startDeg, endDeg) => {
  const outerStart = polarToCartesian(cx, cy, R, startDeg);
  const outerEnd = polarToCartesian(cx, cy, R, endDeg);
  const innerEnd = polarToCartesian(cx, cy, r, endDeg);
  const innerStart = polarToCartesian(cx, cy, r, startDeg);
  const angleSpan = endDeg - startDeg;
  const largeArc = angleSpan <= 180 ? 0 : 1;
  const outerSweep = 1;
  const innerSweep = 0;
  return `M ${outerStart.x} ${outerStart.y} A ${R} ${R} 0 ${largeArc} ${outerSweep} ${outerEnd.x} ${outerEnd.y} L ${innerEnd.x} ${innerEnd.y} A ${r} ${r} 0 ${largeArc} ${innerSweep} ${innerStart.x} ${innerStart.y} Z`;
};

const ProfileMiniCard = ({ visible = true, embedded = false, githubOnly = false, className = '' }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { locale, langViewMode, setLangViewMode } = useContext(UiPersistContext);
  const { showSuccess } = useContext(SuccessBoardContext);
  const [stats, setStats] = useState({
    reposCount: 0,
    weekCommits: 0,
    monthCommits: 0,
    lastCommitAt: null,
    languages: [],
  });
  const displayAuthor = t(locale, 'profileAuthor');
  const handleCopyEmail = async () => {
    if (!PROFILE.email) return;
    try {
      await navigator.clipboard.writeText(PROFILE.email);
      showSuccess(t(locale, 'copiedEmail'));
    } catch (_) {}
  };

  useEffect(() => {
    let active = true;
    const load = async () => {
      const cached = sessionStorage.getItem(CACHE_KEY);
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (Date.now() - Number(parsed?.ts || 0) < REFRESH_MS && parsed?.data) {
            setStats(parsed.data);
            setLoading(false);
            return;
          }
        } catch {
          // Ignore broken cache and continue fetching.
        }
      }
      setLoading(true);
      setError('');
      try {
        const apiBase = process.env.REACT_APP_SERVER_HOST || '';
        const result = await fetchJson(
          `${apiBase}/api/github/summary?username=${encodeURIComponent(GITHUB_USERNAME)}`
        );
        const data = result?.data || {};
        if (!active) return;
        setStats({
          reposCount: Number(data.reposCount || 0),
          weekCommits: Number(data.weekCommits || 0),
          monthCommits: Number(data.monthCommits || 0),
          lastCommitAt: data.lastCommitAt || null,
          languages: Array.isArray(data.languages) ? data.languages : [],
        });
        sessionStorage.setItem(
          CACHE_KEY,
          JSON.stringify({
            ts: Date.now(),
            data: {
              reposCount: Number(data.reposCount || 0),
              weekCommits: Number(data.weekCommits || 0),
              monthCommits: Number(data.monthCommits || 0),
              lastCommitAt: data.lastCommitAt || null,
              languages: Array.isArray(data.languages) ? data.languages : [],
            },
          })
        );
      } catch (err) {
        if (!active) return;
        setError(err?.message || 'load failed');
      } finally {
        if (active) setLoading(false);
      }
    };

    load();
    const timer = setInterval(load, REFRESH_MS);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, []);

  const topLanguages = useMemo(() => stats.languages, [stats.languages]);
  const pieSegments = useMemo(() => {
    if (topLanguages.length === 0) return [];
    const total = topLanguages.reduce((sum, lang) => sum + Number(lang.percent || 0), 0);
    const scale = total > 0 ? 100 / total : 0;
    const startAngle = -90;
    const fullCircle = startAngle + 360;
    let cursor = startAngle;
    return topLanguages.map((lang, idx) => {
      const rawPercent = Number(lang.percent || 0);
      const percent = scale > 0 ? rawPercent * scale : 0;
      const angle = (percent / 100) * 360;
      const start = cursor;
      const isLast = idx === topLanguages.length - 1;
      const nextCursor = cursor + angle;
      const end = isLast ? Math.max(nextCursor, fullCircle) : nextCursor;
      cursor = end;
      return {
        ...lang,
        percent,
        color: getLangColor(lang.name, idx),
        start,
        end,
      };
    });
  }, [topLanguages]);
  const donutCenterLabel = useMemo(() => {
    if (pieSegments.length === 0) return null;
    const top = pieSegments[0];
    return { name: top.name, percent: Number(top.percent || 0).toFixed(1) };
  }, [pieSegments]);

  const rootClass = embedded ? styles.embeddedLane : styles.leftLane;
  const stopScrollBubble = useCallback((e) => {
    // Keep side lane scroll independent from DisplayZone main scroll container.
    e.stopPropagation();
  }, []);

  return (
    <aside
      className={`${rootClass}${visible ? '' : ` ${styles.leftLaneHidden}`}${className ? ` ${className}` : ''}`}
      aria-label={t(locale, 'profileSnippet')}
      onWheelCapture={stopScrollBubble}
      onTouchMoveCapture={stopScrollBubble}
    >
      <div className={styles.stack}>
        {!githubOnly && (
          <div className={`${styles.card} page-enter`}>
            <div className={styles.avatarSection}>
              {PROFILE.avatar ? (
                <img src={PROFILE.avatar} alt={displayAuthor} className={styles.avatar} />
              ) : (
                <div className={styles.avatarPlaceholder}>{displayAuthor.charAt(0).toUpperCase()}</div>
              )}
            </div>
            <h3 className={styles.authorName}>{displayAuthor}</h3>
            <p className={styles.description}>{t(locale, 'profileDescription')}</p>
            {PROFILE.email && <p className={styles.email} onClick={handleCopyEmail} title={t(locale, 'copyEmail')}>{PROFILE.email}</p>}
            <div className={styles.links}>
              {SOCIAL_LINKS.map(link => (
                String(link.name || '').toLowerCase().includes('steam') ? (
                  <span key={link.name} className={`${styles.link} ${styles.linkDisabled}`} title={link.name} aria-disabled="true">
                    <span className={styles.linkIcon}>{renderSocialIcon(link.name)}</span>
                  </span>
                ) : (
                  <a
                    key={link.name}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.link}
                    title={link.name}
                  >
                    <span className={styles.linkIcon}>{renderSocialIcon(link.name)}</span>
                  </a>
                )
              ))}
            </div>
          </div>
        )}

        <div className={`${styles.card} ${styles.statsCard} page-enter`}>
          <div className={styles.statsHeader}>
            <span>GitHub</span>
            <div className={styles.statsHeaderRight}>
              <div className={styles.langViewToggle} role="tablist" aria-label={t(locale, 'githubLangViewSwitch')}>
                <button
                  type="button"
                  className={`${styles.langViewBtn}${langViewMode === 'pie' ? ` ${styles.langViewBtnActive}` : ''}`}
                  onClick={() => setLangViewMode('pie')}
                  role="tab"
                  aria-selected={langViewMode === 'pie'}
                >
                  {t(locale, 'githubLangPie')}
                </button>
                <button
                  type="button"
                  className={`${styles.langViewBtn}${langViewMode === 'bar' ? ` ${styles.langViewBtnActive}` : ''}`}
                  onClick={() => setLangViewMode('bar')}
                  role="tab"
                  aria-selected={langViewMode === 'bar'}
                >
                  {t(locale, 'githubLangBar')}
                </button>
              </div>
              <a href={`https://github.com/${GITHUB_USERNAME}`} target="_blank" rel="noopener noreferrer">
                @{GITHUB_USERNAME}
              </a>
            </div>
          </div>

          {loading ? (
            <p className={styles.statsHint}>{t(locale, 'githubSyncing')}</p>
          ) : error ? (
            <p className={styles.statsHint}>{t(locale, 'githubSyncFailed', error)}</p>
          ) : (
            <>
              <div className={styles.metrics}>
                <div className={styles.metricItem}>
                  <strong>{stats.weekCommits}</strong>
                  <span>{t(locale, 'githubWeekCommits')}</span>
                </div>
                <div className={styles.metricItem}>
                  <strong>{stats.monthCommits}</strong>
                  <span>{t(locale, 'githubMonthCommits')}</span>
                </div>
                <div className={styles.metricItem}>
                  <strong>{stats.reposCount}</strong>
                  <span>{t(locale, 'githubRepoCount')}</span>
                </div>
              </div>

              <p className={styles.statsHint}>{t(locale, 'githubLastCommit', formatRelativeTime(stats.lastCommitAt, locale, t))}</p>

              <div className={styles.langList}>
                {topLanguages.length === 0 ? (
                  <p className={styles.statsHint}>{t(locale, 'githubNoLangData')}</p>
                ) : (
                  <div className={styles.langViewStage}>
                    <div
                      className={`${styles.langPane} ${styles.langPanePie} ${langViewMode === 'pie' ? styles.langPaneActive : styles.langPaneHidden}`}
                      aria-hidden={langViewMode !== 'pie'}
                    >
                      <div className={styles.pieWrap}>
                        <svg viewBox={`0 ${PIE_VIEWBOX_Y} ${PIE_VIEWBOX_W} ${PIE_VIEWBOX_H}`} className={styles.pieSvg} role="img" aria-label={t(locale, 'githubLangDonutAria')}>
                          {pieSegments.length === 1 ? (
                            <path
                              d={describeDonutSegment(PIE_CX, PIE_CY, PIE_R, PIE_R_INNER, -90, 270)}
                              fill={pieSegments[0].color}
                              className={styles.pieSlice}
                              title={`${pieSegments[0].name} ${Number(pieSegments[0].percent || 0).toFixed(1)}%`}
                            />
                          ) : (
                            pieSegments.map((segment) => (
                              <path
                                key={segment.name}
                                d={describeDonutSegment(PIE_CX, PIE_CY, PIE_R, PIE_R_INNER, segment.start, segment.end)}
                                fill={segment.color}
                                className={styles.pieSlice}
                                title={`${segment.name} ${Number(segment.percent || 0).toFixed(1)}%`}
                              />
                            ))
                          )}
                          {donutCenterLabel && (
                            <text x={PIE_CX} y={PIE_CY - 6} textAnchor="middle" className={styles.donutCenterName}>
                              {donutCenterLabel.name}
                            </text>
                          )}
                          {donutCenterLabel && (
                            <text x={PIE_CX} y={PIE_CY + 10} textAnchor="middle" className={styles.donutCenterPercent}>
                              {donutCenterLabel.percent}%
                            </text>
                          )}
                        </svg>
                      </div>
                      {topLanguages.length > 0 && (
                        <div className={styles.pieLegend}>
                          {topLanguages.slice(0, 6).map((lang, idx) => (
                            <span key={lang.name} className={styles.pieLegendItem}>
                              <i style={{ background: getLangColor(lang.name, idx) }} />
                              {lang.name}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div
                      className={`${styles.langPane} ${styles.langPaneBar} ${langViewMode === 'bar' ? styles.langPaneActive : styles.langPaneHidden}`}
                      aria-hidden={langViewMode !== 'bar'}
                    >
                      <div className={styles.barWrap}>
                        {topLanguages.map((lang, idx) => (
                          <div key={lang.name} className={styles.barRow}>
                            <span className={styles.barLabel}>{lang.name}</span>
                            <div className={styles.barTrack}>
                              <i
                                style={{
                                  width: `${Math.max(Number(lang.percent || 0), 2)}%`,
                                  background: getLangColor(lang.name, idx),
                                }}
                              />
                            </div>
                            <span className={styles.barPercent}>{Number(lang.percent || 0).toFixed(1)}%</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </aside>
  );
};

export default ProfileMiniCard;
