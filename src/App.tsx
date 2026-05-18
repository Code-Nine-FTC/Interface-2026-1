import AppRoutes from "./routes/AppRoutes";
import { ThemeProvider } from "./context/ThemeContext";
import { LoadingProvider } from "./context/LoadingContext";
import { TitleProvider } from "./context/TitleContext";
import { FilterProvider } from "./context/FilterContext";

function App() {
    return (
        <TitleProvider>
            <ThemeProvider>
                <LoadingProvider>
                    <FilterProvider>
                        <AppRoutes />
                    </FilterProvider>
                </LoadingProvider>
            </ThemeProvider>
        </TitleProvider>
    );
}

export default App;