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
        { id: 'evaluator-1', name: 'Hodnotitel č. 1' },
        { id: 'evaluator-2', name: 'Hodnotitel č. 2' },
        { id: 'evaluator-3', name: 'Hodnotitel č. 3' },
        { id: 'director', name: 'Administrátor (Ředitel)' },
    ];

    useEffect(() => {
        fetchUsers();
    }, []);

    const invokeAdmin = async (action, userData = {}) => {
        const { data: { session } } = await supabase.auth.getSession();
        return await supabase.functions.invoke('manage-users', {
            body: { action, userData },
            headers: {
                Authorization: `Bearer ${session?.access_token}`
            }
        });
    };

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const { data, error } = await invokeAdmin('list');
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
            const { data, error } = await invokeAdmin('create', formData);

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

    const handleDeleteUser = async (userId, userEmail) => {
        if (!window.confirm(`Opravdu chcete smazat uživatele ${userEmail}?`)) return;

        setLoading(true);
        try {
            const { data, error } = await invokeAdmin('delete', { userId });

            if (error) throw error;
            if (!data.success) throw new Error(data.error);

            showToast('Uživatel smazán', 'success');
            fetchUsers();
        } catch (err) {
            showToast(err.message || 'Chyba při mazání', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-card animate-slide-up" style={{ maxWidth: '640px' }}>
                <div className="modal-header">
                    <h2>Správa uživatelů</h2>
                    <button className="btn-close" onClick={onClose} aria-label="Zavřít">&times;</button>
                </div>

                <div className="user-management-body">
                    {!showForm ? (
                        <>
                            <div className="user-list-header">
                                <h3 className="user-list-title">Aktuální uživatelé</h3>
                                <button className="btn btn-primary" onClick={() => setShowForm(true)}>
                                    ＋ Nový uživatel
                                </button>
                            </div>

                            {loading && users.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                                    <div className="animate-pulse">Načítání seznamu...</div>
                                </div>
                            ) : (
                                <div className="user-table-wrapper">
                                    <table className="data-table">
                                        <thead>
                                            <tr>
                                                <th>E-mail hodnostitele</th>
                                                <th>Přiřazená role</th>
                                                <th style={{ textAlign: 'right' }}>Akce</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {users.map(u => (
                                                <tr key={u.id}>
                                                    <td style={{ fontSize: '0.85rem', fontWeight: 500 }}>{u.email}</td>
                                                    <td>
                                                        <span className={`user-role-tag ${u.role === 'director' ? 'user-role-director' : 'user-role-evaluator'}`}>
                                                            {roles.find(r => r.id === u.role)?.name || u.role}
                                                        </span>
                                                    </td>
                                                    <td style={{ textAlign: 'right' }}>
                                                        <button
                                                            className="btn-delete-user"
                                                            onClick={() => handleDeleteUser(u.id, u.email)}
                                                            disabled={loading}
                                                            title="Smazat uživatele"
                                                        >
                                                            Smazat
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </>
                    ) : (
                        <form onSubmit={handleCreateUser} className="login-form animate-fade-in">
                            <h3 className="user-list-title" style={{ marginBottom: '1.5rem' }}>Vytvořit nový přístup</h3>

                            <div className="input-group">
                                <label>Přihlašovací e-mail</label>
                                <input
                                    type="email"
                                    className="input-field"
                                    required
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    placeholder="jmeno@skola.cz"
                                />
                            </div>

                            <div className="input-group" style={{ marginTop: '1rem' }}>
                                <label>Heslo (min. 6 znaků)</label>
                                <input
                                    type="password"
                                    className="input-field"
                                    required
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    placeholder="••••••••"
                                    minLength={6}
                                />
                            </div>

                            <div className="input-group" style={{ marginTop: '1rem' }}>
                                <label>Typ oprávnění</label>
                                <select
                                    className="select-field"
                                    style={{ width: '100%', height: '46px' }}
                                    value={formData.role}
                                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                >
                                    {roles.map(r => (
                                        <option key={r.id} value={r.id}>{r.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div style={{ display: 'flex', gap: '1rem', marginTop: '2.5rem' }}>
                                <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowForm(false)}>
                                    Zrušit
                                </button>
                                <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={loading}>
                                    {loading ? 'Ukládám...' : 'Vytvořit uživatele'}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
