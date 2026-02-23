import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

export default function UserManagementModal({ onClose, showToast }) {
    const [loading, setLoading] = useState(true);
    const [users, setUsers] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        role: 'evaluator-1'
    });

    const roles = [
        { id: 'evaluator-1', name: 'Hodnotitel 1 (H1)' },
        { id: 'evaluator-2', name: 'Hodnotitel 2 (H2)' },
        { id: 'evaluator-3', name: 'Hodnotitel 3 (H3)' },
        { id: 'director', name: 'Ředitel (Director)' },
    ];

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase.functions.invoke('manage-users', {
                body: { action: 'list' },
                headers: {
                    Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
                }
            });
            if (error) throw error;
            if (data.success) {
                setUsers(data.users || []);
            }
        } catch (err) {
            console.error('Error fetching users:', err);
            showToast('Nepodařilo se načíst seznam uživatelů', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateUser = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const { data, error } = await supabase.functions.invoke('manage-users', {
                body: { action: 'create', userData: formData },
                headers: {
                    Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
                }
            });

            if (error) throw error;
            if (!data.success) throw new Error(data.error);

            showToast('Uživatel vytvořen', 'success');
            setShowForm(false);
            setFormData({ email: '', password: '', role: 'evaluator-1' });
            fetchUsers();
        } catch (err) {
            showToast(err.message || 'Chyba při vytváření', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-card animate-slide-up" style={{ maxWidth: '600px' }}>
                <div className="modal-header">
                    <h2>Správa uživatelů</h2>
                    <button className="btn-close" onClick={onClose}>&times;</button>
                </div>

                <div className="modal-body" style={{ padding: '1.5rem', overflowY: 'auto' }}>
                    {!showForm ? (
                        <>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                <h3 style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>Seznam uživatelů</h3>
                                <button className="btn btn-primary" onClick={() => setShowForm(true)}>
                                    ＋ Přidat uživatele
                                </button>
                            </div>

                            {loading && users.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Načítání...</div>
                            ) : (
                                <div className="table-card" style={{ margin: 0, background: 'rgba(0,0,0,0.2)' }}>
                                    <table className="data-table">
                                        <thead>
                                            <tr>
                                                <th style={{ padding: '0.5rem' }}>Email</th>
                                                <th style={{ padding: '0.5rem' }}>Role</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {users.map(u => (
                                                <tr key={u.id}>
                                                    <td style={{ padding: '0.6rem', fontSize: '0.85rem' }}>{u.email}</td>
                                                    <td style={{ padding: '0.6rem' }}>
                                                        <span className="director-readonly-badge"
                                                            style={{
                                                                fontSize: '0.7rem',
                                                                color: u.role === 'director' ? '#c084fc' : '#818cf8',
                                                                borderColor: u.role === 'director' ? 'rgba(192,132,252,0.3)' : 'rgba(129,140,248,0.3)'
                                                            }}>
                                                            {u.role}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </>
                    ) : (
                        <form onSubmit={handleCreateUser} className="login-form">
                            <h3 style={{ fontSize: '1rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>Nový uživatel</h3>

                            <div className="input-group">
                                <label>E-mail</label>
                                <input
                                    type="email"
                                    className="input-field"
                                    required
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>

                            <div className="input-group" style={{ marginTop: '1rem' }}>
                                <label>Heslo</label>
                                <input
                                    type="password"
                                    className="input-field"
                                    required
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    minLength={6}
                                />
                            </div>

                            <div className="input-group" style={{ marginTop: '1rem' }}>
                                <label>Role</label>
                                <select
                                    className="select-field"
                                    style={{ width: '100%' }}
                                    value={formData.role}
                                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                >
                                    {roles.map(r => (
                                        <option key={r.id} value={r.id}>{r.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '2rem' }}>
                                <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowForm(false)}>
                                    Zpět na seznam
                                </button>
                                <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={loading}>
                                    {loading ? 'Vytváření...' : 'Vytvořit'}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
