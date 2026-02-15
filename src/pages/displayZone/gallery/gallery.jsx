import React, { useContext, useEffect, useState } from 'react';
import { loadGallery } from '../../../utils/loadGallery';
import IvPreview from '../../../components/ui/image_video_preview/ivPreview';
import { base64toObjectUrl } from '../../../utils/base64toObjectUrl';
import { GalleryContext } from './context/galleryContext';
import './gallery.less';

const Gallery = () => {
  const [ivs, setIvs] = useContext(GalleryContext);

  useEffect(() => {
    if (ivs.length > 0) return; // 已有数据（例如从其他路由返回），不重复请求
    async function f() {
      try {
        const data = await loadGallery();
        setIvs(prev => [...prev, ...(data?.files || [])]);
      } catch (e) {
        console.error('图库加载失败:', e.message);
      }
    }
    f();
  }, [setIvs, ivs.length]);

  const [prs, setPrs] = useState([]);
  useEffect(() => {
    const ivUrls = base64toObjectUrl(ivs);
    setPrs(ivUrls.map(item => [item.url, 'image']));
  }, [ivs]);

  return (
    <div className="gallery-page">
      <section id="header">
        <span>{'Gallery'}</span>
      </section>
      <section id="gallery" className="gallery-page__grid">
        {prs.length > 0 ? (
          <IvPreview items={prs} prefix="gallery_iv" />
        ) : (
          <p className="gallery-page__empty">暂无图片，稍后再来看看吧</p>
        )}
      </section>
    </div>
  );
};

export default Gallery;
