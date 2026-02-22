import React, { useCallback, useContext, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import knowledge from './knowledge.module.less';
import CommonBtn from '../../../components/btn/commonBtn/commonBtn';
import addContent from '../../../components/btn/addContent.module.less';
import Pop from '../../../components/ui/pop/pop';
import Like from '../../../components/ui/feedback/like';
import { SuccessBoardContext } from '../../../components/ui/pop/status/successBoardContext';
import { isGuest, getUid } from '../../../utils/auth';
import { getKnowledgeArticles, createArticle, getCategories, getArticleLikesList, deleteArticle, incrementArticleView } from '../../../utils/knowledge';
import { sendArticleLike } from '../../../utils/sendArticleLike';
import { KnowledgeListContext } from './context/knowledgeListContext';
import { UiPersistContext } from '../context/uiPersistContext';

const ADMIN_UIDS = ['u_mg94ixwg_df9ff1a129ad44a6', 'u_mg94t4ce_6485ab4d88f2f8db'];

// 若 markdown 第一个非空块为单独一行图片，则提取为封面 URL，并返回去掉该行后的内容（用于列表预览）
function getFirstImageAsCover(markdown) {
  if (!markdown || typeof markdown !== 'string') return { coverUrl: null, contentWithoutFirstImage: markdown || '' };
  const trimmed = markdown.trim();
  const lines = trimmed.split(/\r?\n/);
  const firstNonEmptyIndex = lines.findIndex(l => l.trim() !== '');
  if (firstNonEmptyIndex < 0) return { coverUrl: null, contentWithoutFirstImage: markdown };
  const firstLine = lines[firstNonEmptyIndex].trim();
  const imgMatch = firstLine.match(/^!\[[^\]]*\]\(([^)]+)\)$/);
  if (!imgMatch) return { coverUrl: null, contentWithoutFirstImage: markdown };
  const coverUrl = imgMatch[1].trim();
  const newLines = [...lines.slice(0, firstNonEmptyIndex), ...lines.slice(firstNonEmptyIndex + 1)];
  const contentWithoutFirstImage = newLines.join('\n').trim();
  return { coverUrl, contentWithoutFirstImage };
}

const KnowledgeCard = ({ article, liked, onOpenDetail }) => {
  const { title, category, tags, content, createdAt, updatedAt, likes = 0, views = 0 } = article;
  const { coverUrl, contentWithoutFirstImage } = getFirstImageAsCover(content || '');
  const hasCover = Boolean(coverUrl);
  const [visible, setVisible] = useState(false);
  const [animFinished, setAnimFinished] = useState(false);
  const ref = useRef(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) { setVisible(true); return; }
    const { top, bottom } = el.getBoundingClientRect();
    if (top < window.innerHeight && bottom > 0) {
      setVisible(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.unobserve(el);
        }
      },
      { threshold: 0.1 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' });
  };

  return (
    <div 
      ref={ref} 
      className={`${knowledge.card}${visible ? ` ${knowledge.cardVisible}` : ''}${visible && !animFinished ? ` ${knowledge.cardEnterAnim}` : ''}`} 
      onClick={() => onOpenDetail(article)}
      onAnimationEnd={() => setAnimFinished(true)}
      onMouseEnter={() => setAnimFinished(true)}
    >
      <div className={`${knowledge.cardTop} ${hasCover ? knowledge.cardTopWithCover : ''}`}>
        {hasCover && (
          <div className={knowledge.cardCover}>
            <img src={coverUrl} alt="" />
          </div>
        )}
        <div className={knowledge.cardBody}>
          <div className={knowledge.cardHeader}>
            <h3 className={knowledge.title}>{title}</h3>
            <span className={knowledge.category}>{category || 'Uncategorized'}</span>
          </div>
          {tags && tags.length > 0 && (
            <div className={knowledge.tags}>
              {tags.map((tag, idx) => (
                <span key={idx} className={knowledge.tag}>#{tag}</span>
              ))}
            </div>
          )}
          <div className={knowledge.content}>
            <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
              {hasCover ? contentWithoutFirstImage : (content || '')}
            </ReactMarkdown>
          </div>
        </div>
      </div>
      <div className={knowledge.cardFooter}>
        <div className={knowledge.meta}>
          <span>Created: {formatDate(createdAt)}</span>
          {updatedAt && updatedAt !== createdAt && (
            <span>Updated: {formatDate(updatedAt)}</span>
          )}
        </div>
        <div className={knowledge.stats} onClick={e => e.stopPropagation()}>
          <span className={knowledge.statItem}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 4.5C7 4.5 2.73 7.61 1 12C2.73 16.39 7 19.5 12 19.5C17 19.5 21.27 16.39 23 12C21.27 7.61 17 4.5 12 4.5ZM12 17C9.24 17 7 14.76 7 12C7 9.24 9.24 7 12 7C14.76 7 17 9.24 17 12C17 14.76 14.76 17 12 17ZM12 9C10.34 9 9 10.34 9 12C9 13.66 10.34 15 12 15C13.66 15 15 13.66 15 12C15 10.34 13.66 9 12 9Z" fill="currentColor"/>
            </svg>
            {views}
          </span>
          <Like checked={liked} likes={likes} _id={article._id} type="article_card" disabled={true} />
        </div>
      </div>
    </div>
  );
};

const ArticleDetail = ({ article, liked, onLikeChange, onShare, onDelete, canDelete, likeNumbers, viewCount }) => {
  const { title, category, tags, content, createdAt, updatedAt, _id } = article;

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: '2-digit', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className={knowledge.detailContainer}>
      <div className={knowledge.detailHeader}>
        <h2 className={knowledge.detailTitle}>{title}</h2>
        <div className={knowledge.detailMeta}>
          <span className={knowledge.category}>{category || 'Uncategorized'}</span>
          <span>Created: {formatDate(createdAt)}</span>
          {updatedAt && updatedAt !== createdAt && (
            <span>Updated: {formatDate(updatedAt)}</span>
          )}
          <span className={knowledge.statItem}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 4.5C7 4.5 2.73 7.61 1 12C2.73 16.39 7 19.5 12 19.5C17 19.5 21.27 16.39 23 12C21.27 7.61 17 4.5 12 4.5ZM12 17C9.24 17 7 14.76 7 12C7 9.24 9.24 7 12 7C14.76 7 17 9.24 17 12C17 14.76 14.76 17 12 17ZM12 9C10.34 9 9 10.34 9 12C9 13.66 10.34 15 12 15C13.66 15 15 13.66 15 12C15 10.34 13.66 9 12 9Z" fill="currentColor"/>
            </svg>
            {viewCount}
          </span>
        </div>
        {tags && tags.length > 0 && (
          <div className={knowledge.tags}>
            {tags.map((tag, idx) => (
              <span key={idx} className={knowledge.tag}>#{tag}</span>
            ))}
          </div>
        )}
      </div>
      <div className={knowledge.detailContent}>
        <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>{content || ''}</ReactMarkdown>
      </div>
      <div className={knowledge.detailFooter} onClick={e => e.stopPropagation()}>
        <Like onChange={onLikeChange} checked={liked} likes={likeNumbers} _id={_id} type="article" />
        <div className={knowledge.actions}>
          {canDelete && (
            <button type="button" className={knowledge.actionBtn} onClick={onDelete}>{'删除'}</button>
          )}
          <button type="button" className={knowledge.actionBtn} onClick={onShare}>{'分享'}</button>
        </div>
      </div>
    </div>
  );
};

const NewKnowledgeForm = ({ onClose, onSubmit }) => {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [tags, setTags] = useState('');
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);

  const insertImageMarkdown = useCallback((file, imageUrl, cursorStart, cursorEnd) => {
    const mdImage = `![${file.name}](${imageUrl})`;
    const ta = textareaRef.current;
    const start = cursorStart ?? ta?.selectionStart ?? content.length;
    const end = cursorEnd ?? ta?.selectionEnd ?? content.length;
    setContent(prev => {
      const before = prev.substring(0, start);
      const after = prev.substring(end);
      return before + mdImage + after;
    });
    requestAnimationFrame(() => {
      if (ta) {
        const pos = start + mdImage.length;
        ta.selectionStart = ta.selectionEnd = pos;
        ta.focus();
      }
    });
  }, [content.length]);

  const uploadImageAndInsert = useCallback(async (file, cursorStart, cursorEnd) => {
    if (!file || !file.type.startsWith('image/')) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      const resp = await fetch(`${process.env.REACT_APP_SERVER_HOST}/api/knowledge/upload-image`, {
        method: 'POST',
        body: formData
      });
      const result = await resp.json();
      if (!result.success) throw new Error(result.message || '上传失败');
      const imageUrl = result.data.url;
      insertImageMarkdown(file, imageUrl, cursorStart, cursorEnd);
    } catch (err) {
      alert('图片上传失败: ' + err.message);
    } finally {
      setUploading(false);
    }
  }, [insertImageMarkdown]);

  const handleInsertImage = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    const ta = textareaRef.current;
    const start = ta?.selectionStart;
    const end = ta?.selectionEnd;
    await uploadImageAndInsert(file, start, end);
  };

  const handlePaste = useCallback(async (e) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    const file = Array.from(items).find(item => item.kind === 'file' && item.type.startsWith('image/'))?.getAsFile();
    if (!file) return;
    e.preventDefault();
    const ta = textareaRef.current;
    const start = ta?.selectionStart ?? 0;
    const end = ta?.selectionEnd ?? 0;
    await uploadImageAndInsert(file, start, end);
  }, [uploadImageAndInsert]);

  const handleSubmit = async () => {
    if (!title.trim() || !content.trim()) {
      alert('Title and content are required');
      return;
    }
    setSubmitting(true);
    try {
      await onSubmit({
        title: title.trim(),
        category: category.trim() || 'Uncategorized',
        tags: tags.split(',').map(t => t.trim()).filter(t => t),
        content: content.trim()
      });
      onClose();
    } catch (err) {
      alert('Publish failed: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={knowledge.formContainer}>
      <h2>New Article</h2>
      <input
        type="text"
        placeholder="Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className={knowledge.input}
      />
      <input
        type="text"
        placeholder="Category"
        value={category}
        onChange={(e) => setCategory(e.target.value)}
        className={knowledge.input}
      />
      <input
        type="text"
        placeholder="Tags (comma separated)"
        value={tags}
        onChange={(e) => setTags(e.target.value)}
        className={knowledge.input}
      />
      <div className={knowledge.editorPanel}>
        <div className={knowledge.editorSide}>
          <div className={knowledge.editorLabel}>
            <span>Edit</span>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleInsertImage}
            />
            <button
              type="button"
              className={knowledge.toolbarBtn}
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              title="插入图片"
            >
              {uploading ? '上传中...' : '插入图片'}
            </button>
          </div>
          <textarea
            ref={textareaRef}
            placeholder="Write your article in Markdown... (paste image to insert)"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onPaste={handlePaste}
            className={knowledge.textarea}
            rows={14}
          />
        </div>
        <div className={knowledge.previewSide}>
          <div className={knowledge.editorLabel}>Preview</div>
          <div className={knowledge.previewArea}>
            {content.trim() ? (
              <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>{content}</ReactMarkdown>
            ) : (
              <span className={knowledge.previewPlaceholder}>Nothing to preview</span>
            )}
          </div>
        </div>
      </div>
      <div className={knowledge.btnGroup}>
        <button onClick={onClose} disabled={submitting} className={knowledge.cancelBtn}>
          Cancel
        </button>
        <button onClick={handleSubmit} disabled={submitting} className={knowledge.submitBtn}>
          {submitting ? 'Publishing...' : 'Publish'}
        </button>
      </div>
    </div>
  );
};

const Knowledge = () => {
  const [articlesData, setArticlesData, likedArticles, setLikedArticles, categories, setCategories] = useContext(KnowledgeListContext);
  const { articlesSelectedCategory: selectedCategory, setArticlesSelectedCategory: setSelectedCategory } = useContext(UiPersistContext);
  const [filteredArticles, setFilteredArticles] = useState([]);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [showNewForm, setShowNewForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [detailArticle, setDetailArticle] = useState(null);

  const { showSuccess, showFailed } = useContext(SuccessBoardContext);

  // URL 查询参数 ?kid=
  const [searchParams, setSearchParams] = useSearchParams();
  const kidFromQuery = searchParams.get('kid');

  const clearKidFromUrl = useCallback(() => {
    if (!searchParams.get('kid')) return;
    const next = new URLSearchParams(searchParams);
    next.delete('kid');
    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams]);
  const clearKidFromUrlRef = useRef(clearKidFromUrl);
  clearKidFromUrlRef.current = clearKidFromUrl;
  const onCloseDetails = useCallback(() => clearKidFromUrlRef.current?.(), []);

  const setKidInUrl = useCallback((id) => {
    const next = new URLSearchParams(searchParams);
    next.set('kid', id);
    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams]);
  const setKidInUrlRef = useRef(setKidInUrl);
  setKidInUrlRef.current = setKidInUrl;
  const onOpenDetails = useCallback((id) => setKidInUrlRef.current?.(id), []);

  const currentUid = getUid();
  const isAdmin = ADMIN_UIDS.includes(currentUid);

  // 获取文章数据：首次无数据时拉取并写入 context，避免切换路由重复加载
  const fetchArticles = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getKnowledgeArticles({ category: selectedCategory, keyword: searchKeyword });
      setArticlesData(data);
      
      // 只在categories为空时获取分类列表
      if (categories.length === 0) {
        const cats = await getCategories();
        setCategories(['all', ...cats]);
      }

      // 获取已点赞列表（只在首次或likedArticles为空时）
      if (!isGuest() && likedArticles.length === 0) {
        const liked = await getArticleLikesList();
        setLikedArticles(liked);
      }
    } catch (err) {
      console.error('获取文章失败:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, searchKeyword, categories.length, likedArticles.length, setArticlesData, setCategories, setLikedArticles]);

  useEffect(() => {
    // 只在首次加载或数据为空时请求
    if (articlesData.length === 0) {
      fetchArticles();
    }
  }, [articlesData.length, fetchArticles]);

  // 通过 URL kid 参数自动打开文章详情（仅在 kid 变化时触发一次）
  const autoOpenedKidRef = useRef(null);
  const isManuallyClosedRef = useRef(false);
  useEffect(() => {
    if (!kidFromQuery || articlesData.length === 0) {
      // 如果kid被清除，关闭详情并重置标记
      if (!kidFromQuery && detailArticle) {
        autoOpenedKidRef.current = null;
        setDetailArticle(null);
        // 如果用户手动关闭，重置手动关闭标记
        if (isManuallyClosedRef.current) {
          isManuallyClosedRef.current = false;
        }
      }
      return;
    }
    // 如果用户手动关闭过，不再自动打开
    if (isManuallyClosedRef.current) return;
    // 同一个 kid 只自动打开一次，防止关闭后因 state 变化重复触发
    if (autoOpenedKidRef.current === kidFromQuery) return;
    const target = articlesData.find(a => a._id === kidFromQuery);
    if (target) {
      autoOpenedKidRef.current = kidFromQuery;
      setDetailArticle(target);
      // 查看详情 → views +1
      incrementArticleView(target._id);
    }
  }, [kidFromQuery, articlesData, detailArticle]);

  // 过滤文章
  useEffect(() => {
    let result = articlesData;
    if (selectedCategory !== 'all') {
      result = result.filter(a => a.category === selectedCategory);
    }
    if (searchKeyword.trim()) {
      const keyword = searchKeyword.toLowerCase();
      result = result.filter(a => 
        a.title.toLowerCase().includes(keyword) ||
        a.content.toLowerCase().includes(keyword) ||
        a.tags?.some(tag => tag.toLowerCase().includes(keyword))
      );
    }
    setFilteredArticles(result);
  }, [articlesData, selectedCategory, searchKeyword]);

  const handleSubmitArticle = async (articleData) => {
    try {
      const newArticle = await createArticle(articleData);
      setArticlesData(prev => [newArticle, ...prev]);
      if (!categories.includes(newArticle.category)) {
        setCategories(prev => [...prev, newArticle.category]);
      }
    } catch (err) {
      throw new Error(err.message || '发布文章失败');
    }
  };

  // 点击卡片打开详情
  const handleOpenDetail = useCallback((article) => {
    isManuallyClosedRef.current = false; // 手动点击打开时，重置手动关闭标记
    setDetailArticle(article);
    onOpenDetails(article._id);
    // 查看详情 → views +1
    incrementArticleView(article._id);
    // 前端计数也 +1
    setArticlesData(prev => prev.map(a => a._id === article._id ? { ...a, views: (a.views || 0) + 1 } : a));
  }, [onOpenDetails, setArticlesData]);

  // 关闭详情（Pop 的 onClose 会传入 proceed，需调用以执行关闭动画）
  const handleCloseDetail = useCallback((proceed) => {
    isManuallyClosedRef.current = true;
    autoOpenedKidRef.current = null;
    setDetailArticle(null);
    onCloseDetails();
    if (typeof proceed === 'function') proceed();
  }, [onCloseDetails]);

  // 点赞状态
  const [detailLiked, setDetailLiked] = useState(false);
  const [detailLikes, setDetailLikes] = useState(0);
  const [detailViews, setDetailViews] = useState(0);

  useEffect(() => {
    if (detailArticle) {
      setDetailLiked(likedArticles.includes(detailArticle._id));
      setDetailLikes(detailArticle.likes || 0);
      setDetailViews(detailArticle.views || 0);
    }
  }, [detailArticle, likedArticles]);

  const handleLikeChange = useCallback(async (e) => {
    const checked = e.target.checked;
    setDetailLiked(checked);
    setDetailLikes(prev => checked ? prev + 1 : prev - 1);
    setDetailViews(prev => prev + 1);
    await sendArticleLike(detailArticle._id, checked);
    // 更新列表中的数据
    setArticlesData(prev => prev.map(a => a._id === detailArticle._id
      ? { ...a, likes: checked ? (a.likes || 0) + 1 : Math.max(0, (a.likes || 0) - 1), views: (a.views || 0) + 1 }
      : a
    ));
    // 更新 liked 列表
    if (checked) {
      setLikedArticles(prev => [...prev, detailArticle._id]);
      showSuccess('Liked');
    } else {
      setLikedArticles(prev => prev.filter(id => id !== detailArticle._id));
    }
  }, [detailArticle, showSuccess, setArticlesData, setLikedArticles]);

  // 分享
  const handleShare = useCallback((e) => {
    e.stopPropagation();
    if (!detailArticle) return;
    const url = `${window.location.origin}/town/articles?kid=${detailArticle._id}`;
    navigator.clipboard.writeText(url).then(() => showSuccess('Link copied')).catch(() => {});
    // 分享 → views +1
    incrementArticleView(detailArticle._id);
    setDetailViews(prev => prev + 1);
    setArticlesData(prev => prev.map(a => a._id === detailArticle._id ? { ...a, views: (a.views || 0) + 1 } : a));
  }, [detailArticle, showSuccess, setArticlesData]);

  // 删除
  const canDelete = detailArticle && !isGuest() && (currentUid === detailArticle.uid || isAdmin);

  const handleDelete = useCallback(async (e) => {
    e.stopPropagation();
    if (!detailArticle) return;
    try {
      await deleteArticle(detailArticle._id);
      setArticlesData(prev => prev.filter(a => a._id !== detailArticle._id));
      setDetailArticle(null);
      onCloseDetails();
      showSuccess('Deleted');
    } catch (err) {
      showFailed(err.message || 'Delete failed');
    }
  }, [detailArticle, onCloseDetails, showSuccess, showFailed, setArticlesData]);

  return (
    <>
      <div className="page-enter">
        <section id="header">
          <span>Articles</span>
          {isAdmin && (
            <div className={addContent.container} onClick={() => setShowNewForm(true)}>
              <CommonBtn className={addContent.new} text={'New Article'} />
            </div>
          )}
        </section>
        <div className={knowledge.controls}>
        <div className={knowledge.searchBox}>
          <input
            type="text"
            placeholder="Search articles..."
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            className={knowledge.searchInput}
          />
        </div>
        <div className={knowledge.categories}>
          {categories.map(cat => (
            <button
              key={cat}
              className={`${knowledge.categoryBtn} ${selectedCategory === cat ? knowledge.active : ''}`}
              onClick={() => setSelectedCategory(cat)}
            >
              {cat === 'all' ? 'All' : cat}
            </button>
          ))}
        </div>
        </div>

        <div className={knowledge.articleList}>
        {loading ? (
          <div className={knowledge.loading}>
            <span className={knowledge.loadingDot} />
            Loading...
          </div>
        ) : filteredArticles.length === 0 ? (
          <div className={knowledge.empty}>No articles yet</div>
        ) : (
          filteredArticles.map(article => (
            <KnowledgeCard
              key={article._id}
              article={article}
              liked={likedArticles.includes(article._id)}
              onOpenDetail={handleOpenDetail}
            />
          ))
        )}
        </div>
      </div>
      {detailArticle && (
        <Pop isLittle={false} onClose={handleCloseDetail}>
          <ArticleDetail
            article={detailArticle}
            liked={detailLiked}
            likeNumbers={detailLikes}
            viewCount={detailViews}
            onLikeChange={handleLikeChange}
            onShare={handleShare}
            onDelete={handleDelete}
            canDelete={canDelete}
          />
        </Pop>
      )}

      {showNewForm && (
        <Pop isLittle={false} onClose={(proceed) => { setShowNewForm(false); if (typeof proceed === 'function') proceed(); }}>
          <NewKnowledgeForm onClose={() => setShowNewForm(false)} onSubmit={handleSubmitArticle} />
        </Pop>
      )}
    </>
  );
};

export default Knowledge;
