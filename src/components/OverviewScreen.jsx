import React, { useState, useMemo } from 'react';
import { EVALUATOR_META, calculateCategorySum, calculateTotalSum } from '../constants';

export default function OverviewScreen({
    candidates,
    evaluationsMap,
    role,
    evaluatorId,
    isDirector,
    onOpenEvaluation,
    onMoveCandidate,
    onManageCandidates,
    onExport,
}) {
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState('code');

    const processedCandidates = useMemo(() => {
        let list = candidates.map((c, originalIndex) => {
            const entry = { ...c, originalIndex };

            if (isDirector) {
                // Director: compute totals for all 3 evaluators
                const evals = evaluationsMap[c.id] || {};
                entry.evaluatorTotals = {};
                let grandTotal = 0;
                [1, 2, 3].forEach(eid => {
                    const ev = evals[eid] || null;
                    const total = calculateTotalSum(ev);
                    entry.evaluatorTotals[eid] = total;
                    grandTotal += total;
                });
                entry.grandTotal = grandTotal;
            } else {
                // Evaluator: compute their own category sums
                const ev = evaluationsMap[c.id]?.[evaluatorId] || null;
                entry.portraitSum = calculateCategorySum(ev, 'portrait');
                entry.fileSum = calculateCategorySum(ev, 'file');
                entry.stillLifeSum = calculateCategorySum(ev, 'still-life');
                entry.total = entry.portraitSum + entry.fileSum + entry.stillLifeSum;
            }

            return entry;
        });

        // Filter
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            list = list.filter(c => (c.code || '').toLowerCase().includes(term));
        }

        // Sort
        list.sort((a, b) => {
            switch (sortBy) {
                case 'code':
                    return (a.code || '').localeCompare(b.code || '');
                case 'total':
                    if (isDirector) return b.grandTotal - a.grandTotal;
                    return b.total - a.total;
                case 'portrait':
                    return (b.portraitSum || 0) - (a.portraitSum || 0);
                case 'file':
                    return (b.fileSum || 0) - (a.fileSum || 0);
                case 'still-life':
                    return (b.stillLifeSum || 0) - (a.stillLifeSum || 0);
                case 'h1':
                    return (b.evaluatorTotals?.[1] || 0) - (a.evaluatorTotals?.[1] || 0);
                case 'h2':
                    return (b.evaluatorTotals?.[2] || 0) - (a.evaluatorTotals?.[2] || 0);
                case 'h3':
                    return (b.evaluatorTotals?.[3] || 0) - (a.evaluatorTotals?.[3] || 0);
                default:
                    return 0;
            }
        });

        return list;
    }, [candidates, evaluationsMap, searchTerm, sortBy, isDirector, evaluatorId]);

    const sortOptions = isDirector
        ? [
            { value: 'code', label: 'Řadit podle kódu' },
            { value: 'total', label: 'Řadit podle celkového součtu' },
            { value: 'h1', label: 'Řadit podle H1' },
            { value: 'h2', label: 'Řadit podle H2' },
            { value: 'h3', label: 'Řadit podle H3' },
        ]
        : [
            { value: 'code', label: 'Řadit podle kódu' },
            { value: 'total', label: 'Řadit podle celkového součtu' },
            { value: 'portrait', label: 'Řadit podle portrétu' },
            { value: 'file', label: 'Řadit podle souboru' },
            { value: 'still-life', label: 'Řadit podle zátiší' },
        ];

    return (
        <div className="animate-fade-in">
            <div className="overview-toolbar">
                <button className="btn btn-secondary" onClick={onExport}>
                    📊 Exportovat Excel
                </button>

                <div className="search-wrapper">
                    <span className="search-icon">🔍</span>
                    <input
                        id="search-input"
                        type="text"
                        className="search-input"
                        placeholder="Hledat podle kódu..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <select
                    id="sort-select"
                    className="select-field"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                >
                    {sortOptions.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                </select>

                {!isDirector && (
                    <button className="btn btn-primary" onClick={onManageCandidates}>
                        {candidates.length === 0 ? '+ Inicializovat ročník' : '⚙ Upravit uchazeče'}
                    </button>
                )}
            </div>

            <div className="table-card">
                <table className="data-table">
                    <thead>
                        {isDirector ? (
                            <tr>
                                <th>Kód</th>
                                {[1, 2, 3].map(eid => (
                                    <th
                                        key={eid}
                                        className="evaluator-col-header"
                                        style={{ color: EVALUATOR_META[eid].color }}
                                    >
                                        {EVALUATOR_META[eid].shortName}
                                    </th>
                                ))}
                                <th>Celkem</th>
                                <th>Akce</th>
                            </tr>
                        ) : (
                            <tr>
                                <th>Kód</th>
                                <th>Portrét</th>
                                <th>Soubor</th>
                                <th>Zátiší</th>
                                <th>Celkem</th>
                                <th>Akce</th>
                            </tr>
                        )}
                    </thead>
                    <tbody>
                        {processedCandidates.length === 0 ? (
                            <tr>
                                <td colSpan={isDirector ? 6 : 6}>
                                    <div className="empty-state">
                                        <div className="empty-state-icon">📋</div>
                                        <h3>Žádní uchazeči</h3>
                                        <p>
                                            {isDirector
                                                ? 'V tomto ročníku nejsou žádní uchazeči'
                                                : 'Přidejte uchazeče pomocí tlačítka výše'}
                                        </p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            processedCandidates.map((candidate) => (
                                <tr key={candidate.id}>
                                    <td>
                                        <span className="code-badge">{candidate.code || ''}</span>
                                    </td>

                                    {isDirector ? (
                                        <>
                                            {[1, 2, 3].map(eid => {
                                                const total = candidate.evaluatorTotals[eid];
                                                const hasData = (evaluationsMap[candidate.id]?.[eid]);
                                                return (
                                                    <td key={eid} className="score-cell">
                                                        <span
                                                            className="evaluator-score"
                                                            style={{
                                                                color: hasData ? EVALUATOR_META[eid].color : 'var(--text-muted)',
                                                            }}
                                                        >
                                                            {hasData ? total : '–'}
                                                        </span>
                                                    </td>
                                                );
                                            })}
                                            <td>
                                                <span className="score-total">{candidate.grandTotal}</span>
                                            </td>
                                        </>
                                    ) : (
                                        <>
                                            <td className="score-cell">{candidate.portraitSum}</td>
                                            <td className="score-cell">{candidate.fileSum}</td>
                                            <td className="score-cell">{candidate.stillLifeSum}</td>
                                            <td>
                                                <span className="score-total">{candidate.total}</span>
                                            </td>
                                        </>
                                    )}

                                    <td>
                                        <div className="table-actions">
                                            <button
                                                className="btn-table-action btn-table-edit"
                                                title={isDirector ? 'Zobrazit detail' : 'Upravit'}
                                                onClick={() => onOpenEvaluation(candidate.originalIndex)}
                                            >
                                                {isDirector ? '👁️' : '✏️'}
                                            </button>
                                            {!isDirector && (
                                                <>
                                                    <button
                                                        className="btn-table-action"
                                                        title="Posunout nahoru"
                                                        onClick={() => onMoveCandidate(candidate.originalIndex, -1)}
                                                    >
                                                        ↑
                                                    </button>
                                                    <button
                                                        className="btn-table-action"
                                                        title="Posunout dolů"
                                                        onClick={() => onMoveCandidate(candidate.originalIndex, 1)}
                                                    >
                                                        ↓
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
