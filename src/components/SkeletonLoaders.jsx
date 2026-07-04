import React from 'react';

export function ProductCardSkeleton() {
  return (
    <article className="product-card skeleton-card">
      <div className="skeleton-image skeleton-shimmer"></div>
      <div className="product-body">
        <div className="product-title-row">
          <div className="skeleton-title skeleton-shimmer"></div>
          <div className="skeleton-price skeleton-shimmer"></div>
        </div>
        <div className="skeleton-desc skeleton-shimmer"></div>
        <div className="skeleton-desc short skeleton-shimmer"></div>
        <div className="skeleton-meta skeleton-shimmer"></div>
        <div className="skeleton-button skeleton-shimmer"></div>
      </div>
    </article>
  );
}

export function TableRowSkeleton({ columns = 5 }) {
  return (
    <tr className="skeleton-table-row">
      {Array.from({ length: columns }).map((_, idx) => (
        <td key={idx}>
          {idx === 0 ? (
            <div className="skeleton-td-pill img skeleton-shimmer"></div>
          ) : idx === columns - 1 ? (
            <div className="skeleton-td-pill btn skeleton-shimmer"></div>
          ) : (
            <div className="skeleton-td-pill skeleton-shimmer"></div>
          )}
        </td>
      ))}
    </tr>
  );
}
