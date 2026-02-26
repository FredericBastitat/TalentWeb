import React, { useState, useEffect, useRef } from 'react';
import { CATEGORIES, DEFAULT_EVALUATION } from '../constants';
import CriterionCard from './CriterionCard';
import CandidateNavigation from './CandidateNavigation';

export default function EvaluationScreen({
    candidates,
    currentIndex,
    evaluationsMap,
    evaluatorId,
    onBack,
    onNavigate,
    onSave,
}) {
    const candidate = candidates[currentIndex];
    const [evaluation, setEvaluation] = useState({});
    const prevIndexRef = useRef(currentIndex);
    const evaluationRef = useRef(evaluation);
    evaluationRef.current = evaluation;

    // Load evaluation when candidate changes
    useEffect(() => {
        if (candidate) {
            const stored = evaluationsMap[candidate.id]?.[evaluatorId] || null;
            const ev = stored || JSON.parse(JSON.stringify(DEFAULT_EVALUATION));
            setEvaluation(JSON.parse(JSON.stringify(ev)));
        }
    }, [candidate?.id, currentIndex]);

    // Auto-save when navigating away
    useEffect(() => {
        if (prevIndexRef.current !== currentIndex && candidates[prevIndexRef.current]) {
            const prevCandidate = candidates[prevIndexRef.current];
            onSave(evaluationRef.current, prevCandidate.id, false);
        }
        prevIndexRef.current = currentIndex;
    }, [currentIndex]);

    if (!candidate) return null;

    const handleScoreChange = (categoryKey, criterionKey, value) => {
        setEvaluation(prev => {
            const next = { ...prev };
            if (!next[categoryKey]) next[categoryKey] = { formal: 0 };
            next[categoryKey] = { ...next[categoryKey], [criterionKey]: parseInt(value) || 0 };
            return next;
        });
    };

    const handlePenaltyChange = (categoryKey, criterionKey, penaltyValue, checked) => {
        setEvaluation(prev => {
            const next = { ...prev };
            if (!next[categoryKey]) next[categoryKey] = { formal: 0 };
            const cat = { ...next[categoryKey] };
            const penalties = { ...(cat.penalties || {}) };
            const list = [...(penalties[criterionKey] || [])];

            if (checked) {
                if (!list.includes(penaltyValue)) list.push(penaltyValue);
            } else {
                const idx = list.indexOf(penaltyValue);
                if (idx > -1) list.splice(idx, 1);
            }

            if (list.length > 0) {
                penalties[criterionKey] = list;
            } else {
                delete penalties[criterionKey];
            }

            if (Object.keys(penalties).length > 0) {
                cat.penalties = penalties;
            } else {
                delete cat.penalties;
            }

            next[categoryKey] = cat;
            return next;
        });
    };

    const getCategorySum = (categoryKey) => {
        const catData = evaluation[categoryKey];
        if (!catData) return 0;
        let sum = 0;
        Object.keys(catData).forEach(key => {
            if (key !== 'penalties' && typeof catData[key] === 'number') {
                sum += catData[key];
            }
        });
        return sum;
    };

    const portraitSum = getCategorySum('portrait');
    const fileSum = getCategorySum('file');
    const stillLifeSum = getCategorySum('still-life');
    const totalSum = portraitSum + fileSum + stillLifeSum;

    const handleSave = () => {
        onSave(evaluation, candidate.id, true);
    };

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

            <div className="eval-form">
                <div className="eval-candidate-info">
                    <span className="eval-candidate-code">{candidate.code || ''}</span>
                </div>

                {CATEGORIES.map(category => {
                    const catData = evaluation[category.key] || {};
                    const sum = getCategorySum(category.key);

                    return (
                        <div className="category-section" key={category.key} style={{ borderColor: `${category.color}44` }}>
                            <div className="category-header" style={{ borderLeft: `4px solid ${category.color}`, background: category.colorBg }}>
                                <span className="category-title" style={{ color: category.color }}>{category.title}</span>
                                <span className="category-sum-badge" style={{ background: category.color, color: '#000' }}>{sum}</span>
                            </div>
                            <div className="category-body">
                                {category.criteria.map(criterion => {
                                    const scoreValue = catData[criterion.key] || 0;
                                    const checkedPenalties = catData.penalties?.[criterion.key] || [];

                                    return (
                                        <CriterionCard
                                            key={`${category.key}-${criterion.key}`}
                                            criterion={criterion}
                                            categoryKey={category.key}
                                            categoryColor={category.color}
                                            score={scoreValue}
                                            disabled={false}
                                            checkedPenalties={checkedPenalties}
                                            onScoreChange={handleScoreChange}
                                            onPenaltyChange={handlePenaltyChange}
                                        />
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}



                <div className="save-row" style={{ marginTop: '2rem' }}>
                    <button className="btn btn-primary btn-save" style={{ width: '100%', padding: '1rem' }} onClick={handleSave}>
                        💾 Uložit hodnocení
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
