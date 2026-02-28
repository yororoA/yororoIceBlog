import React, { useCallback, useContext, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import about from './about.module.less';
import adminImg from '../../../assets/images/admin.png';
import binesImg from '../../../assets/images/bines.png';
import { postGuestbookComment } from '../../../utils/guestbook';
import { GuestbookContext } from '../context/guestbookContext';
import { isGuest, getUid, setGuestDisplayName } from '../../../utils/auth';
import { getAvatarColor } from '../../../utils/avatarColor';
import { formatDateTime } from '../../../utils/formatDateTime';
import { UiPersistContext } from '../context/uiPersistContext';
import { t } from '../../../i18n/uiText';
import { PROFILE } from '../shared/profileInfo';
import { SuccessBoardContext } from '../../../components/ui/pop/status/successBoardContext';
import { getLinks, createLink, updateLink, deleteLink } from '../../../utils/links';
import Pop from '../../../components/ui/pop/pop';

const ADMIN_UIDS = ['u_mg94ixwg_df9ff1a129ad44a6', 'u_mg94t4ce_6485ab4d88f2f8db'];
const BINES_UID = 'u_mlkpl8fl_52a3d8c2068b281a';
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

  const currentUid = getUid();
  const isAdmin = !isGuest() && ADMIN_UIDS.includes(currentUid);

  const [linksVisible, setLinksVisible] = useState(false);
  const [gbVisible, setGbVisible] = useState(false);
  const [links, setLinks] = useState([]);
  const [showManageLinks, setShowManageLinks] = useState(false);
  const [manageLinksList, setManageLinksList] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [linkForm, setLinkForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const linksRef = useRef(null);
  const gbRef = useRef(null);
  const [searchParams, setSearchParams] = useSearchParams();

  const setLinksFromApi = useCallback((list) => {
    setLinks(list.map((item) => ({
      name: item.name,
      description: item.description || '',
      url: item.url,
      image: item.imgurl || '',
      category: item.category || 'friend',
    })));
  }, []);

  useEffect(() => {
    getLinks().then((list) => {
      setLinksFromApi(list);
    });
  }, [setLinksFromApi]);

  const openManageLinks = useCallback(() => {
    getLinks().then((list) => {
      setManageLinksList(list);
      setShowManageLinks(true);
      setEditingId(null);
      setLinkForm(null);
    });
  }, []);

  const closeManageLinks = useCallback((proceed) => {
    (proceed || (() => {}))();
    setShowManageLinks(false);
    setEditingId(null);
    setLinkForm(null);
    getLinks().then(setLinksFromApi);
  }, [setLinksFromApi]);

  const handleSaveLink = useCallback(async () => {
    if (!linkForm || !linkForm.name?.trim() || !linkForm.url?.trim() || saving) return;
    setSaving(true);
    try {
      const body = {
        name: linkForm.name.trim(),
        description: (linkForm.description || '').trim(),
        url: linkForm.url.trim(),
        imgurl: (linkForm.imgurl || '').trim(),
        category: linkForm.category || 'friend',
      };
      if (editingId) {
        await updateLink(editingId, body);
        showSuccess?.('已更新');
      } else {
        await createLink(body);
        showSuccess?.('已添加');
      }
      const list = await getLinks();
      setManageLinksList(list);
      setEditingId(null);
      setLinkForm(null);
    } catch (err) {
      console.error(err);
      showSuccess?.(err.message || '操作失败');
    } finally {
      setSaving(false);
    }
  }, [linkForm, editingId, saving, showSuccess]);

  const handleDeleteLink = useCallback(async (id) => {
    if (!window.confirm(t(locale, 'confirm'))) return;
    try {
      await deleteLink(id);
      showSuccess?.('已删除');
      const list = await getLinks();
      setManageLinksList(list);
      setLinksFromApi(list);
      setEditingId(null);
      setLinkForm(null);
    } catch (err) {
      console.error(err);
      showSuccess?.(err.message || '删除失败');
    }
  }, [locale, showSuccess, setLinksFromApi]);

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

  const SITE_ICON_URL = 'https://www.yororoice.top/favicon.ico';
  const handleCopySiteIcon = useCallback(async (e) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(SITE_ICON_URL);
      showSuccess(t(locale, 'copiedSiteIcon'));
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
        if (isGuest() && guestName.trim()) setGuestDisplayName(guestName.trim());
        setGuestName('');
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
              <div className={about.cardHeaderActions} onClick={(e) => e.stopPropagation()}>
                {isAdmin && (
                  <button type="button" className={about.headerActionBtn} onClick={openManageLinks}>
                    {t(locale, 'manageLinks')}
                  </button>
                )}
                <button type="button" className={about.headerActionBtn} onClick={handleCopyEmail}>{t(locale, 'copyEmail')}</button>
                <button type="button" className={about.headerActionBtn} onClick={handleCopySiteLink}>{t(locale, 'copySiteLink')}</button>
                <button type="button" className={about.headerActionBtn} onClick={handleCopySiteIcon}>{t(locale, 'copySiteIcon')}</button>
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
                    links.forEach(link => {
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

                  const filteredLinks = links.filter(link => {
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

      {showManageLinks && (
        <Pop onClose={closeManageLinks}>
          <div className={about.manageLinksPop}>
            <h3 className={about.manageLinksTitle}>{t(locale, 'manageLinks')}</h3>
            {linkForm !== null ? (
              <div className={about.manageLinksForm}>
                <input
                  type="text"
                  className={about.manageLinksInput}
                  placeholder={t(locale, 'linkName')}
                  value={linkForm.name || ''}
                  onChange={(e) => setLinkForm((f) => ({ ...f, name: e.target.value }))}
                />
                <input
                  type="text"
                  className={about.manageLinksInput}
                  placeholder={t(locale, 'linkDescription')}
                  value={linkForm.description || ''}
                  onChange={(e) => setLinkForm((f) => ({ ...f, description: e.target.value }))}
                />
                <input
                  type="text"
                  className={about.manageLinksInput}
                  placeholder={t(locale, 'linkUrl')}
                  value={linkForm.url || ''}
                  onChange={(e) => setLinkForm((f) => ({ ...f, url: e.target.value }))}
                />
                <input
                  type="text"
                  className={about.manageLinksInput}
                  placeholder={t(locale, 'linkImgUrl')}
                  value={linkForm.imgurl || ''}
                  onChange={(e) => setLinkForm((f) => ({ ...f, imgurl: e.target.value }))}
                />
                <select
                  className={about.manageLinksSelect}
                  value={linkForm.category || 'friend'}
                  onChange={(e) => setLinkForm((f) => ({ ...f, category: e.target.value }))}
                >
                  <option value="friend">{t(locale, 'friendLinks')}</option>
                  <option value="tool">{t(locale, 'toolLinks')}</option>
                  <option value="development">{t(locale, 'development')}</option>
                  <option value="other">{t(locale, 'other')}</option>
                </select>
                <div className={about.manageLinksFormActions}>
                  <button type="button" className={about.headerActionBtn} onClick={() => { setLinkForm(null); setEditingId(null); }}>{t(locale, 'cancel')}</button>
                  <button type="button" className={about.manageLinksSaveBtn} onClick={handleSaveLink} disabled={saving || !linkForm?.name?.trim() || !linkForm?.url?.trim()}>{saving ? t(locale, 'loading') : t(locale, 'save')}</button>
                </div>
              </div>
            ) : (
              <>
                <button type="button" className={about.manageLinksAddBtn} onClick={() => setLinkForm({ name: '', description: '', url: '', imgurl: '', category: 'friend' })}>{t(locale, 'addLink')}</button>
                <div className={about.manageLinksList}>
                  {manageLinksList.length === 0 ? (
                    <p className={about.linksEmpty}>{t(locale, 'noLinksYet')}</p>
                  ) : (
                    manageLinksList.map((item) => (
                      <div key={item._id} className={about.manageLinksRow}>
                        <span className={about.manageLinksRowName}>{item.name}</span>
                        <span className={about.manageLinksRowCat}>{categoryLabels[item.category] || item.category}</span>
                        <div className={about.manageLinksRowActions}>
                          <button type="button" className={about.headerActionBtn} onClick={() => { setEditingId(item._id); setLinkForm({ name: item.name, description: item.description || '', url: item.url, imgurl: item.imgurl || '', category: item.category || 'friend' }); }}>{t(locale, 'editLink')}</button>
                          <button type="button" className={about.headerActionBtn} onClick={() => handleDeleteLink(item._id)}>{t(locale, 'delete')}</button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </>
            )}
          </div>
        </Pop>
      )}
    </div>
  );
};

export default About;
