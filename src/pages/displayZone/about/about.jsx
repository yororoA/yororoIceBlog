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

// ── Static profile configuration ──
const PROFILE = {
  author: 'yororoIce',
  avatar: adminImg,
  description: 'Time mends the wounds, love soothes the scars.',
  bio: 'Full-stack developer with a passion for coding and open source. Love exploring new technologies and sharing knowledge. This is where I document my journey.',
  email: '3364817735song@gmail.com',
  github: 'https://github.com/yororoA',
  skills: ['JavaScript', 'TypeScript', 'React', 'Node.js', 'Python', 'Docker', 'MongoDB'],
  interests: ['Coding', 'Photography', 'Travel', 'Reading', 'Music', 'Gaming', 'Anime'],
};

const BLOG_INFO = {
  name: 'yororoIce Town',
  since: '2024',
  stack: 'React + Node.js',
  hosting: 'Self-hosted',
  license: 'CC BY-NC-SA 4.0',
};

// Friend links (static)
const FRIEND_LINKS = [
  // { name: 'Example Blog', url: 'https://example.com' },
  // { name: 'Tech Corner', url: 'https://example2.com' },
];

// Social links — GitHub only
const socialLinks = [
  { name: 'GitHub', url: PROFILE.github, show: PROFILE.github },
].filter(link => link.show);

const About = () => {
  // ── Guestbook state ──
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    getGuestbookComments().then(setComments).catch(() => {});
  }, []);

  const handlePostComment = useCallback(async () => {
    if (!newComment.trim() || submitting) return;
    setSubmitting(true);
    try {
      const result = await postGuestbookComment(newComment.trim());
      if (result.success && result.data) {
        setComments(prev => [result.data, ...prev]);
        setNewComment('');
      }
    } catch (err) {
      console.error('Post guestbook comment failed:', err);
    } finally {
      setSubmitting(false);
    }
  }, [newComment, submitting]);

  return (
    <>
      <section id="header">
        <span>About</span>
      </section>

      {/* Left Sidebar — symmetric with status board on right */}
      <aside className={about.leftSidebar}>
        {/* Friend Links */}
        <div className={about.sidebarCard}>
          <h4 className={about.sidebarTitle}>Friend Links</h4>
          <p className={about.friendLinkTip}>To add your link, please email me and add this site to your blogroll first.</p>
          <div className={about.friendLinks}>
            {FRIEND_LINKS.map((link, idx) => (
              <a key={idx} href={link.url} target="_blank" rel="noopener noreferrer" className={about.friendLink}>
                {link.name}
              </a>
            ))}
          </div>
        </div>

        {/* Guestbook */}
        <div className={about.sidebarCard}>
          <h4 className={about.sidebarTitle}>Guestbook</h4>
          {!isGuest() && (
            <div className={about.guestbookForm}>
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
          )}
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
      </aside>

      <div className={about.container}>
        {/* Profile Card */}
        <div className={about.profileCard}>
          <div className={about.avatarSection}>
            {PROFILE.avatar ? (
              <img src={PROFILE.avatar} alt={PROFILE.author} className={about.avatar} />
            ) : (
              <div className={about.avatarPlaceholder}>
                {PROFILE.author.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <h2 className={about.authorName}>{PROFILE.author}</h2>
          <p className={about.description}>{PROFILE.description}</p>
          {PROFILE.email && (
            <p className={about.emailDisplay}>{PROFILE.email}</p>
          )}
          <div className={about.socialLinks}>
            {socialLinks.map(link => (
              <a
                key={link.name}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className={about.socialLink}
                title={link.name}
              >
                {/* <span className={about.icon}>{link.icon}</span> */}
                <span className={about.linkText}>{link.name}</span>
              </a>
            ))}
          </div>
        </div>

        {/* Skills */}
        {PROFILE.skills.length > 0 && (
          <div className={about.skillsCard}>
            <h3 className={about.cardTitle}>Skills</h3>
            <div className={about.tags}>
              {PROFILE.skills.map((skill, idx) => (
                <span key={idx} className={about.tag}>{skill}</span>
              ))}
            </div>
          </div>
        )}

        {/* Interests */}
        {PROFILE.interests.length > 0 && (
          <div className={about.interestsCard}>
            <h3 className={about.cardTitle}>Interests</h3>
            <div className={about.tags}>
              {PROFILE.interests.map((interest, idx) => (
                <span key={idx} className={about.tag}>{interest}</span>
              ))}
            </div>
          </div>
        )}

        {/* Blog Info */}
        <div className={about.infoCard}>
          <h3 className={about.cardTitle}>Blog Info</h3>
          <div className={about.infoList}>
            <div className={about.infoItem}>
              <span className={about.infoLabel}>Name:</span>
              <span className={about.infoValue}>{BLOG_INFO.name}</span>
            </div>
            <div className={about.infoItem}>
              <span className={about.infoLabel}>Since:</span>
              <span className={about.infoValue}>{BLOG_INFO.since}</span>
            </div>
            <div className={about.infoItem}>
              <span className={about.infoLabel}>Stack:</span>
              <span className={about.infoValue}>{BLOG_INFO.stack}</span>
            </div>
            <div className={about.infoItem}>
              <span className={about.infoLabel}>Hosting:</span>
              <span className={about.infoValue}>{BLOG_INFO.hosting}</span>
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
