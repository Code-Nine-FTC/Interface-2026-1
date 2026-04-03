import { createContext, useContext, useState, ReactNode } from "react";

type TitleContextType = {
    title: string;
    setTitle: (title: string) => void;
};

const TitleContext = createContext({} as TitleContextType);

export function TitleProvider({ children }: { children: ReactNode }) {
    const [title, setTitle] = useState("Default");

    return (
        <TitleContext.Provider value={{ title, setTitle }}>
            {children}
        </TitleContext.Provider>
    );
}

export function useTitle() {
    return useContext(TitleContext);
}