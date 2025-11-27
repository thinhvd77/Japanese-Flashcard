import { useRef, useEffect, useState } from "react";

const FACE_LABELS = ["Kanji", "Nghĩa", "Phiên âm", "Hán Việt", "Ví dụ"];

const FACE_FIELDS = [
    "kanji",
    "meaning",
    "pronunciation",
    "sino_vietnamese",
    "example",
];

function Flashcard({ card, currentFace, onNextFace, onSetFace }) {
    const containerRef = useRef(null);
    const [touchStart, setTouchStart] = useState(null);
    const [touchEnd, setTouchEnd] = useState(null);

    // Minimum swipe distance (in px)
    const minSwipeDistance = 50;

    function handleTouchStart(e) {
        setTouchEnd(null);
        setTouchStart(e.targetTouches[0].clientX);
    }

    function handleTouchMove(e) {
        setTouchEnd(e.targetTouches[0].clientX);
    }

    function handleTouchEnd() {
        if (!touchStart || !touchEnd) {
            // It was a tap, not a swipe
            onNextFace();
            return;
        }

        const distance = touchStart - touchEnd;
        const isLeftSwipe = distance > minSwipeDistance;
        const isRightSwipe = distance < -minSwipeDistance;

        if (isLeftSwipe || isRightSwipe) {
            // Swipe detected - but we're using tap for face change
            // So swipe can be used for card navigation (handled by parent)
        } else {
            // Tap
            onNextFace();
        }
    }

    function handleClick() {
        onNextFace();
    }

    // Calculate rotation based on current face
    const rotation = currentFace * 180;

    return (
        <div>
            <div
                ref={containerRef}
                className="flashcard-container"
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                onClick={handleClick}
            >
                <div
                    className="flashcard"
                    style={{
                        transform: `rotateY(${rotation}deg)`,
                    }}
                >
                    {FACE_FIELDS.map((field, index) => {
                        const isActive = index === currentFace;
                        const content = card[field] || "—";

                        return (
                            <div
                                key={field}
                                className={`flashcard-face flashcard-face-${index}`}
                                style={{
                                    transform: `rotateY(${index * 180}deg)`,
                                    opacity: isActive ? 1 : 0,
                                    visibility: isActive ? "visible" : "hidden",
                                    transition: "opacity 0.3s",
                                }}
                            >
                                <div className="flashcard-label">
                                    {FACE_LABELS[index]}
                                </div>
                                <div
                                    className={`flashcard-content ${
                                        field === "kanji" ? "kanji" : ""
                                    } ${field === "example" ? "example" : ""}`}
                                >
                                    {content}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="face-indicators">
                {FACE_LABELS.map((label, index) => (
                    <div
                        key={label}
                        className={`face-dot ${
                            currentFace === index ? "active" : ""
                        }`}
                        onClick={(e) => {
                            e.stopPropagation();
                            onSetFace(index);
                        }}
                        title={label}
                    />
                ))}
            </div>
        </div>
    );
}

export default Flashcard;
