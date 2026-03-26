import { createContext, useState, useContext, useEffect } from "react";
import { theme, applyThemeVariables } from "../styles/theme";

type ThemeType = "light" | "dark";

const ThemeContext = createContext<any>(null);

export function ThemeProvider({ children }: any) {
    const [mode, setMode] = useState<ThemeType>("light");

    const toggleTheme = () => {
        setMode((prev) => (prev === "light" ? "dark" : "light"));
    };

    useEffect(() => {
        applyThemeVariables(mode);
    }, [mode]);

    const currentTheme = {
        ...theme[mode],
        shared: theme.shared,
        font: theme.font,
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