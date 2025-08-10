import {Routes, Route, Navigate} from "react-router-dom";
import DataCompilerPage from "./pages/DataCompilerPage";
import DataApiPage from "./pages/DataApiPage.tsx";
import "./App.css";
import Header from "./components/Header.tsx";

function App() {
    return (
        <div className="app">
            <Header/>
            <main className="main-content">
                <Routes>
                    <Route path="/app" element={<DataApiPage/>}/>
                    <Route path="/compiler" element={<DataCompilerPage/>}/>
                    <Route path="/" element={<Navigate to="/app" replace/>}/>
                </Routes>
            </main>
        </div>
    );
}

export default App;
