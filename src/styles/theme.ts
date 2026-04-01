export const theme = {
    font: {
        family: "'Poppins', sans-serif",
        size: {
            xs: "12px",
            sm: "14px",
            md: "16px",
            lg: "20px",
            xl: "24px",
        },
    },

    light: {
        background: {
            primary: "#FFFFFF",
            secondary: "#FAFAFA",
            textBox: "#EFEFEF",
        },
        text: {
            primary: "#535353",
            secondary: "#868686",
        },
        orange: {
            main: "#FF8A24",
            secondary: "#CF690F",
            light: "#F9CAA2",
        },
    },

    dark: {
        background: {
            primary: "#1E1E1E", 
            secondary: "#2D2D2D",
            textBox: "#454545",
        },
        text: {
            primary: "#EFEFEF", 
            secondary: "#FAFAFA",
            light: "#868686",
        },
        orange: {
            main: "#FF8A24",
            secondary: "#CF690F",
            light: "#F9CAA2",
        },
    },

    shared: {
        hr: "#C0C0C0",
    },
};

function flattenObject(obj: any, prefix = ""): Record<string, string> {
    const acc: Record<string, string> = {};
    for (const key in obj) {
        const value = obj[key];
        const newKey = prefix ? `${prefix}-${key}` : key;
        if (typeof value === "object" && value !== null) {
            Object.assign(acc, flattenObject(value, newKey));
        } else {
            acc[`--${newKey}`] = value;
        }
    }
    return acc;
}

export function applyThemeVariables(mode: "light" | "dark") {
    if (typeof window === "undefined") return;
    const root = document.documentElement;

    const mergedTheme = {
        ...theme[mode],
        shared: theme.shared,
        font: theme.font,
    };

    const vars = flattenObject(mergedTheme);
    Object.entries(vars).forEach(([key, value]) => {
        root.style.setProperty(key, value);
    });
}