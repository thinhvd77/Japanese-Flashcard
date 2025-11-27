import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { getVocabularySet } from "../api";
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

    useEffect(() => {
        loadVocabSet();
    }, [setId]);

    async function loadVocabSet() {
        try {
            setLoading(true);
            const data = await getVocabularySet(setId);
            setVocabSet(data);
            setCards(data.flashcards || []);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    const goToNextCard = useCallback(() => {
        if (currentIndex < cards.length - 1) {
            setCurrentIndex((prev) => prev + 1);
            setCurrentFace(0);
        }
    }, [currentIndex, cards.length]);

    const goToPrevCard = useCallback(() => {
        if (currentIndex > 0) {
            setCurrentIndex((prev) => prev - 1);
            setCurrentFace(0);
        }
    }, [currentIndex]);

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
                    goToNextCard();
                    break;
                case "ArrowLeft":
                    goToPrevCard();
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
    }, [goToNextCard, goToPrevCard, nextFace]);

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
                        <div className="empty-state-icon">📭</div>
                        <h3 className="empty-state-title">Bộ từ vựng trống</h3>
                        <p>Không có flashcard nào trong bộ này</p>
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
                        className="nav-btn"
                        onClick={goToPrevCard}
                        disabled={currentIndex === 0}
                        aria-label="Previous card"
                    >
                        ‹
                    </button>

                    <div className="card-progress">
                        <span>{currentIndex + 1}</span>
                        <span>/</span>
                        <span>{cards.length}</span>
                    </div>

                    <button
                        className="nav-btn"
                        onClick={goToNextCard}
                        disabled={currentIndex === cards.length - 1}
                        aria-label="Next card"
                    >
                        ›
                    </button>
                </div>

                <div className="swipe-hint">
                    👆 Nhấn vào thẻ để xem mặt tiếp theo • ← → để chuyển thẻ
                </div>

                <div className="actions">
                    <button
                        className="btn btn-secondary"
                        onClick={shuffled ? resetCards : shuffleCards}
                    >
                        {shuffled ? "↺ Đặt lại" : "🔀 Trộn thẻ"}
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
                </div>
            </main>
        </>
    );
}

export default Study;
