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
                <div className="penalty-section">
                    {criterion.penalties.map(penalty => (
                        <label className="penalty-label" key={penalty.value}>
                            <input
                                type="checkbox"
                                className="penalty-checkbox"
                                checked={checkedPenalties.includes(penalty.value)}
                                onChange={(e) =>
                                    onPenaltyChange(categoryKey, criterion.key, penalty.value, e.target.checked)
                                }
                                disabled={disabled}
                            />
                            {penalty.label}
                        </label>
                    ))}
                </div>
            )}
        </div>
    );
}
