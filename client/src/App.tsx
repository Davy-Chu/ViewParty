import { Navigate, Route, Routes } from "react-router-dom";
import CreatePage from "./pages/CreatePage";
import WatchPage from "./pages/WatchPage";

function App() {
  return (
    <main className="app-shell">
      <Routes>
        <Route path="/" element={<Navigate to="/create" replace />} />
        <Route path="/create" element={<CreatePage />} />
        <Route path="/watch/:sessionId" element={<WatchPage />} />
        <Route path="*" element={<Navigate to="/create" replace />} />
      </Routes>
    </main>
  );
}

export default App;

