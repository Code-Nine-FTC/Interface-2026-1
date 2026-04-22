import { useMemo } from "react";
import styles from "./ChatInput.module.css";

interface Props {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
}

export default function ChatInput({ value, onChange, onSend }: Props) {
  const isExpanded = useMemo(() => {
    return value.includes("\n") || value.length > 60;
  }, [value]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  return (
    <div className={`${styles.inputArea} ${isExpanded ? styles.expanded : ""}`}>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Escreva sua mensagem aqui..."
        className={styles.input}
      />

      <button onClick={onSend} className={styles.sendButton}>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="var(--background-primary)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m15 17 5-5-5-5" />
          <path d="M4 18v-2a4 4 0 0 1 4-4h12" />
        </svg>
      </button>
    </div>
  );
}