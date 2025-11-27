import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getVocabularySets, deleteVocabularySet } from "../api";

function Home() {
    const [sets, setSets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [deleteConfirm, setDeleteConfirm] = useState(null);

    useEffect(() => {
        loadSets();
    }, []);

    async function loadSets() {
        try {
            setLoading(true);
            const data = await getVocabularySets();
            setSets(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    async function handleDelete(id, e) {
        e.preventDefault();
        e.stopPropagation();

        if (deleteConfirm !== id) {
            setDeleteConfirm(id);
            setTimeout(() => setDeleteConfirm(null), 3000);
            return;
        }

        try {
            await deleteVocabularySet(id);
            setSets(sets.filter((s) => s.id !== id));
            setDeleteConfirm(null);
        } catch (err) {
            setError(err.message);
        }
    }

    function formatDate(dateString) {
        return new Date(dateString).toLocaleDateString("vi-VN", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
        });
    }

    return (
        <>
            <header className="header">
                <h1>📚 Japanese Flashcard</h1>
            </header>

            <main className="container">
                <Link
                    to="/upload"
                    className="btn btn-primary btn-block"
                    style={{ marginBottom: "1.5rem" }}
                >
                    ➕ Thêm bộ từ vựng mới
                </Link>

                {loading ? (
                    <div className="loading">
                        <div className="spinner"></div>
                    </div>
                ) : error ? (
                    <div
                        className="card"
                        style={{ textAlign: "center", color: "var(--danger)" }}
                    >
                        <p>{error}</p>
                        <button
                            className="btn btn-secondary"
                            onClick={loadSets}
                            style={{ marginTop: "1rem" }}
                        >
                            Thử lại
                        </button>
                    </div>
                ) : sets.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-state-icon">📝</div>
                        <h3 className="empty-state-title">
                            Chưa có bộ từ vựng nào
                        </h3>
                        <p>Tải lên file Excel để bắt đầu học</p>
                    </div>
                ) : (
                    <div className="set-list">
                        {sets.map((set) => (
                            <Link
                                key={set.id}
                                to={`/study/${set.id}`}
                                className="set-item"
                            >
                                <div className="set-info">
                                    <div className="set-name">{set.name}</div>
                                    <div className="set-meta">
                                        {set.card_count} từ •{" "}
                                        {formatDate(set.created_at)}
                                    </div>
                                </div>
                                <button
                                    className="btn btn-sm"
                                    style={{
                                        background:
                                            deleteConfirm === set.id
                                                ? "var(--danger)"
                                                : "transparent",
                                        color:
                                            deleteConfirm === set.id
                                                ? "white"
                                                : "var(--danger)",
                                        padding: "0.4rem 0.8rem",
                                    }}
                                    onClick={(e) => handleDelete(set.id, e)}
                                >
                                    {deleteConfirm === set.id
                                        ? "Xác nhận?"
                                        : "🗑️"}
                                </button>
                                <span className="set-arrow">›</span>
                            </Link>
                        ))}
                    </div>
                )}
            </main>
        </>
    );
}

export default Home;
