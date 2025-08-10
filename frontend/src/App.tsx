import {Routes, Route, Navigate} from "react-router-dom";
import DataCompilerPage from "./pages/DataCompilerPage";
import HomePage from "./pages/HomePage.tsx";
import "./App.css";

function App() {
    return (
        <Routes>
            <Route path="/app" element={<HomePage/>}/>
            <Route path="/compiler" element={<DataCompilerPage/>}/>
            <Route path="/" element={<Navigate to="/app" replace/>}/>
        </Routes>
    );
}

export default App;
