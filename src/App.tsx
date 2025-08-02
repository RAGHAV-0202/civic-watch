import { Toaster } from "@/components/ui/toaster";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import NotFound from "./pages/NotFound";
const queryClient = new QueryClient();
import { AuthProvider } from "./hooks/useAuth";

function App() {
  return (
    <QueryClientProvider client={queryClient}>
        <Toaster />
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;