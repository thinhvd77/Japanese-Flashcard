import { useState, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { uploadVocabularySet } from "../api";

function Upload() {
    const [file, setFile] = useState(null);
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [dragOver, setDragOver] = useState(false);
    const fileInputRef = useRef(null);
    const navigate = useNavigate();

    function handleFileChange(e) {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            setFile(selectedFile);
            if (!name) {
                setName(selectedFile.name.replace(/\.(xlsx|xls)$/i, ""));
            }
        }
    }

    function handleDrop(e) {
        e.preventDefault();
        setDragOver(false);
        const droppedFile = e.dataTransfer.files?.[0];
        if (droppedFile) {
            const ext = droppedFile.name.split(".").pop().toLowerCase();
            if (["xlsx", "xls"].includes(ext)) {
                setFile(droppedFile);
                if (!name) {
                    setName(droppedFile.name.replace(/\.(xlsx|xls)$/i, ""));
                }
            } else {
                setError("Chỉ chấp nhận file Excel (.xlsx, .xls)");
            }
        }
    }

    function handleDragOver(e) {
        e.preventDefault();
        setDragOver(true);
    }

    function handleDragLeave(e) {
        e.preventDefault();
        setDragOver(false);
    }

    async function handleSubmit(e) {
        e.preventDefault();
        if (!file) {
            setError("Vui lòng chọn file Excel");
            return;
        }

        try {
            setLoading(true);
            setError(null);
            const result = await uploadVocabularySet(
                file,
                name || file.name,
                description
            );
            navigate(`/study/${result.setId}`);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <>
            <header className="header">
                <div className="header-nav">
                    <Link to="/" className="back-btn">
                        ← Quay lại
                    </Link>
                    <h1>Thêm bộ từ vựng</h1>
                    <div style={{ width: "80px" }}></div>
                </div>
            </header>

            <main className="container">
                <form onSubmit={handleSubmit}>
                    <div
                        className={`file-upload ${dragOver ? "dragover" : ""}`}
                        onClick={() => fileInputRef.current?.click()}
                        onDrop={handleDrop}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                    >
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".xlsx,.xls"
                            onChange={handleFileChange}
                        />
                        <div className="file-upload-icon">📁</div>
                        {file ? (
                            <div>
                                <strong>{file.name}</strong>
                                <p className="file-upload-text">
                                    Nhấn để chọn file khác
                                </p>
                            </div>
                        ) : (
                            <div>
                                <strong>Chọn hoặc kéo thả file Excel</strong>
                                <p className="file-upload-text">
                                    Hỗ trợ .xlsx, .xls (tối đa 10MB)
                                </p>
                            </div>
                        )}
                    </div>

                    <div className="card" style={{ marginTop: "1rem" }}>
                        <h3
                            style={{
                                marginBottom: "1rem",
                                fontSize: "0.875rem",
                                color: "var(--text-light)",
                            }}
                        >
                            📋 Định dạng file Excel
                        </h3>
                        <p
                            style={{
                                fontSize: "0.875rem",
                                marginBottom: "0.5rem",
                            }}
                        >
                            File cần có các cột (tên cột không phân biệt hoa
                            thường):
                        </p>
                        <ul
                            style={{
                                fontSize: "0.875rem",
                                paddingLeft: "1.25rem",
                                color: "var(--text-light)",
                            }}
                        >
                            <li>
                                <strong>Kanji</strong> hoặc 漢字 - Chữ Kanji
                            </li>
                            <li>
                                <strong>Meaning</strong> hoặc Nghĩa - Nghĩa
                                tiếng Việt
                            </li>
                            <li>
                                <strong>Pronunciation</strong> hoặc Hiragana -
                                Phiên âm
                            </li>
                            <li>
                                <strong>Sino-Vietnamese</strong> hoặc Hán Việt -
                                Âm Hán Việt
                            </li>
                            <li>
                                <strong>Example</strong> hoặc Ví dụ - Câu ví dụ
                            </li>
                        </ul>
                    </div>

                    <div className="form-group" style={{ marginTop: "1rem" }}>
                        <label className="form-label">Tên bộ từ vựng</label>
                        <input
                            type="text"
                            className="form-input"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="VD: N5 Từ vựng tuần 1"
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">
                            Mô tả (không bắt buộc)
                        </label>
                        <input
                            type="text"
                            className="form-input"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="VD: Từ vựng cơ bản cho người mới bắt đầu"
                        />
                    </div>

                    {error && (
                        <div
                            style={{
                                color: "var(--danger)",
                                marginBottom: "1rem",
                                fontSize: "0.875rem",
                            }}
                        >
                            ⚠️ {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        className="btn btn-primary btn-block"
                        disabled={loading || !file}
                    >
                        {loading ? "Đang xử lý..." : "✓ Tạo bộ từ vựng"}
                    </button>
                </form>
            </main>
        </>
    );
}

export default Upload;
