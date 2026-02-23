import React, { useState, useMemo } from 'react';

export default function OverviewScreen({
    candidates,
    calculateCategorySum,
    onOpenEvaluation,
    onMoveCandidate,
    onManageCandidates,
    onExport,
}) {
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState('code');

    const processedCandidates = useMemo(() => {
        let list = candidates.map((c, originalIndex) => ({
            ...c,
            originalIndex,
            portraitSum: calculateCategorySum(c, 'portrait'),
            fileSum: calculateCategorySum(c, 'file'),
            stillLifeSum: calculateCategorySum(c, 'still-life'),
        }));

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
                case 'total': {
                    const totalA = a.portraitSum + a.fileSum + a.stillLifeSum;
                    const totalB = b.portraitSum + b.fileSum + b.stillLifeSum;
                    return totalB - totalA;
                }
                case 'portrait':
                    return b.portraitSum - a.portraitSum;
                case 'file':
                    return b.fileSum - a.fileSum;
                case 'still-life':
                    return b.stillLifeSum - a.stillLifeSum;
                default:
                    return 0;
            }
        });

        return list;
    }, [candidates, searchTerm, sortBy, calculateCategorySum]);

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
                    <option value="code">Řadit podle kódu</option>
                    <option value="total">Řadit podle celkového součtu</option>
                    <option value="portrait">Řadit podle portrétu</option>
                    <option value="file">Řadit podle souboru</option>
                    <option value="still-life">Řadit podle zátiší</option>
                </select>

                <button className="btn btn-primary" onClick={onManageCandidates}>
                    {candidates.length === 0 ? '+ Inicializovat ročník' : '⚙ Upravit uchazeče'}
                </button>
            </div>

            <div className="table-card">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Kód</th>
                            <th>Portrét</th>
                            <th>Soubor</th>
                            <th>Zátiší</th>
                            <th>Celkem</th>
                            <th>Akce</th>
                        </tr>
                    </thead>
                    <tbody>
                        {processedCandidates.length === 0 ? (
                            <tr>
                                <td colSpan="6">
                                    <div className="empty-state">
                                        <div className="empty-state-icon">📋</div>
                                        <h3>Žádní uchazeči</h3>
                                        <p>Přidejte uchazeče pomocí tlačítka výše</p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            processedCandidates.map((candidate) => {
                                const total = candidate.portraitSum + candidate.fileSum + candidate.stillLifeSum;
                                return (
                                    <tr key={candidate.id}>
                                        <td>
                                            <span className="code-badge">{candidate.code || ''}</span>
                                        </td>
                                        <td className="score-cell">{candidate.portraitSum}</td>
                                        <td className="score-cell">{candidate.fileSum}</td>
                                        <td className="score-cell">{candidate.stillLifeSum}</td>
                                        <td>
                                            <span className="score-total">{total}</span>
                                        </td>
                                        <td>
                                            <div className="table-actions">
                                                <button
                                                    className="btn-table-action btn-table-edit"
                                                    title="Upravit"
                                                    onClick={() => onOpenEvaluation(candidate.originalIndex)}
                                                >
                                                    ✏️
                                                </button>
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
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
