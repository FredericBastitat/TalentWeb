import React from 'react';

export default function CriterionCard({
    criterion,
    categoryKey,
    score,
    disabled,
    checkedPenalties,
    onScoreChange,
    onPenaltyChange,
}) {
    return (
        <div className={`criterion-card ${disabled ? 'disabled' : ''}`}>
            <div className="criterion-top">
                <span className="criterion-name">{criterion.name}</span>
                <select
                    className="criterion-select"
                    value={score}
                    onChange={(e) => onScoreChange(categoryKey, criterion.key, e.target.value)}
                    disabled={disabled}
                >
                    {Array.from({ length: criterion.maxScore + 1 }, (_, i) => (
                        <option key={i} value={i}>{i}</option>
                    ))}
                </select>
            </div>

            {criterion.penalties && criterion.penalties.length > 0 && (
                <div className="penalty-chips-container">
                    {criterion.penalties.map(penalty => {
                        const isChecked = checkedPenalties.includes(penalty.value);
                        return (
                            <button
                                key={penalty.value}
                                type="button"
                                className={`penalty-chip ${isChecked ? 'active' : ''}`}
                                onClick={() => onPenaltyChange(categoryKey, criterion.key, penalty.value, !isChecked)}
                                disabled={disabled}
                            >
                                <span className="chip-icon">{isChecked ? '✓' : '＋'}</span>
                                {penalty.label}
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
