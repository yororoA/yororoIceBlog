import React, { useContext, useEffect, useMemo, useState } from 'react';
import styles from './profileMiniCard.module.less';
import { PROFILE, SOCIAL_LINKS } from './profileInfo';
import { UiPersistContext } from '../context/uiPersistContext';
import { t } from '../../../i18n/uiText';
import { SuccessBoardContext } from '../../../components/ui/pop/status/successBoardContext';

const GITHUB_USERNAME = 'yororoA';
const REFRESH_MS = 60 * 60 * 1000;
const CACHE_KEY = 'github_stats_cache_v2';
const PIE_COLORS = ['#3b82f6', '#60a5fa', '#22c55e', '#f59e0b', '#a855f7'];

const formatTime = (iso, locale) => {
  if (!iso) return '--';
  return new Date(iso).toLocaleString(locale === 'zh' ? 'zh-CN' : 'en-US', { hour12: false });
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
const PIE_VIEWBOX_W = 260;
const PIE_VIEWBOX_Y = -12; // 圆顶约 66-74=-8，留边距避免裁切
const PIE_VIEWBOX_H = 170; // 原 146 导致顶部被裁，改为包含整圆

const ProfileMiniCard = ({ visible = true }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [hoveredLang, setHoveredLang] = useState(null);
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
        color: PIE_COLORS[idx % PIE_COLORS.length],
        start,
        end,
      };
    });
  }, [topLanguages]);
  const hoveredGuide = useMemo(() => {
    if (!hoveredLang) return null;
    const mid = (hoveredLang.start + hoveredLang.end) / 2;
    const p1 = polarToCartesian(PIE_CX, PIE_CY, PIE_R + 2, mid);
    const p2 = polarToCartesian(PIE_CX, PIE_CY, PIE_R + 12, mid);
    const isRight = Math.cos((Math.PI / 180) * mid) >= 0;
    const vbMaxY = PIE_VIEWBOX_Y + PIE_VIEWBOX_H;
    const y = Math.max(14, Math.min(vbMaxY - 14, p2.y));
    const p3 = { x: isRight ? 246 : 14, y };
    const label = `${hoveredLang.name} ${Number(hoveredLang.percent || 0).toFixed(1)}%`;
    const boxW = Math.max(72, Math.ceil(label.length * 7.2 + 14));
    const rawBoxX = isRight ? p3.x + 6 : p3.x - boxW - 6;
    const boxX = Math.max(4, Math.min(PIE_VIEWBOX_W - boxW - 4, rawBoxX));
    const boxY = Math.max(4, Math.min(vbMaxY - 24, y - 12));
    const labelX = boxX + boxW / 2;
    const labelY = boxY + 12;
    return {
      p1,
      p2,
      p3,
      boxX,
      boxY,
      boxW,
      labelX,
      labelY,
      label,
    };
  }, [hoveredLang]);

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
            <a href={`https://github.com/${GITHUB_USERNAME}`} target="_blank" rel="noopener noreferrer">
              @{GITHUB_USERNAME}
            </a>
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

              <p className={styles.statsHint}>{t(locale, 'githubLastCommit', formatTime(stats.lastCommitAt, locale))}</p>

              <div className={styles.langList}>
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
                {topLanguages.length === 0 ? (
                  <p className={styles.statsHint}>{t(locale, 'githubNoLangData')}</p>
                ) : (
                  <div className={styles.langViewStage}>
                    <div
                      className={`${styles.langPane} ${styles.langPanePie} ${langViewMode === 'pie' ? styles.langPaneActive : styles.langPaneHidden}`}
                      aria-hidden={langViewMode !== 'pie'}
                    >
                      <div className={styles.pieWrap}>
                        <svg viewBox={`0 ${PIE_VIEWBOX_Y} ${PIE_VIEWBOX_W} ${PIE_VIEWBOX_H}`} className={styles.pieSvg} role="img" aria-label="GitHub language distribution pie chart">
                          {pieSegments.length === 1 ? (
                            <circle
                              cx={PIE_CX}
                              cy={PIE_CY}
                              r={PIE_R}
                              fill={pieSegments[0].color}
                              className={styles.pieSlice}
                              onMouseEnter={() => setHoveredLang(pieSegments[0])}
                              onMouseLeave={() => setHoveredLang(null)}
                            />
                          ) : (
                            pieSegments.map((segment) => (
                              <path
                                key={segment.name}
                                d={describeArc(PIE_CX, PIE_CY, PIE_R, segment.start, segment.end)}
                                fill={segment.color}
                                className={styles.pieSlice}
                                onMouseEnter={() => setHoveredLang(segment)}
                                onMouseLeave={() => setHoveredLang(null)}
                              />
                            ))
                          )}
                          {hoveredGuide && langViewMode === 'pie' && (
                            <g className={styles.pieGuide}>
                              <polyline
                                points={`${hoveredGuide.p1.x},${hoveredGuide.p1.y} ${hoveredGuide.p2.x},${hoveredGuide.p2.y} ${hoveredGuide.p3.x},${hoveredGuide.p3.y}`}
                              />
                              <rect
                                x={hoveredGuide.boxX}
                                y={hoveredGuide.boxY}
                                width={hoveredGuide.boxW}
                                height="24"
                                rx="6"
                              />
                              <text x={hoveredGuide.labelX} y={hoveredGuide.labelY} textAnchor="middle">
                                {hoveredGuide.label}
                              </text>
                            </g>
                          )}
                        </svg>
                      </div>
                    </div>

                    <div
                      className={`${styles.langPane} ${styles.langPaneBar} ${langViewMode === 'bar' ? styles.langPaneActive : styles.langPaneHidden}`}
                      aria-hidden={langViewMode !== 'bar'}
                    >
                      <div className={styles.barWrap}>
                        {topLanguages.map((lang, idx) => (
                          <div key={lang.name} className={styles.barRow}>
                            <div className={styles.barHead}>
                              <span>{lang.name}</span>
                              <span>{Number(lang.percent || 0).toFixed(1)}%</span>
                            </div>
                            <div className={styles.barTrack}>
                              <i
                                style={{
                                  width: `${Math.max(Number(lang.percent || 0), 2)}%`,
                                  background: PIE_COLORS[idx % PIE_COLORS.length],
                                }}
                              />
                            </div>
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
