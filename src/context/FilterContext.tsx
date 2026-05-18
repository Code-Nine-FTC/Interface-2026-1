import { createContext, useContext, useState, type ReactNode } from "react";

export interface ActiveFilter {
    id: number;
    label: string;
    checked: boolean;
}

interface FilterContextType {
    selectedMunicipioId: number | null;
    selectedMunicipioNome: string | null;
    activeFilters: ActiveFilter[];
    setSelectedMunicipio: (id: number | null, nome: string | null) => void;
    setActiveFilters: (filters: ActiveFilter[]) => void;
    clearFilters: () => void;
}

const FilterContext = createContext<FilterContextType>({} as FilterContextType);

export function FilterProvider({ children }: { children: ReactNode }) {
    const [selectedMunicipioId, setSelectedMunicipioId] = useState<number | null>(null);
    const [selectedMunicipioNome, setSelectedMunicipioNome] = useState<string | null>(null);
    const [activeFilters, setActiveFilters] = useState<ActiveFilter[]>([]);

    const setSelectedMunicipio = (id: number | null, nome: string | null) => {
        setSelectedMunicipioId(id);
        setSelectedMunicipioNome(nome);
    };

    const clearFilters = () => {
        setSelectedMunicipioId(null);
        setSelectedMunicipioNome(null);
        setActiveFilters([]);
    };

    return (
        <FilterContext.Provider
            value={{
                selectedMunicipioId,
                selectedMunicipioNome,
                activeFilters,
                setSelectedMunicipio,
                setActiveFilters,
                clearFilters,
            }}
        >
            {children}
        </FilterContext.Provider>
    );
}

export function useFilter() {
    return useContext(FilterContext);
}
