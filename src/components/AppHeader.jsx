import React, { useMemo } from 'react';
import { EVALUATOR_META, DIRECTOR_META } from '../constants';

export default function AppHeader({ currentYear, onYearChange, onLogout, role }) {
    const years = useMemo(() => {
        const currentYearValue = new Date().getFullYear();
        const yrs = [];
        for (let year = 2020; year <= currentYearValue + 1; year++) {
            yrs.push(`${year}/${year + 1}`);
        }
        return yrs.reverse();
    }, []);

    const isDirector = role === 'director';
    const evaluatorId = !isDirector && role ? parseInt(role.split('-')[1]) : null;
    const meta = isDirector ? DIRECTOR_META : EVALUATOR_META[evaluatorId];

    return (
        <header className="app-header">
            <div className="header-left">
                <span className="header-logo">📷 TalentWeb</span>
                {meta && (
                    <span
                        className="role-badge"
                        style={{
                            color: meta.color,
                            background: meta.bg,
                            borderColor: meta.borderColor,
                        }}
                    >
                        {meta.name}
                        {isDirector && <span className="role-badge-readonly">read-only</span>}
                    </span>
                )}
            </div>
            <div className="header-right">
                <select
                    id="year-selector"
                    className="select-field"
                    value={currentYear}
                    onChange={(e) => onYearChange(e.target.value)}
                >
                    <option value="">Vyberte školní rok</option>
                    {years.map(year => (
                        <option key={year} value={year}>{year}</option>
                    ))}
                </select>
                <button className="btn btn-secondary" onClick={onLogout}>
                    Odhlásit se
                </button>
            </div>
        </header>
    );
}
