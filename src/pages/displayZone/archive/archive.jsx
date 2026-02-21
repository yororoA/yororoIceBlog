import React, { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import archive from './archive.module.less';
import { getArchiveData, getArchiveStats } from '../../../utils/archive';
import { ArchiveListContext } from './context/archiveListContext';

const ArchiveItem = ({ item }) => {
  const { _id, type, title, createdAt, username } = item;
  const navigate = useNavigate();

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTypeLabel = (type) => {
    const typeMap = {
      'moment': 'Moment',
      'knowledge': 'Article'
    };
    return typeMap[type] || type;
  };

  const getTypeColor = (type) => {
    const colorMap = {
      'moment': 'rgba(255, 193, 7, 1)',
      'knowledge': 'rgba(33, 150, 243, 1)'
    };
    return colorMap[type] || 'rgba(158, 158, 158, 1)';
  };

  const handleClick = () => {
    if (type === 'moment') {
      navigate(`/town/moments?mid=${_id}`);
    } else if (type === 'knowledge') {
      navigate(`/town/articles?kid=${_id}`);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  };

  const isClickable = type === 'moment' || type === 'knowledge';

  return (
    <div className={archive.item}>
      <div className={archive.timelineSide}>
        <div 
          className={archive.dot}
          style={{ backgroundColor: getTypeColor(type) }}
        />
        <div className={archive.line} />
      </div>
      <div
        className={`${archive.itemContent} ${isClickable ? archive.itemContentClickable : ''}`}
        onClick={isClickable ? handleClick : undefined}
        role={isClickable ? 'button' : undefined}
        tabIndex={isClickable ? 0 : undefined}
        onKeyDown={isClickable ? handleKeyDown : undefined}
      >
        <div className={archive.itemHeader}>
          <span 
            className={archive.type}
            style={{ 
              backgroundColor: `${getTypeColor(type)}15`,
              color: getTypeColor(type)
            }}
          >
            {getTypeLabel(type)}
          </span>
          <span className={archive.date}>{formatDate(createdAt)}</span>
        </div>
        {title && <h4 className={archive.itemTitle}>{title}</h4>}
        {username && (
          <div className={archive.meta}>
            <span>By {username}</span>
          </div>
        )}
        {isClickable && (
          <span className={archive.viewHint}>
            View detail
            <span className={archive.viewArrow} aria-hidden>→</span>
          </span>
        )}
      </div>
    </div>
  );
};

const Archive = () => {
  const [archiveData, setArchiveData, stats, setStats, years, setYears] = useContext(ArchiveListContext);
  const [filteredData, setFilteredData] = useState([]);
  const [selectedType, setSelectedType] = useState('all');
  const [selectedYear, setSelectedYear] = useState('all');
  const [loading, setLoading] = useState(false);
  const yearsInitialized = useRef(false);

  // Fetch all archive data：首次无数据时拉取并写入 context，避免切换路由重复加载
  const fetchArchiveData = useCallback(async () => {
    setLoading(true);
    try {
      // Always fetch all data; filter locally by year
      const data = await getArchiveData({ type: selectedType });
      setArchiveData(data);

      // Only compute years once from the full dataset
      if (!yearsInitialized.current && years.length === 1 && years[0] === 'all') {
        const yearSet = new Set(data.map(item =>
          new Date(item.createdAt).getFullYear()
        ));
        setYears(['all', ...Array.from(yearSet).sort((a, b) => b - a)]);
        yearsInitialized.current = true;
      }

      // Stats（只在首次或stats为空时获取）
      if (Object.keys(stats).length === 0) {
        const statsData = await getArchiveStats();
        setStats({
          total: data.length,
          moment: statsData.moments || 0,
          knowledge: statsData.articles || 0,
          photos: statsData.photos || 0
        });
      }

    } catch (err) {
      console.error('Failed to fetch archive data:', err);
      // Fallback mock data
      const mockData = [
        {
          _id: '1',
          type: 'moment',
          title: 'Great day',
          content: 'The weather is nice today and I learned some new things!',
          createdAt: new Date().toISOString(),
          username: 'UserA'
        },
        {
          _id: '2',
          type: 'knowledge',
          title: 'React Hooks Guide',
          content: 'React Hooks were introduced in React 16.8...',
          createdAt: new Date(Date.now() - 86400000).toISOString(),
          username: 'Admin'
        },
        {
          _id: '3',
          type: 'gallery',
          title: 'Beautiful scenery',
          content: 'Sharing a set of landscape photos',
          createdAt: new Date(Date.now() - 172800000).toISOString(),
          username: 'UserB'
        },
        {
          _id: '5',
          type: 'moment',
          title: 'Study notes',
          content: 'Explored TypeScript advanced types today...',
          createdAt: new Date(Date.now() - 345600000).toISOString(),
          username: 'UserA'
        },
        {
          _id: '6',
          type: 'knowledge',
          title: 'CSS Grid Complete Guide',
          content: 'CSS Grid is a two-dimensional layout system...',
          createdAt: new Date('2025-12-15').toISOString(),
          username: 'Admin'
        },
        {
          _id: '7',
          type: 'moment',
          title: 'Year-end review',
          content: 'Reflecting on the growth of 2025...',
          createdAt: new Date('2025-12-31').toISOString(),
          username: 'UserA'
        }
      ];

      setArchiveData(mockData);

      if (!yearsInitialized.current) {
        const yearSet = new Set(mockData.map(item =>
          new Date(item.createdAt).getFullYear()
        ));
        setYears(['all', ...Array.from(yearSet).sort((a, b) => b - a)]);
        yearsInitialized.current = true;
      }

      const statsData = mockData.reduce((acc, item) => {
        acc[item.type] = (acc[item.type] || 0) + 1;
        acc.total = (acc.total || 0) + 1;
        return acc;
      }, {});
      setStats(statsData);
    } finally {
      setLoading(false);
    }
  }, [selectedType, years, stats, setArchiveData, setYears, setStats]);

  useEffect(() => {
    // 只在首次加载或数据为空时请求
    if (archiveData.length === 0) {
      fetchArchiveData();
    }
  }, [archiveData.length, fetchArchiveData]);

  // Filter data locally
  useEffect(() => {
    let result = archiveData;

    // Exclude comment type items
    result = result.filter(item => item.type !== 'comment');

    // Filter by type
    if (selectedType !== 'all') {
      result = result.filter(item => item.type === selectedType);
    }

    // Filter by year locally
    if (selectedYear !== 'all') {
      result = result.filter(item =>
        new Date(item.createdAt).getFullYear() === parseInt(selectedYear)
      );
    }

    // Sort by date descending
    result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    setFilteredData(result);
  }, [archiveData, selectedType, selectedYear]);

  const types = [
    { value: 'all', label: 'All' },
    { value: 'moment', label: 'Moments' },
    { value: 'knowledge', label: 'Articles' }
  ];

  return (
    <>
      <section id="header">
        <span>Archive</span>
      </section>

      <div className={archive.stats}>
        <div className={archive.statItem}>
          <div className={archive.statValue}>{stats.total || 0}</div>
          <div className={archive.statLabel}>Total</div>
        </div>
        <div className={archive.statItem}>
          <div className={archive.statValue}>{stats.moment || 0}</div>
          <div className={archive.statLabel}>Moments</div>
        </div>
        <div className={archive.statItem}>
          <div className={archive.statValue}>{stats.knowledge || 0}</div>
          <div className={archive.statLabel}>Articles</div>
        </div>
        <div className={archive.statItem}>
          <div className={archive.statValue}>{stats.photos || 0}</div>
          <div className={archive.statLabel}>Photos</div>
        </div>
      </div>

      <div className={archive.filters}>
        <div className={archive.filterGroup}>
          <span className={archive.filterLabel}>Type:</span>
          <div className={archive.filterBtns}>
            {types.map(type => (
              <button
                key={type.value}
                className={`${archive.filterBtn} ${selectedType === type.value ? archive.active : ''}`}
                onClick={() => setSelectedType(type.value)}
              >
                {type.label}
              </button>
            ))}
          </div>
        </div>
        <div className={archive.filterGroup}>
          <span className={archive.filterLabel}>Year:</span>
          <div className={archive.filterBtns}>
            {years.map(year => (
              <button
                key={year}
                className={`${archive.filterBtn} ${selectedYear === String(year) ? archive.active : ''}`}
                onClick={() => setSelectedYear(String(year))}
              >
                {year === 'all' ? 'All' : year}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className={archive.timelineWrap}>
        {loading ? (
          <div className={archive.loading}>
            <span className={archive.loadingDot} />
            Loading...
          </div>
        ) : filteredData.length === 0 ? (
          <div className={archive.empty}>
            <p className={archive.emptyText}>No entries in this filter.</p>
            <p className={archive.emptyHint}>Try changing type or year.</p>
          </div>
        ) : (
          <div className={archive.list} role="list">
            <div className={archive.timelineTrack} aria-hidden="true" />
            {filteredData.map(item => (
              <ArchiveItem key={item._id} item={item} />
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default Archive;
