import { statusLabels } from "../app/formatters";
import type { AccountStatus } from "../types";

export function StatusBadge({ accountStatus }: { accountStatus: AccountStatus | null }) {
  if (!accountStatus) {
    return <span className="status-badge status-badge--idle">Akis hazir</span>;
  }

  return <span className={`status-badge status-badge--${accountStatus}`}>{statusLabels[accountStatus]}</span>;
}
