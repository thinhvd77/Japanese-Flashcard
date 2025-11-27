import { useRef, useState } from "react";

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
    const [isTouchDevice, setIsTouchDevice] = useState(false);

    // Minimum swipe distance (in px)
    const minSwipeDistance = 50;

    function handleTouchStart(e) {
        setIsTouchDevice(true);
        setTouchEnd(null);
        setTouchStart(e.targetTouches[0].clientX);
    }

    function handleTouchMove(e) {
        setTouchEnd(e.targetTouches[0].clientX);
    }

    function handleTouchEnd() {
        if (!touchStart) {
            return;
        }

        // Check if it was a swipe or a tap
        if (touchEnd !== null) {
            const distance = touchStart - touchEnd;
            const isSwipe = Math.abs(distance) > minSwipeDistance;

            if (isSwipe) {
                // Swipe detected - don't change face (could be used for card navigation)
                setTouchStart(null);
                setTouchEnd(null);
                return;
            }
        }

        // It was a tap
        onNextFace();
        setTouchStart(null);
        setTouchEnd(null);
    }

    function handleClick() {
        // Only handle click on non-touch devices to avoid double trigger
        if (!isTouchDevice) {
            onNextFace();
        }
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
