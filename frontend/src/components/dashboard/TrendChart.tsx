import React, { useState } from 'react';
import type { WeeklyTrendItem } from '../../types';

interface TrendChartProps {
  data: WeeklyTrendItem[];
}

export const TrendChart: React.FC<TrendChartProps> = ({ data }) => {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const highestReviews = Math.max(...data.map((d) => d.totalReviews), 10);
  const rawMaxReviews = highestReviews * 1.25;
  const reviewStep =
    rawMaxReviews <= 80
      ? 20
      : rawMaxReviews <= 200
      ? 40
      : rawMaxReviews <= 600
      ? 100
      : 200;
  const maxReviews = Math.max(40, Math.ceil(rawMaxReviews / reviewStep) * reviewStep);

  const highestNegPct = Math.max(...data.map((d) => d.negativePct), 20);
  const maxNegPct =
    highestNegPct <= 36 ? 40 : highestNegPct <= 56 ? 60 : highestNegPct <= 76 ? 80 : 100;

  const chartHeight = 160;
  const chartWidth = 500;
  const paddingLeft = 40;
  const paddingRight = 40;
  const paddingTop = 20;
  const paddingBottom = 30;

  const usableWidth = chartWidth - paddingLeft - paddingRight;
  const usableHeight = chartHeight - paddingTop - paddingBottom;

  const stepX = data.length > 1 ? usableWidth / (data.length - 1) : usableWidth / 2;

  const linePoints = data.map((item, idx) => {
    const x = paddingLeft + idx * stepX;
    const clampedPct = Math.min(maxNegPct, Math.max(0, item.negativePct));
    const y = paddingTop + usableHeight - (clampedPct / maxNegPct) * usableHeight;
    return { x, y, ...item };
  });

  const pathD = linePoints.reduce(
    (acc, pt, idx) => (idx === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`),
    ''
  );

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between h-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2">
        <div>
          <h3 className="text-base font-bold text-slate-900 tracking-tight">Trend over time</h3>
          <p className="text-xs text-slate-500 mt-0.5">Reviews and sentiment over the last 6 weeks.</p>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-emerald-200" />
            <span className="text-slate-600 font-medium text-[11px]">Total reviews</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-emerald-700" />
            <span className="text-slate-600 font-medium text-[11px]">Negative %</span>
          </div>
        </div>
      </div>

      <div className="relative w-full overflow-hidden mt-3">
        <svg
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          className="w-full h-auto overflow-visible select-none"
        >
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
            const y = paddingTop + usableHeight * (1 - ratio);
            const reviewVal = Math.round(ratio * maxReviews);
            const pctVal = Math.round(ratio * maxNegPct);
            return (
              <g key={i} className="text-[9px] fill-slate-400">
                <line
                  x1={paddingLeft}
                  y1={y}
                  x2={chartWidth - paddingRight}
                  y2={y}
                  stroke="#F1F5F9"
                  strokeWidth="1"
                />
                <text x={paddingLeft - 8} y={y + 3} textAnchor="end">
                  {reviewVal >= 1000 ? `${reviewVal / 1000}K` : reviewVal}
                </text>
                <text x={chartWidth - paddingRight + 8} y={y + 3} textAnchor="start">
                  {pctVal}%
                </text>
              </g>
            );
          })}

          {data.map((item, idx) => {
            const x = paddingLeft + idx * stepX - 12;
            const barHeight = (item.totalReviews / maxReviews) * usableHeight;
            const y = paddingTop + usableHeight - barHeight;
            const isHovered = hoverIndex === idx;

            return (
              <rect
                key={`bar-${idx}`}
                x={x}
                y={y}
                width={24}
                height={barHeight}
                rx={4}
                className={`transition-all duration-200 cursor-pointer ${
                  isHovered ? 'fill-emerald-400' : 'fill-emerald-100/90'
                }`}
                onMouseEnter={() => setHoverIndex(idx)}
                onMouseLeave={() => setHoverIndex(null)}
              />
            );
          })}

          <path
            d={pathD}
            fill="none"
            stroke="#047857"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {linePoints.map((pt, idx) => {
            const isHovered = hoverIndex === idx;
            return (
              <g key={`point-${idx}`}>
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={isHovered ? 5 : 3.5}
                  className="fill-white stroke-emerald-800 transition-all duration-150 cursor-pointer"
                  strokeWidth="2"
                  onMouseEnter={() => setHoverIndex(idx)}
                  onMouseLeave={() => setHoverIndex(null)}
                />
                <text
                  x={pt.x}
                  y={chartHeight - 8}
                  textAnchor="middle"
                  className="text-[10px] fill-slate-500 font-medium"
                >
                  {pt.week}
                </text>
              </g>
            );
          })}
        </svg>

        {hoverIndex !== null && data[hoverIndex] && (
          <div
            className="absolute top-2 pointer-events-none bg-slate-900 text-white px-2.5 py-1.5 rounded-lg text-xs shadow-lg transform -translate-x-1/2"
            style={{
              left: `${((paddingLeft + hoverIndex * stepX) / chartWidth) * 100}%`,
            }}
          >
            <p className="font-bold text-[11px] text-emerald-400">{data[hoverIndex].week}</p>
            <p className="text-[11px] text-slate-200">
              Reviews: <span className="font-semibold text-white">{data[hoverIndex].totalReviews}</span>
            </p>
            <p className="text-[11px] text-slate-200">
              Negative: <span className="font-semibold text-rose-300">{data[hoverIndex].negativePct}%</span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
