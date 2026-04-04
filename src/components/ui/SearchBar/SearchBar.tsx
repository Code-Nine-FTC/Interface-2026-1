import { useEffect, useState } from "react";
import styles from "./SearchBar.module.css";

type Size = "sm" | "md" | "lg";

function normalizeSearchText(value: string): string {
    return value
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim();
}

export type SearchItem = {
    id?: string | number;
    label: string;
    meta?: unknown;
};

interface SearchBarProps {
    size?: Size;
    
    data?: SearchItem[];
    
    onSearch?: (value: string) => void | Promise<SearchItem[]>;

    onSelect?: (item: SearchItem) => void;
}

export default function SearchBar({
                                      size = "md",
                                      data,
                                      onSearch,
                                      onSelect,
                                  }: SearchBarProps) {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<SearchItem[]>(data ?? []);
    const [isOpen, setIsOpen] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState<number>(-1);

    useEffect(() => {
        if (onSearch) return;

        const source = data ?? [];
        const normalizedQuery = normalizeSearchText(query);

        if (!normalizedQuery) {
            setResults(source);
            return;
        }

        setResults(
            source.filter((item) =>
                normalizeSearchText(item.label).includes(normalizedQuery)
            )
        );
    }, [data, onSearch, query]);

    const filterLocalData = (value: string) => {
        const source = data ?? [];
        const normalizedValue = normalizeSearchText(value);

        return source.filter((item) =>
            normalizeSearchText(item.label).includes(normalizedValue)
        );
    };

    const handleSearch = async (value: string) => {
        setQuery(value);

        if (!value) {
            const source = data ?? [];
            setResults(source);
            setIsOpen(source.length > 0);
            setSelectedIndex(-1);
            return;
        }

        if (onSearch) {
            const response = await onSearch(value);

            if (Array.isArray(response)) {
                setResults(response);
                setIsOpen(response.length > 0);
                setSelectedIndex(-1);
            } else {
                setIsOpen(true);
            }

            return;
        }

        const filtered = filterLocalData(value);

        setResults(filtered);
        setIsOpen(filtered.length > 0);
        setSelectedIndex(-1);
    };

    const selectItem = (item: SearchItem) => {
        setQuery(item.label);
        setIsOpen(false);
        setSelectedIndex(-1);

        onSelect?.(item);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (!isOpen) return;

        if (e.key === "ArrowDown") {
            e.preventDefault();
            setSelectedIndex(prev =>
                prev < results.length - 1 ? prev + 1 : 0
            );
        }

        if (e.key === "ArrowUp") {
            e.preventDefault();
            setSelectedIndex(prev =>
                prev > 0 ? prev - 1 : results.length - 1
            );
        }

        if (e.key === "Enter") {
            e.preventDefault();

            if (selectedIndex >= 0) {
                selectItem(results[selectedIndex]);
            } else if (results.length > 0) {
                selectItem(results[0]);
            }
        }

        if (e.key === "Escape") {
            setIsOpen(false);
        }
    };

    return (
        <div className={`${styles.container} ${styles[size]}`}>
            <div className={styles.inputWrapper}>
                <input
                    type="text"
                    placeholder="Pesquisar Município ou Região..."
                    value={query}
                    onChange={(e) => {
                        const value = e.target.value;
                        setQuery(value);
                        handleSearch(value);
                    }}
                    onKeyDown={handleKeyDown}
                    onFocus={() => {
                        if (results.length > 0) setIsOpen(true);
                    }}
                    className={styles.input}
                />

                <button
                    type="button"
                    className={styles.iconButton}
                    onClick={() => {
                        if (results.length > 0) {
                            selectItem(results[0]);
                        }
                    }}
                >
                    <svg
                        width="24"
                        height="24"
                        viewBox="0 0 32 32"
                        fill="none"
                    >
                        <path
                            d="M28 28L22.2134 22.2134"
                            stroke="var(--orange-main)"
                            strokeWidth="3"
                            strokeLinecap="round"
                        />
                        <path
                            d="M14.6667 25.3333C20.5577 25.3333 25.3333 20.5577 25.3333 14.6667C25.3333 8.77563 20.5577 4 14.6667 4C8.77563 4 4 8.77563 4 14.6667C4 20.5577 8.77563 25.3333 14.6667 25.3333Z"
                            stroke="var(--orange-main)"
                            strokeWidth="3"
                            strokeLinecap="round"
                        />
                    </svg>
                </button>
            </div>

            {isOpen && results.length > 0 && (
                <div className={styles.dropdown}>
                    {results.map((item, index) => (
                        <div
                            key={item.id ?? index}
                            className={`${styles.item} ${
                                index === selectedIndex ? styles.active : ""
                            }`}
                            onClick={() => selectItem(item)}
                        >
                            {item.label}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}