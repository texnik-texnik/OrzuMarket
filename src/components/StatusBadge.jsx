import { orderStatusLabels } from '../services/marketplace';

export function StatusBadge({ status }) {
  return <span className={`status status-${status}`}>{orderStatusLabels[status] ?? status}</span>;
}
