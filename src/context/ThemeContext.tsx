import { createContext, useState, useContext, useEffect, useMemo } from "react";
import { theme, applyThemeVariables } from "../styles/theme";

type ThemeType = "light" | "dark";

const ThemeContext = createContext<any>(null);

export function ThemeProvider({ children }: any) {
    const [mode, setMode] = useState<ThemeType>("light");

    useEffect(() => {
        applyThemeVariables(mode);
    }, [mode]);

    const currentTheme = useMemo(() => ({
        ...theme[mode],
        shared: theme.shared,
        font: theme.font,
    }), [mode]);

    const toggleTheme = () => {
        setMode((prev) => (prev === "light" ? "dark" : "light"));
    };

    return (
        <ThemeContext.Provider value={{ mode, toggleTheme, theme: currentTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    return useContext(ThemeContext);
}