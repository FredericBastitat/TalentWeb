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
                            {/* Category SUM (moved to top and highlighted) */}
                            <div className="director-criterion-row director-criterion-sum-row" style={{
                                background: 'rgba(255,255,255,0.05)',
                                borderBottom: '1px solid rgba(255,255,255,0.1)',
                                marginBottom: '0.5rem',
                                padding: '0.75rem'
                            }}>
                                <span className="director-criterion-name" style={{ fontWeight: 800, fontSize: '1.1rem' }}>
                                    PRŮMĚR / SUMA
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
                                                fontWeight: 800,
                                                fontSize: '1.1rem'
                                            }}
                                        >
                                            <span className="director-score-value">
                                                {hasData ? sum : '–'}
                                            </span>
                                        </div>
                                    );
                                })}
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
                                                </div>
                                            );
                                        })}
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
