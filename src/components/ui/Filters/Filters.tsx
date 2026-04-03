import { useEffect, useState } from "react";
import styles from "./Filters.module.css";

export type Filter = {
    id: number;
    label: string;
    checked: boolean;
};

type FiltersProps = {
    data?: Filter[]; 
    onChange?: (filters: Filter[]) => void;
    onCreate?: (label: string) => void;
    onDelete?: (id: number) => void;
    onUpdate?: (id: number, label: string) => void;
};

export default function Filters({
                                    data,
                                    onChange,
                                    onCreate,
                                    onDelete,
                                    onUpdate,
                                }: FiltersProps) {
    const [isOpen, setIsOpen] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editingValue, setEditingValue] = useState("");
    
    const [filters, setFilters] = useState<Filter[]>(
        data || [
            { id: 1, label: "Queimadas (INPE)", checked: false },
            { id: 2, label: "Terras indígenas", checked: true },
            { id: 3, label: "Unidades de conservação", checked: false },
            { id: 4, label: "Quilombolas", checked: false },
            { id: 5, label: "Assentamentos", checked: true },
        ]
    );
    
    useEffect(() => {
        if (data) setFilters(data);
    }, [data]);

    const updateState = (newFilters: Filter[]) => {
        setFilters(newFilters);
        onChange?.(newFilters);
    };

    const toggleFilter = (id: number) => {
        const updated = filters.map((f) =>
            f.id === id ? { ...f, checked: !f.checked } : f
        );

        updateState(updated);
    };

    const deleteFilter = (id: number) => {
        const updated = filters.filter((f) => f.id !== id);

        updateState(updated);
        onDelete?.(id);
    };

    const startEditing = (id: number, label: string) => {
        setEditingId(id);
        setEditingValue(label);
    };

    const saveEdit = () => {
        if (!editingValue.trim()) {
            setEditingId(null);
            return;
        }

        if (editingId === -1) {
            const newFilter: Filter = {
                id: Date.now(),
                label: editingValue,
                checked: false,
            };

            updateState([...filters, newFilter]);
            onCreate?.(editingValue);
        } else {
            const updated = filters.map((f) =>
                f.id === editingId ? { ...f, label: editingValue } : f
            );

            updateState(updated);
            onUpdate?.(editingId!, editingValue);
        }

        setEditingId(null);
        setEditingValue("");
    };

    const startAdding = () => {
        setEditingId(-1);
        setEditingValue("");
    };

    return (
        <div className={styles.container}>
            <div
                className={styles.header}
                onClick={() => setIsOpen(!isOpen)}
            >
                <span className={styles.arrow}>{isOpen ? "▼" : "▶"}</span>
                <span className={styles.title}>Filtos por região:</span>
            </div>

            {isOpen && (
                <div className={styles.list}>
                    {filters.map((filter) => (
                        <div key={filter.id} className={styles.item}>
                            <input
                                id={`filter-${filter.id}`}
                                type="checkbox"
                                checked={filter.checked}
                                onChange={() => toggleFilter(filter.id)}
                            />
                            <label htmlFor={`filter-${filter.id}`}>
                                {filter.label}
                            </label>
                        </div>
                    ))}

                    <div
                        className={styles.expand}
                        onClick={() => setIsModalOpen(true)}
                    >
                        Expandir | Editar Filtros
                    </div>
                </div>
            )}

            {isModalOpen && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modal}>
                        <div className={styles.modalHeader}>
                            <div
                                className={styles.close}
                                onClick={() => setIsModalOpen(false)}
                            >
                                <svg className={styles.icon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M6 8L2 12L6 16"/>
                                    <path d="M2 12H22"/>
                                </svg>
                            </div>

                            <h3>Editar Filtros</h3>
                        </div>

                        <div className={styles.modalList}>
                            {filters.map((filter) => (
                                <div key={filter.id} className={styles.modalItem}>
                                    {editingId === filter.id ? (
                                        <input
                                            className={styles.editInput}
                                            value={editingValue}
                                            autoFocus
                                            onChange={(e) => setEditingValue(e.target.value)}
                                            onBlur={saveEdit}
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter") saveEdit();
                                            }}
                                        />
                                    ) : (
                                        <span>{filter.label}</span>
                                    )}

                                    <div className={styles.actions}>
                                        <button onClick={() => startEditing(filter.id, filter.label)}>
                                            <svg className={styles.icon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path d="M13 21h8" />
                                                <path d="m15 5 4 4" />
                                                <path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z" />
                                            </svg>
                                        </button>

                                        <button onClick={() => deleteFilter(filter.id)}>
                                            <svg className={styles.icon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                                                <path d="M3 6h18" />
                                                <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            ))}

                            {editingId === -1 && (
                                <div className={styles.modalItem}>
                                    <input
                                        className={styles.editInput}
                                        value={editingValue}
                                        autoFocus
                                        placeholder="Novo filtro"
                                        onChange={(e) => setEditingValue(e.target.value)}
                                        onBlur={saveEdit}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter") saveEdit();
                                        }}
                                    />
                                </div>
                            )}

                            <div className={styles.addNew} onClick={startAdding}>
                                <svg className={styles.icon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M12 2a10 10 0 0 1 7.38 16.75"/>
                                    <path d="M12 8v8"/>
                                    <path d="M16 12H8"/>
                                    <path d="M2.5 8.875a10 10 0 0 0-.5 3"/>
                                    <path d="M2.83 16a10 10 0 0 0 2.43 3.4"/>
                                    <path d="M4.636 5.235a10 10 0 0 1 .891-.857"/>
                                    <path d="M8.644 21.42a10 10 0 0 0 7.631-.38"/>
                                </svg>
                                <span>Clique aqui para adicionar</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}