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
            primary: "#454545",
            secondary: "#1E1E1E",
        },
        text: {
            primary: "#EFEFEF",
            secondary: "#FAFAFA",
            light: "#868686",
        },
    },

    shared: {
        hr: "#C0C0C0",
    },
};


function flattenObject(obj: any, prefix = ""): Record<string, string> {
    return Object.keys(obj).reduce((acc, key) => {
        const value = obj[key];
        const newKey = prefix ? `${prefix}-${key}` : key;

        if (typeof value === "object") {
            Object.assign(acc, flattenObject(value, newKey));
        } else {
            acc[`--${newKey}`] = value;
        }

        return acc;
    }, {} as Record<string, string>);
}

export function applyThemeVariables(mode: "light" | "dark") {
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