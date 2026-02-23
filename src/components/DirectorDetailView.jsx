import React from 'react';
import { CATEGORIES, EVALUATOR_META, calculateCategorySum, calculateTotalSum } from '../constants';

export default function DirectorDetailView({
    candidates,
    currentIndex,
    evaluationsMap,
    onBack,
    onNavigate,
}) {
    const candidate = candidates[currentIndex];
    if (!candidate) return null;

    const evals = evaluationsMap[candidate.id] || {};
    const evaluatorIds = [1, 2, 3];

    return (
        <div className="animate-fade-in">
            <div className="eval-header">
                <button className="btn btn-secondary" onClick={onBack}>
                    ← Zpět na přehled
                </button>
                <div className="eval-nav">
                    <button
                        className="btn btn-nav"
                        disabled={currentIndex <= 0}
                        onClick={() => onNavigate(-1)}
                    >
                        ← Předchozí
                    </button>
                    <span className="eval-counter">
                        <strong>{candidate.code || ''}</strong> / {candidates.length}
                    </span>
                    <button
                        className="btn btn-nav"
                        disabled={currentIndex >= candidates.length - 1}
                        onClick={() => onNavigate(1)}
                    >
                        Další →
                    </button>
                </div>
            </div>

            <div className="eval-form director-detail">
                <div className="eval-candidate-info">
                    <span className="eval-candidate-code">{candidate.code || ''}</span>
                    <span className="director-readonly-badge">
                        👁️ Pouze prohlížení
                    </span>
                </div>

                {/* Evaluator summary cards */}
                <div className="director-summary-row">
                    {evaluatorIds.map(eid => {
                        const ev = evals[eid] || null;
                        const total = calculateTotalSum(ev);
                        const meta = EVALUATOR_META[eid];
                        const hasData = !!ev;
                        return (
                            <div
                                key={eid}
                                className="director-summary-card"
                                style={{
                                    borderColor: meta.borderColor,
                                    background: meta.bg,
                                }}
                            >
                                <div className="director-summary-label" style={{ color: meta.color }}>
                                    {meta.name}
                                </div>
                                <div
                                    className="director-summary-total"
                                    style={{ color: hasData ? meta.color : 'var(--text-muted)' }}
                                >
                                    {hasData ? total : '–'}
                                </div>
                                {hasData && (
                                    <div className="director-summary-breakdown">
                                        <span>P: {calculateCategorySum(ev, 'portrait')}</span>
                                        <span>S: {calculateCategorySum(ev, 'file')}</span>
                                        <span>Z: {calculateCategorySum(ev, 'still-life')}</span>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Detailed comparison per category */}
                {CATEGORIES.map(category => (
                    <div className="category-section" key={category.key}>
                        <div className="category-header">
                            <span className="category-title">{category.title}</span>
                        </div>
                        <div className="category-body">
                            {/* Column headers */}
                            <div className="director-criterion-header">
                                <span className="director-criterion-name-header">Kritérium</span>
                                {evaluatorIds.map(eid => (
                                    <span
                                        key={eid}
                                        className="director-criterion-score-header"
                                        style={{ color: EVALUATOR_META[eid].color }}
                                    >
                                        {EVALUATOR_META[eid].shortName}
                                    </span>
                                ))}
                            </div>

                            {category.criteria.map(criterion => {
                                return (
                                    <div className="director-criterion-row" key={criterion.key}>
                                        <span className="director-criterion-name">
                                            {criterion.name}
                                        </span>
                                        {evaluatorIds.map(eid => {
                                            const ev = evals[eid];
                                            const score = ev?.[category.key]?.[criterion.key];
                                            const hasData = ev != null;
                                            const penalties = ev?.[category.key]?.penalties?.[criterion.key] || [];
                                            return (
                                                <div
                                                    key={eid}
                                                    className="director-criterion-score"
                                                    style={{
                                                        color: hasData
                                                            ? EVALUATOR_META[eid].color
                                                            : 'var(--text-muted)',
                                                    }}
                                                >
                                                    <span className="director-score-value">
                                                        {hasData ? (score ?? 0) : '–'}
                                                    </span>
                                                    {penalties.length > 0 && (
                                                        <span className="director-penalty-indicator" title={penalties.join(', ')}>
                                                            ⚠
                                                        </span>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                );
                            })}

                            {/* Category sums */}
                            <div className="director-criterion-row director-criterion-sum-row">
                                <span className="director-criterion-name" style={{ fontWeight: 700 }}>
                                    SUMA
                                </span>
                                {evaluatorIds.map(eid => {
                                    const ev = evals[eid];
                                    const sum = calculateCategorySum(ev, category.key);
                                    const hasData = ev != null;
                                    return (
                                        <div
                                            key={eid}
                                            className="director-criterion-score"
                                            style={{
                                                color: hasData
                                                    ? EVALUATOR_META[eid].color
                                                    : 'var(--text-muted)',
                                                fontWeight: 700,
                                            }}
                                        >
                                            <span className="director-score-value">
                                                {hasData ? sum : '–'}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                ))}

                {/* Grand total bar */}
                <div className="director-grand-total">
                    {evaluatorIds.map(eid => {
                        const ev = evals[eid];
                        const total = calculateTotalSum(ev);
                        const meta = EVALUATOR_META[eid];
                        const hasData = ev != null;
                        return (
                            <div
                                key={eid}
                                className="director-grand-total-item"
                                style={{
                                    borderColor: meta.borderColor,
                                    background: meta.bg,
                                }}
                            >
                                <span className="director-grand-total-label" style={{ color: meta.color }}>
                                    {meta.shortName}
                                </span>
                                <span
                                    className="director-grand-total-value"
                                    style={{ color: hasData ? meta.color : 'var(--text-muted)' }}
                                >
                                    {hasData ? total : '–'}
                                </span>
                            </div>
                        );
                    })}
                    <div className="director-grand-total-item director-grand-total-sum">
                        <span className="director-grand-total-label">Celkem</span>
                        <span className="director-grand-total-value">
                            {evaluatorIds.reduce((acc, eid) => acc + calculateTotalSum(evals[eid]), 0)}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
