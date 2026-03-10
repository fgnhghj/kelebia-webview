import { useState, useRef, useCallback } from 'react';
import { RefreshCw } from 'lucide-react';

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
}

export default function PullToRefresh({ onRefresh, children }: PullToRefreshProps) {
  const [pulling, setPulling] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const THRESHOLD = 70;

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (containerRef.current && containerRef.current.scrollTop === 0) {
      startY.current = e.touches[0].clientY;
      setPulling(true);
    }
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!pulling || refreshing) return;
    const diff = e.touches[0].clientY - startY.current;
    if (diff > 0) {
      // Diminishing returns beyond threshold
      setPullDistance(Math.min(diff * 0.5, 120));
    }
  }, [pulling, refreshing]);

  const handleTouchEnd = useCallback(async () => {
    if (!pulling) return;
    setPulling(false);

    if (pullDistance >= THRESHOLD && !refreshing) {
      setRefreshing(true);
      setPullDistance(THRESHOLD * 0.6);
      try {
        await onRefresh();
      } catch { /* ignore */ }
      setRefreshing(false);
    }
    setPullDistance(0);
  }, [pulling, pullDistance, refreshing, onRefresh]);

  return (
    <div
      ref={containerRef}
      className="pull-to-refresh-container"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{ position: 'relative', overflow: 'auto', height: '100%' }}
    >
      {/* Pull indicator */}
      <div
        className="pull-indicator"
        style={{
          height: pullDistance,
          opacity: Math.min(pullDistance / THRESHOLD, 1),
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: pulling ? 'none' : 'height 0.3s ease, opacity 0.3s ease',
          overflow: 'hidden',
        }}
      >
        <RefreshCw
          size={20}
          className={refreshing ? 'animate-spin' : ''}
          style={{
            color: 'var(--accent)',
            transform: `rotate(${Math.min(pullDistance / THRESHOLD, 1) * 360}deg)`,
            transition: pulling ? 'none' : 'transform 0.3s ease',
          }}
        />
      </div>
      {children}
    </div>
  );
}
