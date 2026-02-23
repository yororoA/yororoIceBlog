import React, { useContext, useEffect, useMemo, useState } from 'react';
import styles from './profileMiniCard.module.less';
import { PROFILE, SOCIAL_LINKS } from './profileInfo';
import { UiPersistContext } from '../context/uiPersistContext';
import { t } from '../../../i18n/uiText';
import { SuccessBoardContext } from '../../../components/ui/pop/status/successBoardContext';

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
  return date.toLocaleString(locale === 'zh' ? 'zh-CN' : 'en-US', {
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

const describeArc = (cx, cy, r, startDeg, endDeg) => {
  const start = polarToCartesian(cx, cy, r, endDeg);
  const end = polarToCartesian(cx, cy, r, startDeg);
  const largeArcFlag = endDeg - startDeg <= 180 ? '0' : '1';
  return `M ${cx} ${cy} L ${start.x} ${start.y} A ${r} ${r} 0 ${largeArcFlag} 0 ${end.x} ${end.y} Z`;
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

const ProfileMiniCard = ({ visible = true }) => {
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

  return (
    <aside className={`${styles.leftLane}${visible ? '' : ` ${styles.leftLaneHidden}`}`} aria-label="profile snippet">
      <div className={styles.stack}>
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
              <a
                key={link.name}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.link}
                title={link.name}
              >
                {link.name}
              </a>
            ))}
          </div>
        </div>

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
                        <svg viewBox={`0 ${PIE_VIEWBOX_Y} ${PIE_VIEWBOX_W} ${PIE_VIEWBOX_H}`} className={styles.pieSvg} role="img" aria-label="GitHub language distribution donut chart">
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
