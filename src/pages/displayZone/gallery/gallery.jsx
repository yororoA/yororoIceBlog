import React, { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { loadGallery } from '../../../utils/loadGallery';
import IvPreview from '../../../components/ui/image_video_preview/ivPreview';
import { base64toObjectUrl } from '../../../utils/base64toObjectUrl';
import { GalleryContext } from './context/galleryContext';
import { ScrollContainerContext } from '../scrollContainerContext';
import './gallery.less';

const mergeFilesWithUsername = (data) =>
  (data?.files || []).map((f, i) => {
    const name =
      f?.username ??
      f?.uploader ??
      f?.uploaderName ??
      f?.userName ??
      (typeof f?.user === 'string' ? f.user : f?.user?.username) ??
      (Array.isArray(data?.username) ? data.username?.[i] : data?.username);
    return { ...f, username: name != null && name !== '' ? String(name).trim() : undefined };
  });

const Gallery = () => {
  const [ivs, setIvs, hasMore, setHasMore] = useContext(GalleryContext);
  const scrollContainerRef = useContext(ScrollContainerContext);
  const [loading, setLoading] = useState(false);
  const loadMoreRef = useRef(null);
  const initialDoneRef = useRef(false);

  const appendGallery = useCallback(async () => {
    if (loading || !hasMore) return;
    setLoading(true);
    try {
      const data = await loadGallery();
      const newFiles = mergeFilesWithUsername(data);
      if (newFiles.length === 0) setHasMore(false);
      else setIvs((prev) => [...prev, ...newFiles]);
    } catch (e) {
      console.error('图库加载失败:', e.message);
    } finally {
      setLoading(false);
    }
  }, [loading, hasMore, setIvs, setHasMore]);

  useEffect(() => {
    if (ivs.length > 0) {
      initialDoneRef.current = true;
      return;
    }
    if (initialDoneRef.current) return;
    initialDoneRef.current = true;
    appendGallery();
  }, [ivs.length, appendGallery]);

  const [prs, setPrs] = useState([]);
  useEffect(() => {
    const ivUrls = base64toObjectUrl(ivs);
    setPrs(
      ivUrls.map((urlItem, i) => {
        const u = ivs[i]?.username;
        return [urlItem.url, 'image', u != null && u !== '' ? String(u).trim() : undefined];
      })
    );
  }, [ivs]);

  // 依赖 prs.length：哨兵仅在 prs.length > 0 时渲染，且 prs 由 ivs 的 effect 滞后更新，
  // 若不加此项，首屏加载完成后 observer 执行时哨兵尚未挂载，之后也不会再跑，触底加载永不生效
  useEffect(() => {
    if (!hasMore || loading) return;
    const el = loadMoreRef.current;
    const root = scrollContainerRef?.current ?? null;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) appendGallery();
      },
      { root, rootMargin: '120px', threshold: 0 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, loading, appendGallery, scrollContainerRef, prs.length]);

  return (
    <div className="gallery-page">
      <section id="header">
        <span>Gallery</span>
      </section>
      <section id="gallery" className="gallery-page__grid">
        {prs.length > 0 ? (
          <>
            <IvPreview items={prs} prefix="gallery_iv" />
            {hasMore && <div ref={loadMoreRef} className="gallery-page__sentinel" aria-hidden />}
          </>
        ) : loading ? (
          <p className="gallery-page__empty">加载中…</p>
        ) : (
          <p className="gallery-page__empty">暂无图片，稍后再来看看吧</p>
        )}
      </section>
      {loading && ivs.length > 0 && <p className="gallery-page__loading">加载更多…</p>}
    </div>
  );
};

export default Gallery;
