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
    onOpenPenalties,
    onOpenUserManagement,
}) {
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState('code');

    const processedCandidates = useMemo(() => {
        let list = candidates.map((c, originalIndex) => {
            const entry = { ...c, originalIndex };

            if (isDirector) {
                const evals = evaluationsMap[c.id] || {};
                entry.portraitSum = [1, 2, 3].reduce((acc, eid) => acc + calculateCategorySum(evals[eid], 'portrait'), 0);
                entry.fileSum = [1, 2, 3].reduce((acc, eid) => acc + calculateCategorySum(evals[eid], 'file'), 0);
                entry.stillLifeSum = [1, 2, 3].reduce((acc, eid) => acc + calculateCategorySum(evals[eid], 'still-life'), 0);
            } else {
                const ev = evaluationsMap[c.id]?.[evaluatorId] || null;
                entry.portraitSum = calculateCategorySum(ev, 'portrait');
                entry.fileSum = calculateCategorySum(ev, 'file');
                entry.stillLifeSum = calculateCategorySum(ev, 'still-life');
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
                case 'portrait':
                    return (b.portraitSum || 0) - (a.portraitSum || 0);
                case 'file':
                    return (b.fileSum || 0) - (a.fileSum || 0);
                case 'still-life':
                    return (b.stillLifeSum || 0) - (a.stillLifeSum || 0);
                default:
                    return 0;
            }
        });

        return list;
    }, [candidates, evaluationsMap, searchTerm, sortBy, isDirector, evaluatorId]);

    const sortOptions = [
        { value: 'code', label: 'Řadit podle kódu' },
        { value: 'portrait', label: 'Řadit podle portrétu' },
        { value: 'file', label: 'Řadit podle souboru' },
        { value: 'still-life', label: 'Řadit podle zátiší' },
    ];

    return (
        <div className="animate-fade-in">
            <div className="overview-toolbar">
                {isDirector && (
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button className="btn btn-secondary" onClick={onOpenUserManagement}>
                            👤 Správa uživatelů
                        </button>
                        <button className="btn btn-secondary" onClick={onExport}>
                            📊 Exportovat Excel
                        </button>
                    </div>
                )}

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
                        <tr>
                            <th>Kód</th>
                            <th>Portrét</th>
                            <th>Soubor</th>
                            <th>Zátiší</th>
                            <th>Akce</th>
                        </tr>
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

                                    <td className="score-cell">{candidate.portraitSum}</td>
                                    <td className="score-cell">{candidate.fileSum}</td>
                                    <td className="score-cell">{candidate.stillLifeSum}</td>

                                    <td>
                                        <div className="table-actions">
                                            {isDirector && (
                                                <button
                                                    className="btn-table-action btn-table-penalty"
                                                    title="Zobrazit chyby"
                                                    onClick={() => onOpenPenalties(candidate)}
                                                >
                                                    ⚠️
                                                </button>
                                            )}
                                            <button
                                                className="btn-table-action btn-table-edit"
                                                title={isDirector ? 'Zobrazit detail' : 'Upravit'}
                                                onClick={() => onOpenEvaluation(candidate.originalIndex)}
                                            >
                                                {isDirector ? '👁️' : '✏️'}
                                            </button>

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
