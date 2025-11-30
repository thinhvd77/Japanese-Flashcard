import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
    getVocabularySets,
    deleteVocabularySet,
    reorderVocabularySets,
    updateVocabularySet,
} from "../api";

const FACE_OPTIONS = [
    { value: 0, label: "Kanji" },
    { value: 1, label: "Nghĩa" },
    { value: 2, label: "Phiên âm" },
    { value: 3, label: "Hán Việt" },
    { value: 4, label: "Ví dụ" },
];

function Home() {
    const [sets, setSets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [settingsOpen, setSettingsOpen] = useState(null);
    const [dropdownPosition, setDropdownPosition] = useState({
        top: 0,
        left: 0,
    });
    const [moveMenuOpen, setMoveMenuOpen] = useState(null);
    const [moveMenuPosition, setMoveMenuPosition] = useState({
        top: 0,
        left: 0,
    });
    const [positionInput, setPositionInput] = useState("");

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

    // Move set up or down
    async function moveSet(index, direction, e) {
        e.preventDefault();
        e.stopPropagation();

        const newIndex = index + direction;
        if (newIndex < 0 || newIndex >= sets.length) return;

        const newSets = [...sets];
        const temp = newSets[index];
        newSets[index] = newSets[newIndex];
        newSets[newIndex] = temp;

        setSets(newSets);
        await saveOrder(newSets);
    }

    // Move set to specific position
    async function moveToPosition(fromIndex, toIndex, e) {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }

        if (toIndex < 0 || toIndex >= sets.length || fromIndex === toIndex)
            return;

        const newSets = [...sets];
        const [removed] = newSets.splice(fromIndex, 1);
        newSets.splice(toIndex, 0, removed);

        setSets(newSets);
        setMoveMenuOpen(null);
        setPositionInput("");
        await saveOrder(newSets);
    }

    // Save order to backend
    async function saveOrder(newSets) {
        const orderedIds = newSets.map((set) => set.id);
        try {
            await reorderVocabularySets(orderedIds);
        } catch (err) {
            console.error("Failed to save order:", err);
        }
    }

    // Toggle move menu
    function toggleMoveMenu(setId, index, e) {
        e.preventDefault();
        e.stopPropagation();

        if (moveMenuOpen === setId) {
            setMoveMenuOpen(null);
        } else {
            const rect = e.currentTarget.getBoundingClientRect();
            setMoveMenuPosition({
                top: rect.bottom + 5,
                left: Math.max(
                    10,
                    Math.min(rect.left - 50, window.innerWidth - 180)
                ),
            });
            setMoveMenuOpen(setId);
            setPositionInput("");
        }
    }

    // Handle position input
    function handlePositionSubmit(fromIndex, e) {
        e.preventDefault();
        const targetPos = parseInt(positionInput, 10);
        if (!isNaN(targetPos) && targetPos >= 1 && targetPos <= sets.length) {
            moveToPosition(fromIndex, targetPos - 1);
        }
    }

    async function handleDefaultFaceChange(setId, newFace, e) {
        e.preventDefault();
        e.stopPropagation();

        try {
            await updateVocabularySet(setId, { default_face: newFace });
            setSets(
                sets.map((s) =>
                    s.id === setId ? { ...s, default_face: newFace } : s
                )
            );
        } catch (err) {
            console.error("Failed to update default face:", err);
        }
    }

    function toggleSettings(setId, e) {
        e.preventDefault();
        e.stopPropagation();

        if (settingsOpen === setId) {
            setSettingsOpen(null);
        } else {
            // Calculate position based on button location
            const rect = e.currentTarget.getBoundingClientRect();
            setDropdownPosition({
                top: rect.bottom + 5,
                left: Math.min(rect.left, window.innerWidth - 200),
            });
            setSettingsOpen(setId);
        }
    }

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(e) {
            if (
                settingsOpen &&
                !e.target.closest(".set-settings-dropdown") &&
                !e.target.closest(".btn-settings")
            ) {
                setSettingsOpen(null);
            }
            if (
                moveMenuOpen &&
                !e.target.closest(".move-menu-dropdown") &&
                !e.target.closest(".position-badge")
            ) {
                setMoveMenuOpen(null);
            }
        }

        document.addEventListener("click", handleClickOutside);
        return () => document.removeEventListener("click", handleClickOutside);
    }, [settingsOpen, moveMenuOpen]);

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
                        {sets.map((set, index) => (
                            <div key={set.id} className="set-item-wrapper">
                                <button
                                    className="position-badge"
                                    onClick={(e) =>
                                        toggleMoveMenu(set.id, index, e)
                                    }
                                    title="Nhấn để di chuyển"
                                >
                                    {index + 1}
                                </button>
                                <div className="set-reorder-buttons">
                                    <button
                                        className="reorder-btn"
                                        onClick={(e) => moveSet(index, -1, e)}
                                        disabled={index === 0}
                                        title="Di chuyển lên"
                                    >
                                        ▲
                                    </button>
                                    <button
                                        className="reorder-btn"
                                        onClick={(e) => moveSet(index, 1, e)}
                                        disabled={index === sets.length - 1}
                                        title="Di chuyển xuống"
                                    >
                                        ▼
                                    </button>
                                </div>
                                <Link
                                    to={`/study/${set.id}`}
                                    className="set-item"
                                >
                                    <div className="set-info">
                                        <div className="set-name">
                                            {set.name}
                                        </div>
                                        <div className="set-meta">
                                            {set.card_count} từ •{" "}
                                            {formatDate(set.created_at)} •{" "}
                                            <span className="default-face-label">
                                                {
                                                    FACE_OPTIONS[
                                                        set.default_face || 0
                                                    ]?.label
                                                }
                                            </span>
                                        </div>
                                    </div>
                                    <button
                                        className="btn btn-sm btn-settings"
                                        onClick={(e) =>
                                            toggleSettings(set.id, e)
                                        }
                                        title="Cài đặt"
                                    >
                                        ⚙️
                                    </button>
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
                            </div>
                        ))}
                    </div>
                )}

                {/* Move menu dropdown */}
                {moveMenuOpen && (
                    <div
                        className="move-menu-dropdown"
                        style={{
                            top: moveMenuPosition.top,
                            left: moveMenuPosition.left,
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="settings-title">Di chuyển đến:</div>
                        {(() => {
                            const currentIndex = sets.findIndex(
                                (s) => s.id === moveMenuOpen
                            );
                            return (
                                <>
                                    <button
                                        className="settings-option"
                                        onClick={(e) =>
                                            moveToPosition(currentIndex, 0, e)
                                        }
                                        disabled={currentIndex === 0}
                                    >
                                        ⬆️ Đầu danh sách
                                    </button>
                                    <button
                                        className="settings-option"
                                        onClick={(e) =>
                                            moveToPosition(
                                                currentIndex,
                                                sets.length - 1,
                                                e
                                            )
                                        }
                                        disabled={
                                            currentIndex === sets.length - 1
                                        }
                                    >
                                        ⬇️ Cuối danh sách
                                    </button>
                                    <div className="position-input-wrapper">
                                        <form
                                            onSubmit={(e) =>
                                                handlePositionSubmit(
                                                    currentIndex,
                                                    e
                                                )
                                            }
                                        >
                                            <input
                                                type="number"
                                                className="position-input"
                                                placeholder={`1-${sets.length}`}
                                                min="1"
                                                max={sets.length}
                                                value={positionInput}
                                                onChange={(e) =>
                                                    setPositionInput(
                                                        e.target.value
                                                    )
                                                }
                                                onClick={(e) =>
                                                    e.stopPropagation()
                                                }
                                            />
                                            <button
                                                type="submit"
                                                className="position-go-btn"
                                            >
                                                Đi
                                            </button>
                                        </form>
                                    </div>
                                </>
                            );
                        })()}
                    </div>
                )}

                {/* Settings dropdown rendered outside of Link */}
                {settingsOpen && (
                    <div
                        className="set-settings-dropdown"
                        style={{
                            top: dropdownPosition.top,
                            left: dropdownPosition.left,
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="settings-title">
                            Mặt hiển thị đầu tiên:
                        </div>
                        {FACE_OPTIONS.map((option) => {
                            const currentSet = sets.find(
                                (s) => s.id === settingsOpen
                            );
                            const isActive =
                                (currentSet?.default_face || 0) ===
                                option.value;
                            return (
                                <button
                                    key={option.value}
                                    className={`settings-option ${
                                        isActive ? "active" : ""
                                    }`}
                                    onClick={(e) =>
                                        handleDefaultFaceChange(
                                            settingsOpen,
                                            option.value,
                                            e
                                        )
                                    }
                                >
                                    {option.label}
                                    {isActive && " ✓"}
                                </button>
                            );
                        })}
                    </div>
                )}
            </main>
        </>
    );
}

export default Home;
