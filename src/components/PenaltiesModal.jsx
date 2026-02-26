import React from 'react';
import { EVALUATOR_META, CATEGORIES, PENALTY_LABELS } from '../constants';

export default function PenaltiesModal({ candidate, evaluationsMap, onClose }) {
    if (!candidate) return null;

    const evals = evaluationsMap[candidate.id] || {};
    const evaluatorIds = [1, 2, 3];

    // Collect all penalties grouped by category
    const penaltiesByCategory = CATEGORIES.map(cat => {
        const catPenalties = [];
        evaluatorIds.forEach(eid => {
            const ev = evals[eid];
            if (!ev || !ev[cat.key]) return;

            const penalties = ev[cat.key].penalties || {};
            Object.keys(penalties).forEach(criterionKey => {
                const pKeys = penalties[criterionKey];
                const criterion = cat.criteria.find(c => c.key === criterionKey);

                pKeys.forEach(pKey => {
                    catPenalties.push({
                        evaluatorId: eid,
                        categoryTitle: cat.title,
                        criterionName: criterion?.name || criterionKey,
                        label: PENALTY_LABELS[pKey] || pKey
                    });
                });
            });
        });
        return {
            title: cat.title,
            penalties: catPenalties
        };
    }).filter(group => group.penalties.length > 0);

    const hasAnyPenalties = penaltiesByCategory.length > 0;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-card animate-zoom-in" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h3>⚠️ Přehled chyb: {candidate.code}</h3>
                    <button className="btn-close" onClick={onClose}>&times;</button>
                </div>
                <div className="modal-body">
                    {!hasAnyPenalties ? (
                        <div className="empty-state" style={{ padding: '2rem 0' }}>
                            <p>Tento uchazeč nemá žádné zaznamenané chyby.</p>
                        </div>
                    ) : (
                        <div className="penalties-list">
                            {penaltiesByCategory.map((group, gIdx) => (
                                <div key={gIdx} className="penalty-group">
                                    <h4 className="penalty-group-title">{group.title}</h4>
                                    {group.penalties.map((p, idx) => (
                                        <div key={idx} className="penalty-item-row" style={{ borderLeftColor: EVALUATOR_META[p.evaluatorId].color }}>
                                            <div className="penalty-item-meta">
                                                <span className="penalty-evaluator" style={{ color: EVALUATOR_META[p.evaluatorId].color }}>
                                                    {EVALUATOR_META[p.evaluatorId].shortName}
                                                </span>
                                                <span className="penalty-criterion">{p.criterionName}</span>
                                            </div>
                                            <div className="penalty-label-text">{p.label}</div>
                                        </div>
                                    ))}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                <div className="modal-footer">
                    <button className="btn btn-primary" onClick={onClose}>Zavřít</button>
                </div>
            </div>
        </div>
    );
}
