import React, { useCallback, useContext, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import styles from './lol.module.less';
import Pop from '../../../components/ui/pop/pop';
import { UiPersistContext } from '../context/uiPersistContext';
import { t } from '../../../i18n/uiText';

const ITEMS = [
  {
    id: 'function-speed-player',
    title: '基于函数值的视频变速播放器',
    description: '通过数学公式、预设或手绘曲线控制音视频播放速率的可视化小工具。',
    iframeSrc: '/lol/function-speed-player.html',
  },
];

const LoL = () => {
  const { locale } = useContext(UiPersistContext);
  const location = useLocation();
  const navigate = useNavigate();
  const [activeId, setActiveId] = useState(null);
  const activeItem = ITEMS.find((item) => item.id === activeId) || null;

  const openItem = useCallback((id) => {
    setActiveId(id);
    navigate({ hash: id }, { replace: true });
  }, [navigate]);

  const handleClose = useCallback(() => {
    setActiveId(null);
    navigate({ pathname: location.pathname, search: location.search, hash: '' }, { replace: true });
  }, [location.pathname, location.search, navigate]);

  useEffect(() => {
    const hash = location.hash ? location.hash.slice(1) : '';
    if (!hash) return;
    const exists = ITEMS.some((item) => item.id === hash);
    if (exists) {
      setActiveId(hash);
    }
  }, [location.hash]);

  return (
    <div className="page-enter">
      <main className={styles.page}>
        <header className={styles.header}>
          <h1 className={styles.title}>{t(locale, 'lolTitle')}</h1>
          <p className={styles.subtitle}>{t(locale, 'lolSubtitle')}</p>
        </header>

        <section className={styles.list}>
          {ITEMS.map((item) => (
            <button
              key={item.id}
              type="button"
              className={styles.card}
              onClick={() => openItem(item.id)}
            >
              <h2 className={styles.cardTitle}>{item.title}</h2>
              <p className={styles.cardDesc}>{item.description}</p>
            </button>
          ))}
        </section>
      </main>

      {activeItem && (
        <Pop onClose={handleClose}>
          <div className={styles.playerRoot}>
            <iframe
              src={activeItem.iframeSrc}
              title={activeItem.title}
              style={{ border: 'none', width: '100%', height: '82vh', borderRadius: 12 }}
            />
          </div>
        </Pop>
      )}
    </div>
  );
};

export default LoL;

