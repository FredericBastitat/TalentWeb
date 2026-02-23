import React, { useState } from 'react';
import { EVALUATOR_META, DIRECTOR_META } from '../constants';

const ROLES = [
    { value: 'evaluator-1', ...EVALUATOR_META[1], icon: '🎨' },
    { value: 'evaluator-2', ...EVALUATOR_META[2], icon: '🎭' },
    { value: 'evaluator-3', ...EVALUATOR_META[3], icon: '🖼️' },
    { value: 'director', ...DIRECTOR_META, icon: '👔', suffix: '(pouze prohlížení)' },
];

export default function LoginScreen({ onLogin }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [selectedRole, setSelectedRole] = useState('evaluator-1');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const errorMsg = await onLogin(email, password, selectedRole);
        if (errorMsg) {
            setError(errorMsg);
        }
        setLoading(false);
    };

    const activeRole = ROLES.find(r => r.value === selectedRole);

    return (
        <div className="login-screen">
            <div className="login-card">
                <div className="login-logo">
                    <div className="login-logo-icon">📷</div>
                    <h1>TalentWeb</h1>
                    <p>Hodnocení talentových zkoušek</p>
                </div>

                <form className="login-form" onSubmit={handleSubmit}>
                    <div className="input-group">
                        <label htmlFor="login-email">Email</label>
                        <input
                            id="login-email"
                            type="email"
                            className="input-field"
                            placeholder="vas@email.cz"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            autoComplete="email"
                        />
                    </div>

                    <div className="input-group">
                        <label htmlFor="login-password">Heslo</label>
                        <input
                            id="login-password"
                            type="password"
                            className="input-field"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            autoComplete="current-password"
                        />
                    </div>

                    <div className="input-group">
                        <label>Přihlásit jako</label>
                        <div className="role-grid">
                            {ROLES.map(role => (
                                <button
                                    key={role.value}
                                    type="button"
                                    className={`role-option ${selectedRole === role.value ? 'active' : ''}`}
                                    style={{
                                        '--role-color': role.color,
                                        '--role-bg': role.bg,
                                        '--role-border': role.borderColor,
                                    }}
                                    onClick={() => setSelectedRole(role.value)}
                                >
                                    <span className="role-option-icon">{role.icon}</span>
                                    <span className="role-option-name">{role.name}</span>
                                    {role.suffix && <span className="role-option-suffix">{role.suffix}</span>}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="error-message">{error}</div>

                    <button
                        type="submit"
                        className="btn btn-primary btn-primary-full"
                        disabled={loading}
                        style={{
                            background: activeRole
                                ? `linear-gradient(135deg, ${activeRole.color}, ${activeRole.color}dd)`
                                : undefined,
                        }}
                    >
                        {loading ? 'Přihlašování...' : `Přihlásit se jako ${activeRole?.name || ''}`}
                    </button>
                </form>
            </div>
        </div>
    );
}
