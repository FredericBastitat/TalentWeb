import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { EVALUATOR_META } from '../constants';

export default function UserManagementModal({ onClose, showToast }) {
    const [loading, setLoading] = useState(false);
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

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            // Call the Edge Function
            const { data, error } = await supabase.functions.invoke('create-user', {
                body: formData
            });

            if (error) throw error;
            if (!data.success) throw new Error(data.error || 'Něco se nepovedlo');

            showToast('Uživatel byl úspěšně vytvořen!', 'success');
            onClose();
        } catch (err) {
            console.error('Error creating user:', err);
            showToast(err.message || 'Nepodařilo se vytvořit uživatele', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-card animate-slide-up" style={{ maxWidth: '400px' }}>
                <div className="modal-header">
                    <h2>Správa uživatelů</h2>
                    <button className="btn-close" onClick={onClose}>&times;</button>
                </div>

                <form onSubmit={handleSubmit} className="modal-body login-form" style={{ padding: '1.5rem' }}>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                        Vytvořte nový účet pro hodnotitele nebo jiného ředitele.
                    </p>

                    <div className="input-group">
                        <label>E-mail</label>
                        <input
                            type="email"
                            className="input-field"
                            required
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            placeholder="priklad@email.cz"
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
                            placeholder="••••••••"
                            minLength={6}
                        />
                    </div>

                    <div className="input-group" style={{ marginTop: '1rem' }}>
                        <label>Role</label>
                        <select
                            className="select-field"
                            style={{ width: '100%', height: '44px', backgroundPosition: 'right 1rem center' }}
                            value={formData.role}
                            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                        >
                            {roles.map(r => (
                                <option key={r.id} value={r.id}>{r.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="modal-footer" style={{ marginTop: '2rem', padding: 0, border: 'none' }}>
                        <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={onClose}
                            disabled={loading}
                        >
                            Zrušit
                        </button>
                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={loading}
                        >
                            {loading ? 'Vytváření...' : 'Vytvořit uživatele'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
