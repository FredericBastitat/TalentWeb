import React, { useState } from 'react';

export default function LoginScreen({ onLogin }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const errorMsg = await onLogin(email, password);
        if (errorMsg) {
            setError(errorMsg);
        }
        setLoading(false);
    };

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

                    <div className="error-message">{error}</div>

                    <button
                        type="submit"
                        className="btn btn-primary btn-primary-full"
                        disabled={loading}
                    >
                        {loading ? 'Přihlašování...' : 'Přihlásit se'}
                    </button>

                    <p style={{ marginTop: '1rem', fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                        Vaše role bude přiřazena automaticky podle účtu.
                    </p>
                </form>
            </div>
        </div>
    );
}
