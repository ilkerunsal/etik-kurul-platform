import { formatDate } from "../app/formatters";
import type { ActivityEntry } from "../types";

export function ActivityFeed({ activity }: { activity: ActivityEntry[] }) {
  if (activity.length === 0) {
    return <p className="empty-note">Henuz islem yapilmadi. Kayit adimiyla baslayin.</p>;
  }

  return (
    <ul className="activity-list">
      {activity.map((entry) => (
        <li key={entry.id} className={`activity-item activity-item--${entry.tone}`}>
          <strong>{entry.message}</strong>
          <span>{formatDate(entry.timestamp)}</span>
        </li>
      ))}
    </ul>
  );
}
