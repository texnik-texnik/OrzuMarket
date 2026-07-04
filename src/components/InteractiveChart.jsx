import React, { useState } from 'react';

export function InteractiveChart({ data, lang, currency, t }) {
  const [hoveredIdx, setHoveredIdx] = useState(null);

  if (!data || data.length === 0) {
    return (
      <div className="chart-empty">
        <p>{t('chartNoData')}</p>
      </div>
    );
  }

  // Dimensions
  const svgWidth = 600;
  const svgHeight = 260;
  const padding = { top: 30, right: 30, bottom: 40, left: 65 };

  const chartWidth = svgWidth - padding.left - padding.right;
  const chartHeight = svgHeight - padding.top - padding.bottom;

  // Find max value for Y-axis
  const maxRawValue = Math.max(...data.map(d => d.value), 0);
  const maxValue = maxRawValue === 0 ? 1000 : Math.ceil(maxRawValue * 1.15);

  // Helper for coordinates
  const getX = (index) => {
    if (data.length <= 1) return padding.left + chartWidth / 2;
    return padding.left + (index / (data.length - 1)) * chartWidth;
  };

  const getY = (val) => {
    return padding.top + chartHeight - (val / maxValue) * chartHeight;
  };

  // Generate points
  const points = data.map((d, i) => ({
    x: getX(i),
    y: getY(d.value),
    item: d,
    index: i
  }));

  // Build SVG path strings
  let linePath = '';
  let areaPath = '';

  if (points.length > 0) {
    // Generate simple straight line paths (extremely clean and professional)
    linePath = `M ${points[0].x} ${points[0].y} ` + points.slice(1).map(p => `L ${p.x} ${p.y}`).join(' ');
    areaPath = `${linePath} L ${points[points.length - 1].x} ${padding.top + chartHeight} L ${points[0].x} ${padding.top + chartHeight} Z`;
  }

  // Y axis grid lines (4 lines: 0, 33%, 66%, 100%)
  const gridTicks = [0, 0.33, 0.66, 1];

  const formatCurrency = (val) => {
    return Math.round(val).toLocaleString(lang === 'tg' ? 'tg-TJ' : 'ru-RU');
  };

  const activePoint = hoveredIdx !== null ? points[hoveredIdx] : null;

  return (
    <div className="chart-wrapper">
      <div className="chart-header-row">
        <h3>{t('chartSalesDynamics')}</h3>
        <div className="chart-legend-wrap">
          {activePoint ? (
            <div className="chart-legend-active animate-fade-in">
              <span className="legend-date">{activePoint.item.fullDate}: </span>
              <strong className="legend-value">{formatCurrency(activePoint.item.value)} {currency}</strong>
              <span className="legend-orders"> ({activePoint.item.count} {t('chartOrders').toLowerCase()})</span>
            </div>
          ) : (
            <span className="chart-legend-hint">{t('chartDetails')}</span>
          )}
        </div>
      </div>

      <div className="chart-container-relative">
        <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} width="100%" height="auto" className="chart-svg">
          <defs>
            <linearGradient id="chartAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.25" />
              <stop offset="100%" stopColor="var(--primary)" stopOpacity="0.00" />
            </linearGradient>
            <linearGradient id="chartLineGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="var(--primary)" />
              <stop offset="100%" stopColor="var(--accent)" />
            </linearGradient>
            <filter id="shadow" x="-5%" y="-10%" width="110%" height="130%">
              <feDropShadow dx="0" dy="6" stdDeviation="4" floodColor="var(--primary)" floodOpacity="0.2" />
            </filter>
          </defs>

          {/* Grid lines */}
          {gridTicks.map((tick, i) => {
            const val = tick * maxValue;
            const y = getY(val);
            return (
              <g key={i} className="chart-grid-group">
                <line
                  x1={padding.left}
                  y1={y}
                  x2={svgWidth - padding.right}
                  y2={y}
                  className="chart-grid-line"
                />
                <text
                  x={padding.left - 12}
                  y={y + 4}
                  textAnchor="end"
                  className="chart-grid-label"
                >
                  {formatCurrency(val)}
                </text>
              </g>
            );
          })}

          {/* Area under line */}
          {points.length > 0 && (
            <path d={areaPath} fill="url(#chartAreaGrad)" className="chart-area-path" />
          )}

          {/* Stroke line */}
          {points.length > 0 && (
            <path
              d={linePath}
              fill="none"
              stroke="url(#chartLineGrad)"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              filter="url(#shadow)"
              className="chart-line-path"
            />
          )}

          {/* X axis dates */}
          {points.map((p, i) => (
            <text
              key={i}
              x={p.x}
              y={svgHeight - padding.bottom + 22}
              textAnchor="middle"
              className="chart-axis-label"
            >
              {p.item.dateLabel}
            </text>
          ))}

          {/* Active indicator vertical line */}
          {activePoint && (
            <line
              x1={activePoint.x}
              y1={padding.top}
              x2={activePoint.x}
              y2={padding.top + chartHeight}
              className="chart-active-vertical-line"
            />
          )}

          {/* Interactive touch/hover points */}
          {points.map((p, i) => (
            <g key={i}>
              <circle
                cx={p.x}
                cy={p.y}
                r={hoveredIdx === i ? 6 : 4}
                className={`chart-point-circle ${hoveredIdx === i ? 'active' : ''}`}
              />
              {/* Invisible interactive overlay area for easy hovering */}
              <rect
                x={p.x - (chartWidth / (data.length - 1 || 1)) / 2}
                y={padding.top}
                width={chartWidth / (data.length - 1 || 1)}
                height={chartHeight}
                fill="transparent"
                className="chart-hover-overlay"
                onMouseEnter={() => setHoveredIdx(i)}
                onMouseMove={() => setHoveredIdx(i)}
                onMouseLeave={() => setHoveredIdx(null)}
              />
            </g>
          ))}
        </svg>

        {/* HTML Tooltip overlay */}
        {activePoint && (
          <div
            className="chart-html-tooltip"
            style={{
              left: `${(activePoint.x / svgWidth) * 100}%`,
              top: `${(activePoint.y / svgHeight) * 100 - 10}%`,
            }}
          >
            <span className="tooltip-date">{activePoint.item.fullDate}</span>
            <span className="tooltip-val">
              {formatCurrency(activePoint.item.value)} {currency}
            </span>
            <span className="tooltip-count">
              {activePoint.item.count} {t('chartOrders').toLowerCase()}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
