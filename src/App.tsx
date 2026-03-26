import AppRoutes from "./routes/AppRoutes";
import { ThemeProvider } from "./context/ThemeContext";
import { LoadingProvider } from "./context/LoadingContext";

function App() {
    return (
        <ThemeProvider>
            <LoadingProvider>
                <AppRoutes />
            </LoadingProvider>
        </ThemeProvider>
    );
}

export default App;