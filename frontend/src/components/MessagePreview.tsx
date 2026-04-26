import { formatDate } from "../app/formatters";
import type { ContactChannelType, MockMessageResponse } from "../types";

interface MessagePreviewProps {
  channelType: ContactChannelType;
  message?: MockMessageResponse;
  onUseCode: (channelType: ContactChannelType, code: string) => void;
}

export function MessagePreview({ channelType, message, onUseCode }: MessagePreviewProps) {
  const label = channelType === "email" ? "Email" : "SMS";

  if (!message) {
    return (
      <div className="message-preview message-preview--empty">
        <span>{label} kutusu bos</span>
        <small>Kod olustugunda mock mesaj burada gorunecek.</small>
      </div>
    );
  }

  return (
    <div className="message-preview">
      <div className="message-preview__header">
        <span>{label}</span>
        <strong>{message.recipient}</strong>
      </div>
      <p>{message.body}</p>
      <div className="message-preview__footer">
        <small>{formatDate(message.sentAt)}</small>
        <button
          type="button"
          className="button button--ghost"
          onClick={() => message.code && onUseCode(channelType, message.code)}
          disabled={!message.code}
        >
          Son kodu yerlestir
        </button>
      </div>
    </div>
  );
}
