import React from 'react';

export default function CandidateNavigation({
    currentIndex,
    totalCount,
    candidateCode,
    onNavigate,
    showCounter = false
}) {
    return (
        <div className="candidate-nav-group">
            <button
                className="btn btn-secondary nav-btn-fixed"
                disabled={currentIndex <= 0}
                onClick={() => onNavigate(-1)}
            >
                ← Předchozí
            </button>

            <div className="nav-candidate-badge">
                <span className="nav-candidate-code">{candidateCode}</span>
                {showCounter && (
                    <span className="nav-candidate-counter">
                        {currentIndex + 1} / {totalCount}
                    </span>
                )}
            </div>

            <button
                className="btn btn-secondary nav-btn-fixed"
                disabled={currentIndex >= totalCount - 1}
                onClick={() => onNavigate(1)}
            >
                Další →
            </button>
        </div>
    );
}
