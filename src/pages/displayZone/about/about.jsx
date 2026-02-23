import React, { useCallback, useContext, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import about from './about.module.less';
import adminImg from '../../../assets/images/admin.png';
import binesImg from '../../../assets/images/bines.png';
import { postGuestbookComment } from '../../../utils/guestbook';
import { GuestbookContext } from '../context/guestbookContext';
import { isGuest } from '../../../utils/auth';
import { getAvatarColor } from '../../../utils/avatarColor';
import { formatDateTime } from '../../../utils/formatDateTime';
import { UiPersistContext } from '../context/uiPersistContext';
import { t } from '../../../i18n/uiText';
import { PROFILE } from '../shared/profileInfo';
import { SuccessBoardContext } from '../../../components/ui/pop/status/successBoardContext';

const ADMIN_UIDS = ['u_mg94ixwg_df9ff1a129ad44a6', 'u_mg94t4ce_6485ab4d88f2f8db'];
const BINES_UID = 'u_mlkpl8fl_52a3d8c2068b281a';


// Links (static)
// 支持格式：
// 1. 纯文字链接: { name: 'Example Blog', url: 'https://example.com', category: 'friend' }
// 2. 带图片链接: { name: 'Example Blog', url: 'https://example.com', image: '/path/to/image.png', category: 'friend' }
// 3. 可选 description: { name: '...', url: '...', description: '简短说明', category: '...' }
// 4. 工具/开发/其他: category 为 'tool' | 'development' | 'other'
// category: 'friend' | 'tool' | 'development' | 'other'，默认为 'friend'
const LINKS = [
  // { name: 'Example Blog', url: 'https://example.com', category: 'friend' },
  // { name: 'Tech Corner', url: 'https://example2.com', image: '/path/to/logo.png', category: 'friend' },
  // { name: 'Useful Tool', url: 'https://tool.com', category: 'tool' },
  // { name: 'Other Link', url: 'https://other.com', category: 'other' },
  { name: 'Vocu Ai', description: '小样本语音克隆及音色转换', url: 'https://www.vocu.ai', image: 'https://www.vocu.ai/favicon.ico', category: 'other' },
  { name: 'Vercel', description: '前端网站部署', url: 'https://vercel.com', image: 'https://www.vercel.com/favicon.ico', category: 'development' },
  { name: 'Render', description: '后端网站部署', url: 'https://render.com', image: 'https://ts3.tc.mm.bing.net/th/id/ODF.rtcYxUnBRdAMKi7zNULYxw?w=32&h=32&qlt=90&pcl=fffffa&o=6&pid=1.2', category: 'development' },
  { name: 'Cloudinary', description: '图片存储', image: 'https://res.cloudinary.com/prod/image/upload/w_32/console/favicon.png', url: 'https://cloudinary.com', category: 'development' },
  { name: 'Upstash', description: 'redis缓存', image: 'https://console.upstash.com/static/icons/favicon-32x32.png', url: 'https://upstash.com', category: 'development' },
  { name: 'MongoDB', description: '数据库', image: 'https://www.mongodb.com/favicon.ico', url: 'https://www.mongodb.com', category: 'development' },
  { name: 'Cloudflare', description: 'CDN加速', image: 'https://dash.cloudflare.com/c411dbca6e493cdb.svg', url: 'https://developers.cloudflare.com', category: 'development' },
  { name: 'SubExtractor', description: '视频硬编码字幕提取', url: 'https://subextractor.com', image: 'https://www.subextractor.com/logo.png', category: 'tool' },
  { name: 'Split Image', description: '图片分割 (广告太多了, 用着有点烦)', url: 'https://splitimage.app/favicon.ico', iamge: 'https://splitimage.app/favicon.ico', category: 'tool' },
  { name: 'IMGONLINE.TOOLS', description: '滤镜/图像转换/图像处理/删除颜色', url: 'https://imgonline.tools/zh/remove-color#google_vignette', image: 'https://imgonline.tools/icon.png', category: 'tool' },
  { name: 'Change Image Color', description: '图片颜色替换', url: 'https://changeimagecolor.net/zh/color-replace', image: 'https://changeimagecolor.net/logo.png', category: 'tool' },
  { name: 'Vocal Remover', description: '去人声/音频分离/变调/音频剪辑/音频合并', url: 'https://vocalremover.org/zh/', image: 'https://vocalremover.org/favicon.ico', category: 'tool' },
  { name: 'FreeConvert', description: '一个有好多种文件处理工具的网站', url: 'https://www.freeconvert.com/zh', image: 'https://www.freeconvert.com/favicon.ico', category: 'tool' },
];

const CATEGORY_ORDER = ['friend', 'tool', 'development', 'other'];

/** 生成随机字母串，用于游客未填名称时的默认用户名 */
function randomLetterUsername(length = 8) {
  const letters = 'abcdefghijklmnopqrstuvwxyz';
  return Array.from({ length }, () => letters[Math.floor(Math.random() * letters.length)]).join('');
}

const About = () => {
  const {
    locale,
    linksExpanded,
    setLinksExpanded,
    guestbookExpanded,
    setGuestbookExpanded,
    linksSelectedCategory: selectedCategory,
    setLinksSelectedCategory: setSelectedCategory,
  } = React.useContext(UiPersistContext);
  const { showSuccess } = React.useContext(SuccessBoardContext);
  const categoryLabels = {
    friend: t(locale, 'friendLinks'),
    tool: t(locale, 'toolLinks'),
    development: t(locale, 'development'),
    other: t(locale, 'other'),
  };
  // ── Guestbook：列表来自 Context（DisplayZone 初始拉取 + SSE 更新），本地只管表单与提交
  const [comments, setGuestbookComments] = useContext(GuestbookContext);
  const [newComment, setNewComment] = useState('');
  const [guestName, setGuestName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [fadeInId, setFadeInId] = useState(null);
  const prevCommentsLenRef = useRef(comments.length);

  const [linksVisible, setLinksVisible] = useState(false);
  const [gbVisible, setGbVisible] = useState(false);
  const linksRef = useRef(null);
  const gbRef = useRef(null);
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    if (searchParams.get('scroll') !== 'guestbook') return;
    const t = setTimeout(() => {
      gbRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      const next = new URLSearchParams(searchParams);
      next.delete('scroll');
      setSearchParams(next, { replace: true });
    }, 100);
    return () => clearTimeout(t);
  }, [searchParams, setSearchParams]);

  useLayoutEffect(() => {
    const pairs = [
      [linksRef.current, setLinksVisible],
      [gbRef.current, setGbVisible],
    ];
    const observers = [];
    for (const [el, setVis] of pairs) {
      if (!el) { setVis(true); continue; }
      const { top, bottom } = el.getBoundingClientRect();
      if (top < window.innerHeight && bottom > 0) {
        setVis(true);
        continue;
      }
      const obs = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setVis(true);
            obs.unobserve(el);
          }
        },
        { threshold: 0.1 },
      );
      obs.observe(el);
      observers.push(obs);
    }
    return () => observers.forEach(o => o.disconnect());
  }, []);

  const firstCommentId = comments[0]?._id;
  useEffect(() => {
    if (comments.length > prevCommentsLenRef.current && firstCommentId) {
      setFadeInId(firstCommentId);
      prevCommentsLenRef.current = comments.length;
      const t = setTimeout(() => setFadeInId(null), 600);
      return () => clearTimeout(t);
    }
    prevCommentsLenRef.current = comments.length;
  }, [comments.length, firstCommentId]);

  const handleCopyEmail = useCallback(async (e) => {
    e.stopPropagation();
    if (!PROFILE.email) return;
    try {
      await navigator.clipboard.writeText(PROFILE.email);
      showSuccess(t(locale, 'copiedEmail'));
    } catch (_) { }
  }, [locale, showSuccess]);

  const handleCopySiteLink = useCallback(async (e) => {
    e.stopPropagation();
    const siteUrl = `https://www.yororoice.top`;
    try {
      await navigator.clipboard.writeText(siteUrl);
      showSuccess(t(locale, 'copiedSiteLink'));
    } catch (_) { }
  }, [locale, showSuccess]);

  const handlePostComment = useCallback(async () => {
    if (!newComment.trim() || submitting) return;
    setSubmitting(true);
    try {
      // 游客模式下：有填名称用名称，未填则用随机字母串
      const username = isGuest()
        ? (guestName.trim() || randomLetterUsername())
        : undefined;
      const result = await postGuestbookComment(newComment.trim(), username);
      if (result.success && result.data) {
        setGuestbookComments(prev => [result.data, ...prev]);
        setNewComment('');
        setGuestName(''); // 清空游客名称
      }
    } catch (err) {
      console.error('Post guestbook comment failed:', err);
    } finally {
      setSubmitting(false);
    }
  }, [newComment, guestName, submitting, setGuestbookComments]);

  return (
    <div className="page-enter">
      <section id="header">
        <span>{t(locale, 'pageOtherTitle')}</span>
      </section>
      <div className={about.container}>
        {/* Links */}
        <div ref={linksRef} className={`${about.linksCard}${linksVisible ? ` ${about.cardVisible}` : ''}`}>
          <div className={about.cardHeader} onClick={() => setLinksExpanded(!linksExpanded)}>
            <div className={about.cardHeaderLeft}>
              <h3 className={about.cardTitle}>{t(locale, 'linksTitle')}</h3>
              <div className={about.cardHeaderActions}>
                <button type="button" className={about.headerActionBtn} onClick={handleCopyEmail}>{t(locale, 'copyEmail')}</button>
                <button type="button" className={about.headerActionBtn} onClick={handleCopySiteLink}>{t(locale, 'copySiteLink')}</button>
              </div>
            </div>
            <span className={about.toggleIcon} aria-hidden>
              <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3.5 6L8 10.5L12.5 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
          </div>
          <div className={`${about.expandableContent} ${linksExpanded ? about.expanded : about.collapsed}`}>
            <div className={about.expandableContentInner}>
              <p className={about.linkTip}>{t(locale, 'linksTip')}</p>
              {/* 分类标签 */}
              <div className={about.categoryTabs}>
                <button
                  className={`${about.categoryTab} ${selectedCategory === 'all' ? about.categoryTabActive : ''}`}
                  onClick={() => setSelectedCategory('all')}
                >
                  {t(locale, 'allCategories')}
                </button>
                <button
                  className={`${about.categoryTab} ${selectedCategory === 'friend' ? about.categoryTabActive : ''}`}
                  onClick={() => setSelectedCategory('friend')}
                >
                  {t(locale, 'friendLinks')}
                </button>
                <button
                  className={`${about.categoryTab} ${selectedCategory === 'tool' ? about.categoryTabActive : ''}`}
                  onClick={() => setSelectedCategory('tool')}
                >
                  {t(locale, 'toolLinks')}
                </button>
                <button
                  className={`${about.categoryTab} ${selectedCategory === 'development' ? about.categoryTabActive : ''}`}
                  onClick={() => setSelectedCategory('development')}
                >
                  {t(locale, 'development')}
                </button>
                <button
                  className={`${about.categoryTab} ${selectedCategory === 'other' ? about.categoryTabActive : ''}`}
                  onClick={() => setSelectedCategory('other')}
                >
                  {t(locale, 'other')}
                </button>
              </div>
              {/* 链接列表：All 时按类型分栏，否则单列表 */}
              <div className={about.linksList}>
                {(() => {
                  const renderLinkCard = (link, idx) => (
                    <a
                      key={idx}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={link.image ? about.linkWithImage : about.link}
                      title={link.name}
                    >
                      {link.image && (
                        <img
                          src={link.image}
                          alt={link.name}
                          className={about.linkImage}
                          onError={(e) => {
                            e.target.style.display = 'none';
                          }}
                        />
                      )}
                      {link.description ? (
                        <span className={about.linkTextWrap}>
                          <span className={about.linkName}>{link.name}</span>
                          <span className={about.linkDescription}>{link.description}</span>
                        </span>
                      ) : (
                        <span className={about.linkName}>{link.name}</span>
                      )}
                    </a>
                  );

                  if (selectedCategory === 'all') {
                    const grouped = {};
                    LINKS.forEach(link => {
                      const cat = link.category || 'friend';
                      if (!grouped[cat]) grouped[cat] = [];
                      grouped[cat].push(link);
                    });
                    const sections = CATEGORY_ORDER.filter(cat => grouped[cat]?.length > 0);
                    if (sections.length === 0) {
                      return <p className={about.linksEmpty}>{t(locale, 'noLinksYet')}</p>;
                    }
                    return (
                      <div className={about.linksByCategory}>
                        {sections.map(cat => (
                          <section key={cat} className={about.linksCategorySection}>
                            <h4 className={about.linksCategoryHeading}>
                              {categoryLabels[cat]} ({grouped[cat].length})
                            </h4>
                            <div className={about.linksCategoryGrid}>
                              {grouped[cat].map((link, idx) => renderLinkCard(link, idx))}
                            </div>
                          </section>
                        ))}
                      </div>
                    );
                  }

                  const filteredLinks = LINKS.filter(link => {
                    const category = link.category || 'friend';
                    return category === selectedCategory;
                  });
                  if (filteredLinks.length === 0) {
                    return <p className={about.linksEmpty}>{t(locale, 'noLinksYet')}</p>;
                  }
                  return filteredLinks.map((link, idx) => renderLinkCard(link, idx));
                })()}
              </div>
            </div>
          </div>
        </div>

        {/* Guestbook */}
        <div ref={gbRef} className={`${about.guestbookCard}${gbVisible ? ` ${about.cardVisible}` : ''}`}>
          <div className={about.cardHeader} onClick={() => setGuestbookExpanded(!guestbookExpanded)}>
            <h3 className={about.cardTitle}>{t(locale, 'guestbookTitle')}</h3>
            <span className={about.toggleIcon} aria-hidden>
              <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3.5 6L8 10.5L12.5 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
          </div>
          <div className={`${about.expandableContent} ${guestbookExpanded ? about.expanded : about.collapsed}`}>
            <div className={about.expandableContentInner}>
              <div className={about.guestbookForm}>
                <input
                  type="text"
                  className={about.guestbookNameInput}
                  placeholder={t(locale, 'yourNameOptional')}
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                />
                <textarea
                  className={about.guestbookInput}
                  placeholder={t(locale, 'leaveMessage')}
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  rows={3}
                />
                <button
                  className={about.guestbookSubmit}
                  onClick={handlePostComment}
                  disabled={submitting || !newComment.trim()}
                >
                  {submitting ? t(locale, 'posting') : t(locale, 'post')}
                </button>
              </div>
              <div className={about.guestbookList}>
                {comments.length === 0 ? (
                  <p className={about.guestbookEmpty}>{t(locale, 'noMessagesYet')}</p>
                ) : (
                  comments.map(c => (
                    <div
                      key={c._id}
                      className={`${about.guestbookItem}${fadeInId === c._id ? ` ${about.guestbookItemFadeIn}` : ''}`}
                    >
                      {ADMIN_UIDS.includes(c.uid) ? (
                        <img src={adminImg} alt={c.username} className={about.guestbookAvatarImg} />
                      ) : c.uid === BINES_UID ? (
                        <img src={binesImg} alt={c.username} className={about.guestbookAvatarImg} />
                      ) : (
                        <div className={about.guestbookAvatar} style={{ backgroundColor: getAvatarColor(c.uid) }}>
                          {c.username?.charAt(0).toUpperCase() || '?'}
                        </div>
                      )}
                      <div className={about.guestbookBody}>
                        <div className={about.guestbookMeta}>
                          <span className={about.guestbookUsername}>{c.username}</span>
                          <span className={about.guestbookDate}>{formatDateTime(c.createdAt)}</span>
                        </div>
                        <p className={about.guestbookText}>{c.content}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;
