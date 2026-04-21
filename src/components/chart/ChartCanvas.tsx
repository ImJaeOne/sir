'use client';

import { useEffect, useRef, useState } from 'react';
import { ResponsiveContainer } from 'recharts';
import type { CSSProperties, ReactElement } from 'react';

type ChartDimension = number | `${number}%`;

interface ChartCanvasProps {
  children: ReactElement;
  className?: string;
  style?: CSSProperties;
  /** 기본 '100%'. 숫자면 고정 px, 퍼센트면 측정된 래퍼 치수의 비율. */
  width?: ChartDimension;
  height?: ChartDimension;
}

/**
 * Recharts `ResponsiveContainer` 를 감싸서 실측 픽셀 값을 숫자로 전달.
 *
 * 왜 이렇게까지 하는가:
 * - `ResponsiveContainer` 는 초기에 `width=-1, height=-1` 센티넬로 시작한 뒤
 *   자체 measure 사이클에서 보정한다. 이 첫 틱에 "width(-1) height(-1) ..."
 *   콘솔 경고가 찍힌다 (recharts #172).
 * - ResizeObserver 로 부모 치수를 먼저 잡고 숫자로 넘기면 measure 사이클이
 *   아예 작동하지 않아 경고가 사라지고, 탭 전환/로딩 직후 빈 치수 상태에서
 *   차트가 찌그러지는 문제도 함께 해결된다.
 */
export function ChartCanvas({
  children,
  className,
  style,
  width = '100%',
  height = '100%',
}: ChartCanvasProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => {
      const r = el.getBoundingClientRect();
      if (r.width > 0 && r.height > 0) setSize({ w: r.width, h: r.height });
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // 숫자 치수는 래퍼 div 에도 반영 (부모 높이가 0 이어도 측정 가능하도록)
  const wrapperWidth = typeof width === 'number' ? width : '100%';
  const wrapperHeight = typeof height === 'number' ? height : '100%';

  const finalWidth = resolveDimension(width, size?.w ?? 0);
  const finalHeight = resolveDimension(height, size?.h ?? 0);

  return (
    <div
      ref={ref}
      className={className}
      style={{ width: wrapperWidth, height: wrapperHeight, ...style }}
    >
      {size && finalWidth > 0 && finalHeight > 0 && (
        <ResponsiveContainer width={finalWidth} height={finalHeight}>
          {children}
        </ResponsiveContainer>
      )}
    </div>
  );
}

function resolveDimension(d: ChartDimension, measured: number): number {
  if (typeof d === 'number') return d;
  const pct = parseFloat(d.replace('%', ''));
  if (Number.isNaN(pct)) return measured;
  return Math.round((pct / 100) * measured);
}
