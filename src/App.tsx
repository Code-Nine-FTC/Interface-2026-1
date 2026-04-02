import AppRoutes from "./routes/AppRoutes";
import { ThemeProvider } from "./context/ThemeContext";
import { LoadingProvider } from "./context/LoadingContext";
import { TitleProvider } from "./context/TitleContext";

function App() {
    return (
        <TitleProvider>
            <ThemeProvider>
                <LoadingProvider>
                    <AppRoutes />
                </LoadingProvider>
            </ThemeProvider>
        </TitleProvider>
    );
}

export default App;