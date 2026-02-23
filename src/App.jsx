import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from './supabaseClient';
import {
    CATEGORIES,
    EVALUATOR_META,
    DEFAULT_EVALUATION,
    PENALTY_CODES,
    calculateCategorySum,
    calculateTotalSum,
} from './constants';
import LoginScreen from './components/LoginScreen';
import { getRoleFromMetadata } from './utils/roleUtils';
import AppHeader from './components/AppHeader';
import OverviewScreen from './components/OverviewScreen';
import EvaluationScreen from './components/EvaluationScreen';
import DirectorDetailView from './components/DirectorDetailView';
import PenaltiesModal from './components/PenaltiesModal';
import UserManagementModal from './components/UserManagementModal';
import Toast from './components/Toast';

export default function App() {
    const [user, setUser] = useState(null);
    const [role, setRole] = useState(null);
    const [loading, setLoading] = useState(true);
    const [currentYear, setCurrentYear] = useState('');
    const [candidates, setCandidates] = useState([]);
    const [evaluationsMap, setEvaluationsMap] = useState({});
    const [currentView, setCurrentView] = useState('overview');
    const [currentCandidateIndex, setCurrentCandidateIndex] = useState(0);
    const [activeModalCandidate, setActiveModalCandidate] = useState(null);
    const [isUserManagementOpen, setIsUserManagementOpen] = useState(false);
    const [toast, setToast] = useState(null);

    const isDirector = role === 'director';
    const evaluatorId = !isDirector && role ? parseInt(role.split('-')[1]) : null;

    const showToast = useCallback((message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    }, []);

    // ── Auth state ───────────────────────────────────────────────
    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            const u = session?.user ?? null;
            console.log("Supabase Session User:", u);
            setUser(u);
            setRole(getRoleFromMetadata(u));
            setLoading(false);
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            const u = session?.user ?? null;
            setUser(u);
            setRole(getRoleFromMetadata(u));
        });

        return () => subscription.unsubscribe();
    }, []);

    // Auto-select current year on login
    useEffect(() => {
        if (user && role) {
            const now = new Date().getFullYear();
            setCurrentYear(`${now}/${now + 1}`);
        }
    }, [user, role]);

    // Load data when year or role changes
    useEffect(() => {
        if (currentYear && user && role) {
            loadData();
        } else {
            setCandidates([]);
            setEvaluationsMap({});
        }
    }, [currentYear, user, role]);

    // ── Data loading ─────────────────────────────────────────────
    const loadData = async () => {
        // 1. Load candidates
        const { data: candidatesData, error: candError } = await supabase
            .from('candidates')
            .select('id, code, school_year, created_at')
            .eq('school_year', currentYear)
            .order('code', { ascending: true });

        if (candError) {
            console.error('Error loading candidates:', candError);
            setCandidates([]);
            setEvaluationsMap({});
            return;
        }

        setCandidates(candidatesData || []);

        // 2. Load evaluations
        const candidateIds = (candidatesData || []).map(c => c.id);
        if (candidateIds.length === 0) {
            setEvaluationsMap({});
            return;
        }

        let query = supabase
            .from('evaluations')
            .select('*')
            .in('candidate_id', candidateIds);

        // For evaluators, load only their own
        if (!isDirector && evaluatorId) {
            query = query.eq('evaluator_id', evaluatorId);
        }

        const { data: evalsData, error: evalError } = await query;
        if (evalError) {
            console.error('Error loading evaluations:', evalError);
            setEvaluationsMap({});
            return;
        }

        const map = {};
        (evalsData || []).forEach(e => {
            if (!map[e.candidate_id]) map[e.candidate_id] = {};
            map[e.candidate_id][e.evaluator_id] = e.evaluation;
        });

        setEvaluationsMap(map);
    };

    // ── Auth handlers ────────────────────────────────────────────
    const handleLogin = async (email, password) => {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) return error.message;
        const u = data.user;
        const userRole = getRoleFromMetadata(u);
        console.log("Login Success - User Role:", userRole);
        setUser(u);
        setRole(userRole);
        return null;
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        setUser(null);
        setRole(null);
        setCurrentYear('');
        setCandidates([]);
        setEvaluationsMap({});
        setCurrentView('overview');
    };

    // ── Candidate management (evaluators only) ──────────────────
    const handleManageCandidates = async () => {
        if (isDirector) return;
        if (!currentYear) {
            alert('Nejprve vyberte školní rok');
            return;
        }

        const currentCount = candidates.length;
        const promptText = currentCount === 0
            ? 'Zadejte počet uchazečů pro tento ročník:'
            : `Aktuální počet uchazečů: ${currentCount}\nZadejte nový počet:`;

        const countStr = prompt(promptText);
        if (!countStr) return;
        const newCount = parseInt(countStr);
        if (isNaN(newCount) || newCount < 1) {
            alert('Neplatný počet');
            return;
        }

        if (newCount > currentCount) {
            const newCandidates = Array.from({ length: newCount - currentCount }, (_, i) => ({
                code: `F${String(currentCount + i + 1).padStart(3, '0')}`,
                school_year: currentYear,
            }));

            const { error } = await supabase.from('candidates').insert(newCandidates);
            if (error) { alert('Chyba: ' + error.message); return; }
            showToast(`Přidáno ${newCount - currentCount} uchazečů`);
        } else if (newCount < currentCount) {
            if (!confirm(`Opravdu chcete smazat ${currentCount - newCount} uchazečů od konce? Tato akce je nevratná.`)) return;
            const sorted = [...candidates].sort((a, b) => (a.code || '').localeCompare(b.code || ''));
            const toDelete = sorted.slice(newCount).map(c => c.id);
            const { error } = await supabase.from('candidates').delete().in('id', toDelete);
            if (error) { alert('Chyba: ' + error.message); return; }
            showToast(`Smazáno ${currentCount - newCount} uchazečů`);
        }

        await loadData();
    };

    const moveCandidate = async (index, direction) => {
        if (isDirector) return;
        const targetIndex = index + direction;
        if (targetIndex < 0 || targetIndex >= candidates.length) return;

        const a = candidates[index];
        const b = candidates[targetIndex];
        const tempCode = `TEMP_${Date.now()}`;

        const { error: e0 } = await supabase.from('candidates').update({ code: tempCode }).eq('id', a.id);
        if (e0) { alert('Chyba při přesunu'); return; }

        const { error: e1 } = await supabase.from('candidates').update({ code: a.code }).eq('id', b.id);
        if (e1) { alert('Chyba při přesunu'); return; }

        const { error: e2 } = await supabase.from('candidates').update({ code: b.code }).eq('id', a.id);
        if (e2) { alert('Chyba při přesunu'); return; }

        await loadData();
    };

    // ── Save evaluation (evaluators only) ────────────────────────
    const saveEvaluation = async (evaluation, candidateId, showAlert = true) => {
        if (isDirector || !evaluatorId) return false;

        const { error } = await supabase
            .from('evaluations')
            .upsert(
                {
                    candidate_id: candidateId,
                    evaluator_id: evaluatorId,
                    evaluation,
                },
                { onConflict: 'candidate_id,evaluator_id' }
            );

        if (error) {
            showToast('Chyba při ukládání: ' + error.message, 'error');
            return false;
        }

        setEvaluationsMap(prev => ({
            ...prev,
            [candidateId]: {
                ...(prev[candidateId] || {}),
                [evaluatorId]: evaluation,
            },
        }));

        if (showAlert) showToast('Hodnocení uloženo ✓');
        return true;
    };

    // ── Navigation ───────────────────────────────────────────────
    const openEvaluation = (index) => {
        setCurrentCandidateIndex(index);
        setCurrentView(isDirector ? 'director-detail' : 'evaluation');
    };

    const navigateCandidate = (direction) => {
        const newIndex = currentCandidateIndex + direction;
        if (newIndex >= 0 && newIndex < candidates.length) {
            setCurrentCandidateIndex(newIndex);
        }
    };

    const handleOpenPenalties = (candidate) => {
        setActiveModalCandidate(candidate);
    };

    // ── Excel export ─────────────────────────────────────────────
    const exportToExcel = () => {
        if (!currentYear || candidates.length === 0) {
            alert('Nejsou žádní uchazeči k exportu');
            return;
        }

        const wb = XLSX.utils.book_new();

        if (isDirector) {
            // Director export: summary + detail sheets per evaluator
            exportDirectorSummary(wb);
            [1, 2, 3].forEach(eid => {
                exportEvaluatorSheet(wb, eid, EVALUATOR_META[eid].name);
            });
        }

        const suffix = isDirector ? 'všichni' : EVALUATOR_META[evaluatorId].shortName;
        XLSX.writeFile(wb, `TalentWeb_${currentYear.replace('/', '-')}_${suffix}.xlsx`);
        showToast('Excel exportován ✓');
    };

    const exportDirectorSummary = (wb) => {
        const headers = ['Kód', 'Portrét', 'Soubor', 'Zátiší'];
        const rows = candidates.map(c => {
            const evals = evaluationsMap[c.id] || {};
            const pSum = [1, 2, 3].reduce((acc, eid) => acc + calculateCategorySum(evals[eid], 'portrait'), 0);
            const fSum = [1, 2, 3].reduce((acc, eid) => acc + calculateCategorySum(evals[eid], 'file'), 0);
            const sSum = [1, 2, 3].reduce((acc, eid) => acc + calculateCategorySum(evals[eid], 'still-life'), 0);
            return [c.code, pSum, fSum, sSum];
        });
        const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
        ws['!cols'] = [{ wch: 8 }, { wch: 10 }, { wch: 10 }, { wch: 10 }];
        XLSX.utils.book_append_sheet(wb, ws, 'Souhrn');
    };

    const exportEvaluatorSheet = (wb, eid, sheetName) => {
        const thinBorder = { style: 'thin', color: { rgb: 'B0B0B0' } };
        const borders = {
            top: thinBorder, bottom: thinBorder,
            left: thinBorder, right: thinBorder,
        };

        const excelCategories = [
            {
                name: 'PORTRÉT', key: 'portrait', color: '4472C4',
                criteria: [
                    { key: 'formal', label: 'Formální' },
                    { key: 'genre', label: 'Žánr' },
                    { key: 'creativity', label: 'Kreativita' },
                    { key: 'composition', label: 'Kompozice' },
                    { key: 'technical', label: 'Technika' },
                ],
            },
            {
                name: 'SOUBOR', key: 'file', color: '548235',
                criteria: [
                    { key: 'formal', label: 'Formální' },
                    { key: 'relevance', label: 'Souvislost' },
                    { key: 'creativity', label: 'Kreativita' },
                    { key: 'composition', label: 'Kompozice' },
                    { key: 'technical', label: 'Technika' },
                ],
            },
            {
                name: 'ZÁTIŠÍ', key: 'still-life', color: 'BF8F00',
                criteria: [
                    { key: 'formal', label: 'Formální' },
                    { key: 'genre', label: 'Žánr' },
                ],
            },
        ];

        let colIdx = 0;
        const colMap = [];
        const merges = [];
        const codeCol = colIdx++;

        excelCategories.forEach(cat => {
            const catStartCol = colIdx;
            cat.criteria.forEach(cr => {
                colMap.push({ type: 'score', category: cat.key, criterion: cr.key, label: cr.label, col: colIdx, catColor: cat.color });
                colIdx++;
            });
            colMap.push({ type: 'suma', category: cat.key, col: colIdx, catColor: cat.color });
            colIdx++;
            const catEndCol = colIdx - 1;
            merges.push({ s: { r: 0, c: catStartCol }, e: { r: 0, c: catEndCol } });
        });

        const totalColsCount = colIdx;

        const ws = {};
        const setCell = (r, c, v, s) => {
            const addr = XLSX.utils.encode_cell({ r, c });
            ws[addr] = { v, t: typeof v === 'number' ? 'n' : 's' };
            if (s) ws[addr].s = s;
        };

        // Row 0: category headers
        merges.push({ s: { r: 0, c: 0 }, e: { r: 1, c: 0 } });
        setCell(0, 0, 'Kód', {
            font: { bold: true, color: { rgb: 'FFFFFF' }, sz: 11 },
            fill: { fgColor: { rgb: '333333' } },
            alignment: { horizontal: 'center', vertical: 'center' },
            border: borders,
        });



        excelCategories.forEach(cat => {
            const firstEntry = colMap.find(e => e.category === cat.key);
            if (!firstEntry) return;
            setCell(0, firstEntry.col, cat.name, {
                font: { bold: true, color: { rgb: 'FFFFFF' }, sz: 12 },
                fill: { fgColor: { rgb: cat.color } },
                alignment: { horizontal: 'center', vertical: 'center' },
                border: borders,
            });
        });

        // Row 1: sub-headers
        colMap.forEach(entry => {
            const lightColor = entry.catColor.replace(/(.{2})(.{2})(.{2})/, (_, r, g, b) => {
                const lighten = (hex) => Math.min(255, parseInt(hex, 16) + 80).toString(16).padStart(2, '0');
                return lighten(r) + lighten(g) + lighten(b);
            }).toUpperCase();

            if (entry.type === 'score') {
                setCell(1, entry.col, entry.label, {
                    font: { bold: true, sz: 9, color: { rgb: 'FFFFFF' } },
                    fill: { fgColor: { rgb: entry.catColor } },
                    alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
                    border: borders,
                });
            } else if (entry.type === 'suma') {
                setCell(1, entry.col, 'SUMA', {
                    font: { bold: true, sz: 10, color: { rgb: 'FFFFFF' } },
                    fill: { fgColor: { rgb: entry.catColor } },
                    alignment: { horizontal: 'center', vertical: 'center' },
                    border: borders,
                });
            }
        });

        // Data rows
        candidates.forEach((candidate, i) => {
            const row = i + 2;
            const isEven = i % 2 === 0;
            const rowBg = isEven ? 'F5F5F5' : 'FFFFFF';
            const ev = evaluationsMap[candidate.id]?.[eid] || null;

            setCell(row, codeCol, candidate.code || '', {
                font: { bold: true, sz: 10 },
                fill: { fgColor: { rgb: rowBg } },
                alignment: { horizontal: 'center', vertical: 'center' },
                border: borders,
            });

            colMap.forEach(entry => {
                if (entry.type === 'score') {
                    const score = ev?.[entry.category]?.[entry.criterion];
                    setCell(row, entry.col, score !== undefined ? score : '', {
                        font: { sz: 10 },
                        fill: { fgColor: { rgb: rowBg } },
                        alignment: { horizontal: 'center', vertical: 'center' },
                        border: borders,
                    });
                } else if (entry.type === 'suma') {
                    const sum = calculateCategorySum(ev, entry.category);
                    const lightCatBg = entry.catColor.replace(/(.{2})(.{2})(.{2})/, (_, r, g, b) => {
                        const lighten = (hex) => Math.min(255, parseInt(hex, 16) + 140).toString(16).padStart(2, '0');
                        return lighten(r) + lighten(g) + lighten(b);
                    }).toUpperCase();
                    setCell(row, entry.col, sum, {
                        font: { bold: true, sz: 11 },
                        fill: { fgColor: { rgb: lightCatBg } },
                        alignment: { horizontal: 'center', vertical: 'center' },
                        border: borders,
                    });
                }
            });
        });

        // Column widths & row heights
        const colWidths = [{ wch: 7 }];
        colMap.forEach(entry => {
            if (entry.type === 'score') colWidths.push({ wch: 10 });
            else if (entry.type === 'penalty') colWidths.push({ wch: 8 });
            else if (entry.type === 'suma') colWidths.push({ wch: 7 });
        });


        const rowHeights = [{ hpt: 28 }, { hpt: 24 }];
        candidates.forEach(() => rowHeights.push({ hpt: 20 }));

        ws['!merges'] = merges;
        ws['!cols'] = colWidths;
        ws['!rows'] = rowHeights;
        ws['!ref'] = XLSX.utils.encode_range(
            { r: 0, c: 0 },
            { r: candidates.length + 1, c: totalColsCount - 1 }
        );

        XLSX.utils.book_append_sheet(wb, ws, sheetName);
    };

    // ── Render ───────────────────────────────────────────────────
    if (loading) {
        return (
            <div className="login-screen">
                <div style={{ color: 'var(--text-secondary)', fontSize: '1rem' }}>
                    Načítání...
                </div>
            </div>
        );
    }

    if (!user) {
        return <LoginScreen onLogin={handleLogin} />;
    }

    if (!role) {
        return (
            <div className="login-screen">
                <div className="login-card" style={{ textAlign: 'center' }}>
                    <div className="login-logo">
                        <div className="login-logo-icon">📷</div>
                        <h1>TalentWeb</h1>
                    </div>
                    <div style={{ marginBottom: '1.5rem' }}>
                        <p style={{ fontSize: '1.2rem', marginBottom: '0.75rem', color: 'var(--warning)' }}>⚠️ Role nebyla přiřazena</p>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '1rem' }}>
                            Váš účet (<b>{user?.email}</b>) nemá v Supabase nastavenou roli.<br />
                        </p>

                        <div style={{ textAlign: 'left', background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '8px', fontSize: '0.75rem', fontFamily: 'monospace' }}>
                            <p style={{ color: 'var(--text-muted)', marginBottom: '0.5rem' }}>// Diagnostika dat z Supabase:</p>
                            <pre style={{ color: '#aaa', whiteSpace: 'pre-wrap' }}>
                                {JSON.stringify({
                                    app_metadata: user?.app_metadata,
                                    user_metadata: user?.user_metadata
                                }, null, 2)}
                            </pre>
                        </div>

                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '1rem' }}>
                            Nastavte v Dashboardu roli jako:<br />
                            <code>"role": "evaluator-1"</code> (nebo 2, 3, director)
                        </p>
                    </div>
                    <button className="btn btn-secondary" onClick={handleLogout}>
                        Odhlásit se
                    </button>
                </div>
            </div>
        );
    }

    return (
        <>
            <AppHeader
                currentYear={currentYear}
                onYearChange={setCurrentYear}
                onLogout={handleLogout}
                role={role}
            />
            <div className="content-wrapper">
                {currentView === 'overview' ? (
                    <OverviewScreen
                        candidates={candidates}
                        evaluationsMap={evaluationsMap}
                        role={role}
                        evaluatorId={evaluatorId}
                        isDirector={isDirector}
                        onOpenEvaluation={openEvaluation}
                        onMoveCandidate={moveCandidate}
                        onManageCandidates={handleManageCandidates}
                        onExport={exportToExcel}
                        onOpenPenalties={handleOpenPenalties}
                        onOpenUserManagement={() => setIsUserManagementOpen(true)}
                    />
                ) : isDirector ? (
                    <DirectorDetailView
                        candidates={candidates}
                        currentIndex={currentCandidateIndex}
                        evaluationsMap={evaluationsMap}
                        onBack={() => setCurrentView('overview')}
                        onNavigate={navigateCandidate}
                    />
                ) : (
                    <EvaluationScreen
                        candidates={candidates}
                        currentIndex={currentCandidateIndex}
                        evaluationsMap={evaluationsMap}
                        evaluatorId={evaluatorId}
                        onBack={() => setCurrentView('overview')}
                        onNavigate={navigateCandidate}
                        onSave={saveEvaluation}
                    />
                )}
            </div>
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

            {activeModalCandidate && (
                <PenaltiesModal
                    candidate={activeModalCandidate}
                    evaluationsMap={evaluationsMap}
                    onClose={() => setActiveModalCandidate(null)}
                />
            )}

            {isUserManagementOpen && (
                <UserManagementModal
                    onClose={() => setIsUserManagementOpen(false)}
                    showToast={showToast}
                />
            )}
        </>
    );
}
