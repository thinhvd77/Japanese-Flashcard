import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
    getVocabularySet,
    markFlashcardLearned,
    resetVocabularySet,
} from "../api";
import Flashcard from "../components/Flashcard";

function Study() {
    const { setId } = useParams();
    const navigate = useNavigate();
    const [vocabSet, setVocabSet] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [currentFace, setCurrentFace] = useState(0);
    const [shuffled, setShuffled] = useState(false);
    const [cards, setCards] = useState([]);
    const [totalCount, setTotalCount] = useState(0);
    const [learnedCount, setLearnedCount] = useState(0);

    useEffect(() => {
        loadVocabSet();
    }, [setId]);

    async function loadVocabSet() {
        try {
            setLoading(true);
            const data = await getVocabularySet(setId);
            setVocabSet(data);
            setCards(data.flashcards || []);
            setTotalCount(data.totalCount || data.flashcards?.length || 0);
            setLearnedCount(data.learnedCount || 0);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    // Mark current card as learned and go to next
    const markLearnedAndNext = useCallback(async () => {
        if (cards.length === 0) return;

        const currentCard = cards[currentIndex];
        try {
            await markFlashcardLearned(currentCard.id, true);

            // Remove the card from local state
            const newCards = cards.filter((_, idx) => idx !== currentIndex);
            setCards(newCards);
            setLearnedCount((prev) => prev + 1);

            // Adjust current index if needed
            if (currentIndex >= newCards.length && newCards.length > 0) {
                setCurrentIndex(newCards.length - 1);
            }
            setCurrentFace(0);
        } catch (err) {
            console.error("Failed to mark as learned:", err);
        }
    }, [cards, currentIndex]);

    // Mark current card as not learned and go to next
    const markNotLearnedAndNext = useCallback(() => {
        if (cards.length === 0) return;

        // Simply go to next card (or wrap to first if at end)
        if (currentIndex < cards.length - 1) {
            setCurrentIndex((prev) => prev + 1);
        } else {
            // At the last card, wrap to first
            setCurrentIndex(0);
        }
        setCurrentFace(0);
    }, [cards.length, currentIndex]);

    const nextFace = useCallback(() => {
        setCurrentFace((prev) => (prev + 1) % 5);
    }, []);

    const setFace = useCallback((face) => {
        setCurrentFace(face);
    }, []);

    function shuffleCards() {
        const shuffledCards = [...cards].sort(() => Math.random() - 0.5);
        setCards(shuffledCards);
        setCurrentIndex(0);
        setCurrentFace(0);
        setShuffled(true);
    }

    async function resetAllCards() {
        try {
            await resetVocabularySet(setId);
            await loadVocabSet();
            setCurrentIndex(0);
            setCurrentFace(0);
            setShuffled(false);
        } catch (err) {
            console.error("Failed to reset cards:", err);
        }
    }

    function resetCards() {
        setCards(vocabSet?.flashcards || []);
        setCurrentIndex(0);
        setCurrentFace(0);
        setShuffled(false);
    }

    // Keyboard navigation
    useEffect(() => {
        function handleKeyDown(e) {
            switch (e.key) {
                case "ArrowRight":
                    markLearnedAndNext();
                    break;
                case "ArrowLeft":
                    markNotLearnedAndNext();
                    break;
                case " ":
                case "ArrowUp":
                case "ArrowDown":
                    e.preventDefault();
                    nextFace();
                    break;
            }
        }

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [markLearnedAndNext, markNotLearnedAndNext, nextFace]);

    if (loading) {
        return (
            <>
                <header className="header">
                    <div className="header-nav">
                        <Link to="/" className="back-btn">
                            ← Quay lại
                        </Link>
                        <h1>Đang tải...</h1>
                        <div style={{ width: "80px" }}></div>
                    </div>
                </header>
                <main className="container">
                    <div className="loading">
                        <div className="spinner"></div>
                    </div>
                </main>
            </>
        );
    }

    if (error) {
        return (
            <>
                <header className="header">
                    <div className="header-nav">
                        <Link to="/" className="back-btn">
                            ← Quay lại
                        </Link>
                        <h1>Lỗi</h1>
                        <div style={{ width: "80px" }}></div>
                    </div>
                </header>
                <main className="container">
                    <div
                        className="card"
                        style={{ textAlign: "center", color: "var(--danger)" }}
                    >
                        <p>{error}</p>
                        <button
                            className="btn btn-secondary"
                            onClick={() => navigate("/")}
                            style={{ marginTop: "1rem" }}
                        >
                            Về trang chủ
                        </button>
                    </div>
                </main>
            </>
        );
    }

    if (!cards.length) {
        const allLearned = learnedCount > 0 && learnedCount === totalCount;
        return (
            <>
                <header className="header">
                    <div className="header-nav">
                        <Link to="/" className="back-btn">
                            ← Quay lại
                        </Link>
                        <h1>{vocabSet?.name}</h1>
                        <div style={{ width: "80px" }}></div>
                    </div>
                </header>
                <main className="container">
                    <div className="empty-state">
                        <div className="empty-state-icon">
                            {allLearned ? "🎉" : "📭"}
                        </div>
                        <h3 className="empty-state-title">
                            {allLearned ? "Chúc mừng!" : "Bộ từ vựng trống"}
                        </h3>
                        <p>
                            {allLearned
                                ? `Bạn đã thuộc hết ${totalCount} từ trong bộ này!`
                                : "Không có flashcard nào trong bộ này"}
                        </p>
                        {allLearned && (
                            <button
                                className="btn btn-primary"
                                onClick={resetAllCards}
                                style={{ marginTop: "1rem" }}
                            >
                                🔄 Học lại từ đầu
                            </button>
                        )}
                    </div>
                </main>
            </>
        );
    }

    const currentCard = cards[currentIndex];

    return (
        <>
            <header className="header">
                <div className="header-nav">
                    <Link to="/" className="back-btn">
                        ← Quay lại
                    </Link>
                    <h1>{vocabSet?.name}</h1>
                    <div style={{ width: "80px" }}></div>
                </div>
            </header>

            <main className="container" style={{ paddingTop: "1.5rem" }}>
                <Flashcard
                    card={currentCard}
                    currentFace={currentFace}
                    onNextFace={nextFace}
                    onSetFace={setFace}
                />

                <div className="card-nav">
                    <button
                        className="nav-btn nav-btn-skip"
                        onClick={markNotLearnedAndNext}
                        disabled={cards.length === 0}
                        aria-label="Chưa thuộc, xem lại sau"
                        title="Chưa thuộc - xem lại sau (←)"
                    >
                        ‹
                    </button>

                    <div className="card-progress">
                        <span>{currentIndex + 1}</span>
                        <span>/</span>
                        <span>{cards.length}</span>
                        <span
                            style={{
                                marginLeft: "0.5rem",
                                fontSize: "0.8em",
                                color: "var(--success)",
                            }}
                        >
                            ({learnedCount}/{totalCount} đã thuộc)
                        </span>
                    </div>

                    <button
                        className="nav-btn nav-btn-learned"
                        onClick={markLearnedAndNext}
                        disabled={cards.length === 0}
                        aria-label="Đã thuộc"
                        title="Đã thuộc - không hiển thị lại (→)"
                    >
                        ›
                    </button>
                </div>

                <div className="swipe-hint">
                    👆 Nhấn vào thẻ để xem mặt tiếp theo • ← Chưa thuộc • → Đã
                    thuộc
                </div>

                <div className="actions">
                    <button
                        className="btn btn-secondary"
                        onClick={shuffled ? resetCards : shuffleCards}
                    >
                        {shuffled ? "↺ Đặt lại thứ tự" : "🔀 Trộn thẻ"}
                    </button>
                    <button
                        className="btn btn-secondary"
                        onClick={() => {
                            setCurrentIndex(0);
                            setCurrentFace(0);
                        }}
                    >
                        ⏮ Từ đầu
                    </button>
                    <button
                        className="btn btn-danger"
                        onClick={resetAllCards}
                        title="Đặt lại tất cả thẻ về chưa thuộc"
                    >
                        🔄 Học lại tất cả
                    </button>
                </div>
            </main>
        </>
    );
}

export default Study;
