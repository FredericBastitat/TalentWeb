import React from 'react';
import { CATEGORIES, EVALUATOR_META, calculateCategorySum, PENALTY_LABELS } from '../constants';
import CandidateNavigation from './CandidateNavigation';

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
                <CandidateNavigation
                    currentIndex={currentIndex}
                    totalCount={candidates.length}
                    candidateCode={candidate.code}
                    onNavigate={onNavigate}
                    showCounter={true}
                />
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

                                {hasData && (
                                    <div className="director-summary-breakdown">
                                        <span>P: {calculateCategorySum(ev, 'portrait')}</span>
                                        <span>S: {calculateCategorySum(ev, 'file')}</span>
                                        <span>Z: {calculateCategorySum(ev, 'still-life')}</span>
                                        <span style={{ fontWeight: 800, color: 'var(--text-primary)' }}>Σ: {calculateTotalSum(ev)}</span>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Detailed comparison per category */}
                {CATEGORIES.map(category => (
                    <div className="category-section" key={category.key}>
                        <div className="category-header" style={{ borderLeftColor: category.color }}>
                            <span className="category-title" style={{ color: category.color }}>{category.title}</span>
                        </div>
                        <div className="category-body">
                            {/* Column Headers */}
                            <div className="director-criterion-header">
                                <span className="director-criterion-name-header">Kritérium</span>
                                {evaluatorIds.map(eid => (
                                    <span key={eid} className="director-criterion-score-header" style={{ color: EVALUATOR_META[eid].color }}>
                                        {EVALUATOR_META[eid].shortName}
                                    </span>
                                ))}
                                <span className="director-criterion-score-header" style={{ color: 'var(--accent-primary)' }}>Σ</span>
                            </div>

                            {/* Category SUM */}
                            <div className="director-criterion-row director-criterion-sum-row" style={{
                                background: category.colorBg,
                                borderBottom: `1px solid ${category.color}44`,
                                marginBottom: '0.5rem',
                                padding: '0.75rem'
                            }}>
                                <span className="director-criterion-name" style={{ fontWeight: 800, fontSize: '1.1rem', color: category.color }}>
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
                                                color: hasData ? 'var(--text-primary)' : 'var(--text-muted)',
                                                fontWeight: 800,
                                                fontSize: '1.1rem',
                                                opacity: hasData ? 1 : 0.3
                                            }}
                                        >
                                            <span className="director-score-value">
                                                {hasData ? sum : '–'}
                                            </span>
                                        </div>
                                    );
                                })}
                                {/* Row Total for SUMA */}
                                <div className="director-criterion-score" style={{ fontWeight: 900, color: category.color, fontSize: '1.1rem' }}>
                                    {evaluatorIds.reduce((acc, eid) => acc + calculateCategorySum(evals[eid], category.key), 0)}
                                </div>
                            </div>

                            {category.criteria.map(criterion => {
                                const rowTotal = evaluatorIds.reduce((acc, eid) => acc + (evals[eid]?.[category.key]?.[criterion.key] || 0), 0);
                                return (
                                    <div className="director-criterion-row" key={criterion.key}>
                                        <span className="director-criterion-name">
                                            {criterion.name}
                                        </span>
                                        {evaluatorIds.map(eid => {
                                            const ev = evals[eid];
                                            const score = ev?.[category.key]?.[criterion.key];
                                            const hasData = ev != null;
                                            return (
                                                <div
                                                    key={eid}
                                                    className="director-criterion-score"
                                                    style={{ color: 'var(--text-secondary)' }}
                                                >
                                                    <span className="director-score-value">
                                                        {hasData ? (score ?? 0) : '–'}
                                                    </span>
                                                </div>
                                            );
                                        })}
                                        {/* Row Total for Criterion */}
                                        <div className="director-criterion-score" style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                                            {rowTotal}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}



                {/* Bottom navigation */}
                <div className="save-row" style={{ marginTop: '2rem' }}>
                    <button className="btn btn-secondary" style={{ width: '100%', padding: '1rem' }} onClick={onBack}>
                        ← Zpět na přehled
                    </button>

                    <CandidateNavigation
                        currentIndex={currentIndex}
                        totalCount={candidates.length}
                        candidateCode={candidate.code}
                        onNavigate={onNavigate}
                    />
                </div>
            </div>
        </div>
    );
}
