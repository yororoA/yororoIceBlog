import React, { useCallback, useContext, useEffect, useRef, useState } from 'react';
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

const ADMIN_UIDS = ['u_mg94ixwg_df9ff1a129ad44a6', 'u_mg94t4ce_6485ab4d88f2f8db'];

const KnowledgeCard = ({ article, liked, onOpenDetail }) => {
  const { title, category, tags, content, createdAt, updatedAt, likes = 0, views = 0 } = article;

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' });
  };

  return (
    <div className={knowledge.card} onClick={() => onOpenDetail(article)}>
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
        <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>{content || ''}</ReactMarkdown>
      </div>
      <div className={knowledge.cardFooter}>
        <div className={knowledge.meta}>
          <span>Created: {formatDate(createdAt)}</span>
          {updatedAt && updatedAt !== createdAt && (
            <span>Updated: {formatDate(updatedAt)}</span>
          )}
        </div>
        <div className={knowledge.stats} onClick={e => e.stopPropagation()}>
          <span className={knowledge.statItem}>👁 {views}</span>
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
          <span className={knowledge.statItem}>👁 {viewCount}</span>
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

  const handleInsertImage = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // 重置 input 以支持重复选同一文件
    e.target.value = '';

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

      const imageUrl = `${process.env.REACT_APP_SERVER_HOST}${result.data.url}`;
      const mdImage = `![${file.name}](${imageUrl})`;

      // 在光标位置插入
      const ta = textareaRef.current;
      if (ta) {
        const start = ta.selectionStart;
        const end = ta.selectionEnd;
        const before = content.substring(0, start);
        const after = content.substring(end);
        const newContent = before + mdImage + after;
        setContent(newContent);
        // 下一帧移动光标到插入内容之后
        requestAnimationFrame(() => {
          const pos = start + mdImage.length;
          ta.selectionStart = ta.selectionEnd = pos;
          ta.focus();
        });
      } else {
        setContent(prev => prev + '\n' + mdImage);
      }
    } catch (err) {
      alert('图片上传失败: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

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
            placeholder="Write your article in Markdown..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
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
  const [articles, setArticles] = useState([]);
  const [filteredArticles, setFilteredArticles] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [showNewForm, setShowNewForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [detailArticle, setDetailArticle] = useState(null);
  const [likedArticles, setLikedArticles] = useState([]);

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

  // 获取文章数据
  const fetchArticles = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getKnowledgeArticles({ category: selectedCategory, keyword: searchKeyword });
      setArticles(data);
      
      const cats = await getCategories();
      setCategories(['all', ...cats]);

      // 获取已点赞列表
      if (!isGuest()) {
        const liked = await getArticleLikesList();
        setLikedArticles(liked);
      }
    } catch (err) {
      console.error('获取文章失败:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, searchKeyword]);

  useEffect(() => {
    fetchArticles();
  }, [fetchArticles]);

  // 通过 URL kid 参数自动打开文章详情（仅在 kid 变化时触发一次）
  const autoOpenedKidRef = useRef(null);
  useEffect(() => {
    if (!kidFromQuery || articles.length === 0) return;
    // 同一个 kid 只自动打开一次，防止关闭后因 state 变化重复触发
    if (autoOpenedKidRef.current === kidFromQuery) return;
    const target = articles.find(a => a._id === kidFromQuery);
    if (target) {
      autoOpenedKidRef.current = kidFromQuery;
      setDetailArticle(target);
      // 查看详情 → views +1
      incrementArticleView(target._id);
    }
  }, [kidFromQuery, articles]);

  // URL 中 kid 被清除时重置标记，以便下次通过 URL 打开
  useEffect(() => {
    if (!kidFromQuery) autoOpenedKidRef.current = null;
  }, [kidFromQuery]);

  // 过滤文章
  useEffect(() => {
    let result = articles;
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
  }, [articles, selectedCategory, searchKeyword]);

  const handleSubmitArticle = async (articleData) => {
    try {
      const newArticle = await createArticle(articleData);
      setArticles(prev => [newArticle, ...prev]);
      if (!categories.includes(newArticle.category)) {
        setCategories(prev => [...prev, newArticle.category]);
      }
    } catch (err) {
      throw new Error(err.message || '发布文章失败');
    }
  };

  // 点击卡片打开详情
  const handleOpenDetail = useCallback((article) => {
    setDetailArticle(article);
    onOpenDetails(article._id);
    // 查看详情 → views +1
    incrementArticleView(article._id);
    // 前端计数也 +1
    setArticles(prev => prev.map(a => a._id === article._id ? { ...a, views: (a.views || 0) + 1 } : a));
  }, [onOpenDetails]);

  // 关闭详情
  const handleCloseDetail = useCallback(() => {
    setDetailArticle(null);
    onCloseDetails();
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
    setArticles(prev => prev.map(a => a._id === detailArticle._id
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
  }, [detailArticle, showSuccess]);

  // 分享
  const handleShare = useCallback((e) => {
    e.stopPropagation();
    if (!detailArticle) return;
    const url = `${window.location.origin}/town/knowledge?kid=${detailArticle._id}`;
    navigator.clipboard.writeText(url).then(() => showSuccess('Link copied')).catch(() => {});
    // 分享 → views +1
    incrementArticleView(detailArticle._id);
    setDetailViews(prev => prev + 1);
    setArticles(prev => prev.map(a => a._id === detailArticle._id ? { ...a, views: (a.views || 0) + 1 } : a));
  }, [detailArticle, showSuccess]);

  // 删除
  const canDelete = detailArticle && !isGuest() && (currentUid === detailArticle.uid || isAdmin);

  const handleDelete = useCallback(async (e) => {
    e.stopPropagation();
    if (!detailArticle) return;
    try {
      await deleteArticle(detailArticle._id);
      setArticles(prev => prev.filter(a => a._id !== detailArticle._id));
      setDetailArticle(null);
      onCloseDetails();
      showSuccess('Deleted');
    } catch (err) {
      showFailed(err.message || 'Delete failed');
    }
  }, [detailArticle, onCloseDetails, showSuccess, showFailed]);

  return (
    <>
      <section id="header">
        <span>Knowledge</span>
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
          <div className={knowledge.loading}>Loading...</div>
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
        <Pop isLittle={false} onClose={() => setShowNewForm(false)}>
          <NewKnowledgeForm onClose={() => setShowNewForm(false)} onSubmit={handleSubmitArticle} />
        </Pop>
      )}
    </>
  );
};

export default Knowledge;
