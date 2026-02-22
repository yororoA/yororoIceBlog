import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import about from './about.module.less';
import adminImg from '../../../assets/images/admin.png';
import binesImg from '../../../assets/images/bines.png';
import { getGuestbookComments, postGuestbookComment } from '../../../utils/guestbook';
import { isGuest } from '../../../utils/auth';
import { getAvatarColor } from '../../../utils/avatarColor';
import { formatDateTime } from '../../../utils/formatDateTime';
import { UiPersistContext } from '../context/uiPersistContext';

const ADMIN_UIDS = ['u_mg94ixwg_df9ff1a129ad44a6', 'u_mg94t4ce_6485ab4d88f2f8db'];
const BINES_UID = 'u_mlkpl8fl_52a3d8c2068b281a';


// Links (static)
// 支持格式：
// 1. 纯文字链接: { name: 'Example Blog', url: 'https://example.com', category: 'friend' }
// 2. 带图片链接: { name: 'Example Blog', url: 'https://example.com', image: '/path/to/image.png', category: 'friend' }
// 3. 工具链接: { name: 'Tool Name', url: 'https://tool.com', category: 'tool' }
// 4. 开发相关: { name: 'Dev Link', url: 'https://dev.com', category: 'development' }
// 5. 其他链接: { name: 'Other Link', url: 'https://other.com', category: 'other' }
// category: 'friend' | 'tool' | 'development' | 'other'，默认为 'friend'
const LINKS = [
  // { name: 'Example Blog', url: 'https://example.com', category: 'friend' },
  // { name: 'Tech Corner', url: 'https://example2.com', image: '/path/to/logo.png', category: 'friend' },
  // { name: 'Useful Tool', url: 'https://tool.com', category: 'tool' },
  // { name: 'Other Link', url: 'https://other.com', category: 'other' },
  {name: 'Vocu Ai', url:'https://www.vocu.ai', image: 'https://www.vocu.ai/favicon.ico', category: 'other'},
  {name: 'Vercel', url:'https://vercel.com', image: 'https://www.vercel.com/favicon.ico', category: 'development'},
  {name: 'Render', url:'https://render.com', image: 'https://ts3.tc.mm.bing.net/th/id/ODF.rtcYxUnBRdAMKi7zNULYxw?w=32&h=32&qlt=90&pcl=fffffa&o=6&pid=1.2', category: 'development'},
  {name:'Cloudinary', image:'https://res.cloudinary.com/prod/image/upload/w_32/console/favicon.png', url:'https://cloudinary.com', category: 'development'},
  {name:'Upstash', image:'https://console.upstash.com/static/icons/favicon-32x32.png', url:'https://upstash.com', category: 'development'},
  {name:'MongoDB', image:'https://www.mongodb.com/favicon.ico', url:'https://www.mongodb.com', category: 'development'},
  {name:'Cloudflare', image:'https://dash.cloudflare.com/c411dbca6e493cdb.svg', url:'https://developers.cloudflare.com', category: 'development'},
];

const CATEGORY_LABELS = {
  friend: 'Friend Links',
  tool: 'Tool Links',
  development: 'Development',
  other: 'Other',
};
const CATEGORY_ORDER = ['friend', 'tool', 'development', 'other'];

/** 生成随机字母串，用于游客未填名称时的默认用户名 */
function randomLetterUsername(length = 8) {
  const letters = 'abcdefghijklmnopqrstuvwxyz';
  return Array.from({ length }, () => letters[Math.floor(Math.random() * letters.length)]).join('');
}

const About = () => {
  const {
    linksExpanded,
    setLinksExpanded,
    guestbookExpanded,
    setGuestbookExpanded,
    linksSelectedCategory: selectedCategory,
    setLinksSelectedCategory: setSelectedCategory,
  } = React.useContext(UiPersistContext);
  // ── Guestbook state ──
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [guestName, setGuestName] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [linksVisible, setLinksVisible] = useState(false);
  const [gbVisible, setGbVisible] = useState(false);
  const linksRef = useRef(null);
  const gbRef = useRef(null);

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

  useEffect(() => {
    getGuestbookComments().then(setComments).catch(() => {});
  }, []);

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
        setComments(prev => [result.data, ...prev]);
        setNewComment('');
        setGuestName(''); // 清空游客名称
      }
    } catch (err) {
      console.error('Post guestbook comment failed:', err);
    } finally {
      setSubmitting(false);
    }
  }, [newComment, guestName, submitting]);

  return (
    <div className="page-enter">
      <section id="header">
        <span>Links & Guestbook</span>
      </section>
      <div className={about.container}>
        {/* Links */}
        <div ref={linksRef} className={`${about.linksCard}${linksVisible ? ` ${about.cardVisible}` : ''}`}>
          <div className={about.cardHeader} onClick={() => setLinksExpanded(!linksExpanded)}>
            <h3 className={about.cardTitle}>Links</h3>
            <span className={about.toggleIcon} aria-hidden>
              <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3.5 6L8 10.5L12.5 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
          </div>
          <div className={`${about.expandableContent} ${linksExpanded ? about.expanded : about.collapsed}`}>
            <div className={about.expandableContentInner}>
            <p className={about.linkTip}>To add your link, please email me and add this site to your blogroll first.</p>
              {/* 分类标签 */}
              <div className={about.categoryTabs}>
                <button
                  className={`${about.categoryTab} ${selectedCategory === 'all' ? about.categoryTabActive : ''}`}
                  onClick={() => setSelectedCategory('all')}
                >
                  All Categories
                </button>
                <button
                  className={`${about.categoryTab} ${selectedCategory === 'friend' ? about.categoryTabActive : ''}`}
                  onClick={() => setSelectedCategory('friend')}
                >
                  Friend Links
                </button>
                <button
                  className={`${about.categoryTab} ${selectedCategory === 'tool' ? about.categoryTabActive : ''}`}
                  onClick={() => setSelectedCategory('tool')}
                >
                  Tool Links
                </button>
                <button
                  className={`${about.categoryTab} ${selectedCategory === 'development' ? about.categoryTabActive : ''}`}
                  onClick={() => setSelectedCategory('development')}
                >
                  Development
                </button>
                <button
                  className={`${about.categoryTab} ${selectedCategory === 'other' ? about.categoryTabActive : ''}`}
                  onClick={() => setSelectedCategory('other')}
                >
                  Other
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
                      <span className={about.linkName}>{link.name}</span>
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
                      return <p className={about.linksEmpty}>No links yet</p>;
                    }
                    return (
                      <div className={about.linksByCategory}>
                        {sections.map(cat => (
                          <section key={cat} className={about.linksCategorySection}>
                            <h4 className={about.linksCategoryHeading}>
                              {CATEGORY_LABELS[cat]} ({grouped[cat].length})
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
                    return <p className={about.linksEmpty}>No links yet</p>;
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
            <h3 className={about.cardTitle}>Guestbook</h3>
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
                  placeholder="Your name (optional)"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                />
                <textarea
                  className={about.guestbookInput}
                  placeholder="Leave a message..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  rows={3}
                />
                <button
                  className={about.guestbookSubmit}
                  onClick={handlePostComment}
                  disabled={submitting || !newComment.trim()}
                >
                  {submitting ? 'Posting...' : 'Post'}
                </button>
              </div>
              <div className={about.guestbookList}>
                {comments.length === 0 ? (
                  <p className={about.guestbookEmpty}>No messages yet</p>
                ) : (
                  comments.map(c => (
                    <div key={c._id} className={about.guestbookItem}>
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
