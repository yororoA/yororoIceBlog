import React, { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { loadGallery, resetGalleryCursor } from '../../../utils/loadGallery';
import IvPreview from '../../../components/ui/image_video_preview/ivPreview';
import { GalleryContext } from './context/galleryContext';
import { ScrollContainerContext } from '../scrollContainerContext';
import { SuccessBoardContext } from '../../../components/ui/pop/status/successBoardContext';
import { isGuest, getUid } from '../../../utils/auth';
import CommonBtn from '../../../components/btn/commonBtn/commonBtn';
import addContent from '../../../components/btn/addContent.module.less';
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
  const { showSuccess, showFailed } = useContext(SuccessBoardContext);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const loadMoreRef = useRef(null);
  const initialDoneRef = useRef(false);
  const fileInputRef = useRef(null);
  const loadingRef = useRef(false);

  const ADMIN_UIDS = ['u_mg94ixwg_df9ff1a129ad44a6', 'u_mg94t4ce_6485ab4d88f2f8db'];
  const currentUid = getUid();
  const canUpload = !isGuest() && ADMIN_UIDS.includes(currentUid);

  const appendGallery = useCallback(async () => {
    if (loadingRef.current || !hasMore) return;
    loadingRef.current = true;
    setLoading(true);
    try {
      const data = await loadGallery();
      const newFiles = mergeFilesWithUsername(data);
      if (newFiles.length === 0 || data.hasMore === false) {
        // 后端告知没有更多数据，或本次返回为空
        if (newFiles.length > 0) setIvs((prev) => [...prev, ...newFiles]);
        setHasMore(false);
      } else {
        setIvs((prev) => [...prev, ...newFiles]);
      }
    } catch (e) {
      console.error('图库加载失败:', e.message);
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  }, [hasMore, setIvs, setHasMore]);

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
    // 后端现在返回 Cloudinary URL（url 字段），不再需要 base64 转换
    setPrs(
      ivs.map((item, i) => {
        const u = item?.username;
        const url = item?.url || '';
        return [url, 'image', u != null && u !== '' ? String(u).trim() : undefined];
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

  // 上传文件
  const handleUpload = useCallback(async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      const formData = new FormData();
      for (let i = 0; i < files.length; i++) {
        formData.append('files', files[i]);
      }

      const api = `${process.env.REACT_APP_SERVER_HOST}/api/gallery/post`;
      const resp = await fetch(api, {
        method: 'POST',
        body: formData
      });

      if (!resp.ok) {
        const errBody = await resp.json().catch(() => ({}));
        throw new Error(errBody.message || '上传失败');
      }

      showSuccess(`${files.length} 张图片上传成功`);
      // 重置 gallery 状态并重新加载
      resetGalleryCursor();
      setIvs([]);
      setHasMore(true);
      initialDoneRef.current = false;
    } catch (err) {
      showFailed(err.message || '上传失败');
    } finally {
      setUploading(false);
      // 清空 input 以便再次选择相同文件
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }, [showSuccess, showFailed, setIvs, setHasMore]);

  return (
    <div className="gallery-page">
      <section id="header">
        <span>Gallery</span>
        {canUpload && (
          <div className={addContent.container} onClick={() => fileInputRef.current?.click()}>
            <CommonBtn className={addContent.new} text={uploading ? 'Uploading...' : 'Upload'} />
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              multiple
              style={{ display: 'none' }}
              onChange={handleUpload}
              disabled={uploading}
            />
          </div>
        )}
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
