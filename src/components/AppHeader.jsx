import React, { useMemo } from 'react';

export default function AppHeader({ currentYear, onYearChange, onLogout }) {
    const years = useMemo(() => {
        const currentYearValue = new Date().getFullYear();
        const yrs = [];
        for (let year = 2020; year <= currentYearValue + 1; year++) {
            yrs.push(`${year}/${year + 1}`);
        }
        return yrs.reverse();
    }, []);

    return (
        <header className="app-header">
            <div className="header-left">
                <span className="header-logo">📷 TalentWeb</span>
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
