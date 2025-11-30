import { useState, useEffect, useRef } from "react";
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
    const [draggedItem, setDraggedItem] = useState(null);
    const [dragOverItem, setDragOverItem] = useState(null);
    const [settingsOpen, setSettingsOpen] = useState(null);
    const [dropdownPosition, setDropdownPosition] = useState({
        top: 0,
        left: 0,
    });
    const dragNode = useRef(null);

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

    // Drag and drop handlers
    function handleDragStart(e, index) {
        setDraggedItem(index);
        dragNode.current = e.target;
        dragNode.current.addEventListener("dragend", handleDragEnd);

        // Make the drag image semi-transparent
        setTimeout(() => {
            if (dragNode.current) {
                dragNode.current.style.opacity = "0.5";
            }
        }, 0);
    }

    function handleDragEnter(e, index) {
        if (index !== draggedItem) {
            setDragOverItem(index);

            // Reorder the list
            const newSets = [...sets];
            const draggedItemContent = newSets[draggedItem];
            newSets.splice(draggedItem, 1);
            newSets.splice(index, 0, draggedItemContent);

            setDraggedItem(index);
            setSets(newSets);
        }
    }

    function handleDragEnd() {
        if (dragNode.current) {
            dragNode.current.style.opacity = "1";
            dragNode.current.removeEventListener("dragend", handleDragEnd);
        }

        setDraggedItem(null);
        setDragOverItem(null);
        dragNode.current = null;

        // Save the new order to the backend
        const orderedIds = sets.map((set) => set.id);
        reorderVocabularySets(orderedIds).catch((err) => {
            console.error("Failed to save order:", err);
        });
    }

    function handleDragOver(e) {
        e.preventDefault();
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
        }

        document.addEventListener("click", handleClickOutside);
        return () => document.removeEventListener("click", handleClickOutside);
    }, [settingsOpen]);

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
                        <p className="drag-hint">
                            💡 Kéo thả để sắp xếp lại thứ tự
                        </p>
                        {sets.map((set, index) => (
                            <Link
                                key={set.id}
                                to={`/study/${set.id}`}
                                className={`set-item ${
                                    draggedItem === index ? "dragging" : ""
                                } ${dragOverItem === index ? "drag-over" : ""}`}
                                draggable
                                onDragStart={(e) => handleDragStart(e, index)}
                                onDragEnter={(e) => handleDragEnter(e, index)}
                                onDragOver={handleDragOver}
                            >
                                <div
                                    className="drag-handle"
                                    onMouseDown={(e) => e.stopPropagation()}
                                >
                                    ⋮⋮
                                </div>
                                <div className="set-info">
                                    <div className="set-name">{set.name}</div>
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
                                    onClick={(e) => toggleSettings(set.id, e)}
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
                        ))}
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
