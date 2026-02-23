import React, { useState, useEffect, useCallback, useRef } from 'react';
import CriterionCard from './CriterionCard';

// Category definitions – exactly matching original HTML
const CATEGORIES = [
    {
        key: 'portrait',
        title: 'PORTRÉT',
        criteria: [
            {
                key: 'formal',
                name: 'Formální pravidla',
                maxScore: 2,
                penalties: [
                    { value: 'wrong-count', label: 'Jiný počet fotografií' },
                    { value: 'wrong-mounting', label: 'Nenalepené na podkladovém papíru, špatný podklad' },
                    { value: 'wrong-format', label: 'Jiný formát nebo orientace fotografií' },
                ],
            },
            {
                key: 'genre',
                name: 'Žánr',
                maxScore: 2,
                penalties: [
                    { value: 'wrong-genre', label: 'Nedodržení žánru (portrét, zátiší)' },
                    { value: 'wrong-requirements', label: 'Nedodržení požadavků interiér/exteriér, vytvořené/nalezené, barva/ČB' },
                ],
            },
            {
                key: 'creativity',
                name: 'Volba námětu / kreativita',
                maxScore: 2,
                penalties: [
                    { value: 'uninteresting', label: 'Nezajímavý námět, fotografie bez nápadu' },
                    { value: 'low-creativity', label: 'Malá míra kreativity' },
                    { value: 'inconsistent', label: 'Nekonzistentní soubor fotografií' },
                ],
            },
            {
                key: 'composition',
                name: 'Kompozice',
                maxScore: 2,
                penalties: [
                    { value: 'wrong-rules', label: 'Bezdůvodné nedodržení kompozičních pravidel' },
                    { value: 'wrong-dof', label: 'Nevhodné použití hloubky ostrosti' },
                    { value: 'wrong-crop', label: 'Chybné ořezy snímku' },
                    { value: 'mergers', label: 'Srostlice a rušivé prvky' },
                    { value: 'distracting', label: 'Rušivé prvky vyvádějící pozornost' },
                ],
            },
            {
                key: 'technical',
                name: 'Práce se světlem, technická kvalita',
                maxScore: 2,
                penalties: [
                    { value: 'unsharp', label: 'Neostrá fotografie' },
                    { value: 'exposure', label: 'Nevhodná expozice' },
                    { value: 'white-balance', label: 'Špatné vyvážení bílé' },
                    { value: 'resolution', label: 'Příliš malé rozlišení nebo šum' },
                    { value: 'editing', label: 'Fotografie pokažená nevhodnou editací' },
                ],
            },
        ],
    },
    {
        key: 'file',
        title: 'SOUBOR',
        criteria: [
            {
                key: 'formal',
                name: 'Formální pravidla',
                maxScore: 2,
                penalties: [
                    { value: 'wrong-count', label: 'Jiný počet fotografií' },
                    { value: 'wrong-mounting', label: 'Nenalepené na podkladovém papíru' },
                    { value: 'wrong-format', label: 'Jiný formát nebo orientace' },
                ],
            },
            {
                key: 'relevance',
                name: 'Jasná souvislost s tématem souboru',
                maxScore: 2,
                penalties: [
                    { value: 'wrong-genre', label: 'Nedodržení žánru' },
                    { value: 'wrong-requirements', label: 'Nedodržení požadavků interiér/exteriér, barva/ČB' },
                ],
            },
            {
                key: 'creativity',
                name: 'Volba námětu / kreativita',
                maxScore: 2,
                penalties: [
                    { value: 'uninteresting', label: 'Nezajímavý námět' },
                    { value: 'low-creativity', label: 'Malá míra kreativity' },
                    { value: 'inconsistent', label: 'Nekonzistentní soubor' },
                ],
            },
            {
                key: 'composition',
                name: 'Kompozice',
                maxScore: 2,
                penalties: [
                    { value: 'wrong-rules', label: 'Bezdůvodné nedodržení kompozičních pravidel' },
                    { value: 'wrong-dof', label: 'Nevhodné použití hloubky ostrosti' },
                    { value: 'wrong-crop', label: 'Chybné ořezy' },
                    { value: 'mergers', label: 'Srostlice' },
                    { value: 'distracting', label: 'Rušivé prvky' },
                ],
            },
            {
                key: 'technical',
                name: 'Práce se světlem, technická kvalita',
                maxScore: 2,
                penalties: [
                    { value: 'unsharp', label: 'Neostrá fotografie' },
                    { value: 'exposure', label: 'Nevhodná expozice' },
                    { value: 'white-balance', label: 'Špatné vyvážení bílé' },
                    { value: 'resolution', label: 'Malé rozlišení nebo šum' },
                    { value: 'editing', label: 'Nevhodná editace' },
                ],
            },
        ],
    },
    {
        key: 'still-life',
        title: 'ZÁTIŠÍ',
        criteria: [
            {
                key: 'formal',
                name: 'Formální pravidla',
                maxScore: 2,
                penalties: [
                    { value: 'wrong-count', label: 'Jiný počet fotografií' },
                    { value: 'wrong-mounting', label: 'Nenalepené na podkladovém papíru' },
                    { value: 'wrong-format', label: 'Jiný formát nebo orientace' },
                ],
            },
            {
                key: 'genre',
                name: 'Žánr a požadavky',
                maxScore: 2,
                penalties: [
                    { value: 'wrong-genre', label: 'Nedodržení žánru' },
                    { value: 'wrong-requirements', label: 'Nedodržení požadavků interiér/exteriér, barva/ČB' },
                ],
            },
        ],
    },
];

export default function EvaluationScreen({
    candidates,
    currentIndex,
    onBack,
    onNavigate,
    onSave,
}) {
    const candidate = candidates[currentIndex];
    const [evaluation, setEvaluation] = useState({});
    const prevIndexRef = useRef(currentIndex);

    // Load evaluation when candidate changes
    useEffect(() => {
        if (candidate) {
            const ev = candidate.evaluation || {
                portrait: { formal: 0 },
                file: { formal: 0 },
                'still-life': { formal: 0 },
            };
            setEvaluation(JSON.parse(JSON.stringify(ev)));
        }
    }, [candidate?.id, currentIndex]);

    // Auto-save when navigating away
    useEffect(() => {
        if (prevIndexRef.current !== currentIndex && candidates[prevIndexRef.current]) {
            const prevCandidate = candidates[prevIndexRef.current];
            // Save quietly
            onSave(evaluation, prevCandidate.id, false);
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

    // Calculate sum for a category from current form state
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

            <div className="eval-form">
                <div className="eval-candidate-info">
                    <span className="eval-candidate-code">{candidate.code || ''}</span>
                </div>

                {CATEGORIES.map(category => {
                    const catData = evaluation[category.key] || {};
                    const sum = getCategorySum(category.key);

                    return (
                        <div className="category-section" key={category.key}>
                            <div className="category-header">
                                <span className="category-title">{category.title}</span>
                                <span className="category-sum-badge">{sum}</span>
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

                <div className="total-bar">
                    <span className="total-bar-label">Celkový součet</span>
                    <span className="total-bar-value">{totalSum}</span>
                </div>

                <div className="save-row">
                    <button className="btn btn-primary btn-save" onClick={handleSave}>
                        💾 Uložit hodnocení
                    </button>
                </div>
            </div>
        </div>
    );
}
