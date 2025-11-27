import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Study from "./pages/Study";
import Upload from "./pages/Upload";

function App() {
    return (
        <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/study/:setId" element={<Study />} />
            <Route path="/upload" element={<Upload />} />
        </Routes>
    );
}

export default App;
