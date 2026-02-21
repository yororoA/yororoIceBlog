import React, { useCallback, useEffect, useState } from 'react';
import about from './about.module.less';
import adminImg from '../../../assets/images/admin.png';
import binesImg from '../../../assets/images/bines.png';
import { getGuestbookComments, postGuestbookComment } from '../../../utils/guestbook';
import { isGuest } from '../../../utils/auth';
import { getAvatarColor } from '../../../utils/avatarColor';
import { formatDateTime } from '../../../utils/formatDateTime';

const ADMIN_UIDS = ['u_mg94ixwg_df9ff1a129ad44a6', 'u_mg94t4ce_6485ab4d88f2f8db'];
const BINES_UID = 'u_mlkpl8fl_52a3d8c2068b281a';

// ── Static configuration ──
const PROFILE = {
  author: 'yororoIce',
};

const BLOG_INFO = {
  since: '2024',
  license: 'CC BY-NC-SA 4.0',
};

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

const About = () => {
  // ── Guestbook state ──
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [guestName, setGuestName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [linksExpanded, setLinksExpanded] = useState(true);
  const [guestbookExpanded, setGuestbookExpanded] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all'); // 'all', 'friend', 'tool', 'development', 'other'

  useEffect(() => {
    getGuestbookComments().then(setComments).catch(() => {});
  }, []);

  const handlePostComment = useCallback(async () => {
    if (!newComment.trim() || submitting) return;
    setSubmitting(true);
    try {
      // 游客模式下，如果提供了name，则使用该name
      const username = isGuest() && guestName.trim() ? guestName.trim() : undefined;
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
    <>
      <section id="header">
        <span>Other</span>
      </section>


      <div className={about.container}>
        {/* Links */}
        <div className={about.linksCard}>
          <div className={about.cardHeader} onClick={() => setLinksExpanded(!linksExpanded)}>
            <h3 className={about.cardTitle}>Links</h3>
            <span className={about.toggleIcon}>{linksExpanded ? '▼' : '▶'}</span>
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
              {/* 链接列表 */}
              <div className={about.linksList}>
                {(() => {
                  const filteredLinks = selectedCategory === 'all' 
                    ? LINKS 
                    : LINKS.filter(link => {
                        const category = link.category || 'friend';
                        if (selectedCategory === 'friend') return category === 'friend';
                        if (selectedCategory === 'tool') return category === 'tool';
                        if (selectedCategory === 'development') return category === 'development';
                        if (selectedCategory === 'other') return category === 'other';
                        return false;
                      });
                  
                  if (filteredLinks.length === 0) {
                    return <p className={about.linksEmpty}>No links yet</p>;
                  }
                  
                  return filteredLinks.map((link, idx) => (
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
                  ));
                })()}
              </div>
            </div>
          </div>
        </div>

        {/* Guestbook */}
        <div className={about.guestbookCard}>
          <div className={about.cardHeader} onClick={() => setGuestbookExpanded(!guestbookExpanded)}>
            <h3 className={about.cardTitle}>Guestbook</h3>
            <span className={about.toggleIcon}>{guestbookExpanded ? '▼' : '▶'}</span>
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

        {/* Footer */}
        <div className={about.footer}>
          <p>© {BLOG_INFO.since}-{new Date().getFullYear()} {PROFILE.author}. All rights reserved.</p>
          <p className={about.footerNote}>Content licensed under {BLOG_INFO.license}</p>
        </div>
      </div>
    </>
  );
};

export default About;
