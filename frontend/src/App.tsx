import { BrowserRouter, Routes, Route } from "react-router-dom";
import DataCompilerPage from "./pages/DataCompilerPage";
import HomePage from "./pages/HomePage.tsx";
import "./App.css";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/app" element={<HomePage />} />
        <Route path="/compiler" element={<DataCompilerPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
