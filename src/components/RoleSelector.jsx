import React from 'react';
import { EVALUATOR_META, DIRECTOR_META } from '../constants';

const ROLES = [
    { value: 'evaluator-1', ...EVALUATOR_META[1], icon: '🎨', desc: 'Hodnocení uměleckých prací' },
    { value: 'evaluator-2', ...EVALUATOR_META[2], icon: '🎭', desc: 'Hodnocení uměleckých prací' },
    { value: 'evaluator-3', ...EVALUATOR_META[3], icon: '🖼️', desc: 'Hodnocení uměleckých prací' },
    { value: 'director', ...DIRECTOR_META, icon: '👔', desc: 'Pouze prohlížení výsledků' },
];

export default function RoleSelector({ onSelect, onLogout }) {
    return (
        <div className="login-screen">
            <div className="role-selector-card">
                <div className="login-logo">
                    <div className="login-logo-icon">📷</div>
                    <h1>TalentWeb</h1>
                    <p>Vyberte svou roli</p>
                </div>

                <div className="role-selector-grid">
                    {ROLES.map(role => (
                        <button
                            key={role.value}
                            className="role-selector-item"
                            style={{
                                '--role-color': role.color,
                                '--role-bg': role.bg,
                                '--role-border': role.borderColor,
                            }}
                            onClick={() => onSelect(role.value)}
                        >
                            <span className="role-selector-icon">{role.icon}</span>
                            <span className="role-selector-name">{role.name}</span>
                            <span className="role-selector-desc">{role.desc}</span>
                        </button>
                    ))}
                </div>

                <button className="btn btn-ghost role-logout-btn" onClick={onLogout}>
                    Odhlásit se
                </button>
            </div>
        </div>
    );
}
