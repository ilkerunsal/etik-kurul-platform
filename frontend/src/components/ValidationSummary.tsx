type ValidationTone = "error" | "neutral" | "success";

interface ValidationSummaryProps {
  emptyMessage?: string;
  items: string[];
  title: string;
  tone?: ValidationTone;
}

export function ValidationSummary({
  emptyMessage,
  items,
  title,
  tone = "neutral",
}: ValidationSummaryProps) {
  if (items.length === 0 && !emptyMessage) {
    return null;
  }

  return (
    <section className={`validation-summary validation-summary--${tone}`}>
      <strong>{title}</strong>
      {items.length > 0 ? (
        <ul>
          {items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      ) : (
        <p>{emptyMessage}</p>
      )}
    </section>
  );
}
