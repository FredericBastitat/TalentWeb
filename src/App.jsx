import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from './supabaseClient';
import LoginScreen from './components/LoginScreen';
import AppHeader from './components/AppHeader';
import OverviewScreen from './components/OverviewScreen';
import EvaluationScreen from './components/EvaluationScreen';
import Toast from './components/Toast';

export default function App() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [currentYear, setCurrentYear] = useState('');
    const [candidates, setCandidates] = useState([]);
    const [currentView, setCurrentView] = useState('overview'); // 'overview' | 'evaluation'
    const [currentCandidateIndex, setCurrentCandidateIndex] = useState(-1);
    const [toast, setToast] = useState(null);

    // Toast helper
    const showToast = useCallback((message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    }, []);

    // Auth state
    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setUser(session?.user ?? null);
            setLoading(false);
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
        });

        return () => subscription.unsubscribe();
    }, []);

    // Load candidates when year changes
    useEffect(() => {
        if (currentYear && user) {
            loadCandidates();
        } else {
            setCandidates([]);
        }
    }, [currentYear, user]);

    // Auto-select current year on login
    useEffect(() => {
        if (user) {
            const now = new Date().getFullYear();
            setCurrentYear(`${now}/${now + 1}`);
        }
    }, [user]);

    const loadCandidates = async () => {
        const { data, error } = await supabase
            .from('candidates')
            .select('*')
            .eq('school_year', currentYear)
            .order('code', { ascending: true });

        if (error) {
            console.error('Error loading candidates:', error);
            setCandidates([]);
        } else {
            setCandidates(data || []);
        }
    };

    // Calculate category sum – same logic as original
    const calculateCategorySum = (candidate, category) => {
        if (!candidate.evaluation || !candidate.evaluation[category]) return 0;
        const categoryData = candidate.evaluation[category];
        if (categoryData.formal === 0) return 0;
        let sum = 0;
        Object.keys(categoryData).forEach(key => {
            if (key !== 'penalties' && typeof categoryData[key] === 'number') {
                sum += categoryData[key];
            }
        });
        return sum;
    };

    const handleLogin = async (email, password) => {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) return error.message;
        setUser(data.user);
        return null;
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        setUser(null);
        setCurrentYear('');
        setCandidates([]);
        setCurrentView('overview');
    };

    const handleManageCandidates = async () => {
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
                evaluation: {
                    portrait: { formal: 0 },
                    file: { formal: 0 },
                    'still-life': { formal: 0 }
                }
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

        await loadCandidates();
    };

    const moveCandidate = async (index, direction) => {
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

        await loadCandidates();
    };

    const saveEvaluation = async (evaluation, candidateId, showAlert = true) => {
        const { error } = await supabase
            .from('candidates')
            .update({ evaluation })
            .eq('id', candidateId);

        if (error) {
            showToast('Chyba při ukládání: ' + error.message, 'error');
            return false;
        }

        // Update local state
        setCandidates(prev => prev.map(c =>
            c.id === candidateId ? { ...c, evaluation } : c
        ));

        if (showAlert) {
            showToast('Hodnocení uloženo ✓');
        }
        return true;
    };

    const openEvaluation = (index) => {
        setCurrentCandidateIndex(index);
        setCurrentView('evaluation');
    };

    const navigateCandidate = (direction) => {
        const newIndex = currentCandidateIndex + direction;
        if (newIndex >= 0 && newIndex < candidates.length) {
            setCurrentCandidateIndex(newIndex);
        }
    };

    // Excel export – same logic as original
    const exportToExcel = () => {
        if (!currentYear || candidates.length === 0) {
            alert('Nejsou žádní uchazeči k exportu');
            return;
        }

        const penaltyCodes = {
            'wrong-count': 'A', 'wrong-mounting': 'B', 'wrong-format': 'C',
            'wrong-genre': 'D', 'wrong-requirements': 'E',
            'uninteresting': 'F', 'low-creativity': 'G', 'inconsistent': 'H',
            'wrong-rules': 'A', 'wrong-dof': 'B', 'wrong-crop': 'C',
            'mergers': 'D', 'distracting': 'E',
            'unsharp': 'A', 'exposure': 'B', 'white-balance': 'C',
            'resolution': 'D', 'editing': 'E', 'relevance': 'A'
        };

        const wb = XLSX.utils.book_new();
        const ws = {};

        const categories = [
            {
                name: 'PORTRÉT', key: 'portrait',
                criteria: [
                    { key: 'formal', label: 'formální' },
                    { key: 'genre', label: 'žánr/název' },
                    { key: 'creativity', label: 'kreativita' },
                    { key: 'composition', label: 'kompozice' },
                    { key: 'technical', label: 'technicita' },
                ]
            },
            {
                name: 'SOUBOR', key: 'file',
                criteria: [
                    { key: 'formal', label: 'formální' },
                    { key: 'relevance', label: 'žánr/název' },
                    { key: 'creativity', label: 'kreativita' },
                    { key: 'composition', label: 'kompozice' },
                    { key: 'technical', label: 'technicita' },
                ]
            },
            {
                name: 'ZÁTIŠÍ', key: 'still-life',
                criteria: [
                    { key: 'formal', label: 'formální' },
                    { key: 'genre', label: 'žánr/název' },
                ]
            }
        ];

        const legendData = [
            ['ZKRATKY DŮVODŮ'], ['Formální pravidla:'],
            ['A = Jiný počet fotografií'], ['B = Nenalepené na podkladovém papíru'],
            ['C = Jiný formát nebo orientace'], [''],
            ['Žánr:'], ['D = Nedodržení žánru'], ['E = Nedodržení požadavků'], [''],
            ['Kreativita:'], ['F = Nezajímavý námět'], ['G = Malá míra kreativity'],
            ['H = Nekonzistentní soubor'], [''],
            ['Kompozice:'], ['A = Nedodržení kompozičních pravidel'],
            ['B = Nevhodné použití hloubky ostrosti'], ['C = Chybné ořezy'],
            ['D = Srostlice'], ['E = Rušivé prvky'], [''],
            ['Technická kvalita:'], ['A = Neostrá fotografie'],
            ['B = Nevhodná expozice'], ['C = Špatné vyvážení bílé'],
            ['D = Malé rozlišení nebo šum'], ['E = Nevhodná editace'],
        ];

        let col = 1;
        const colMap = [];
        const codeCol = col++;

        categories.forEach(cat => {
            const vsudCol = col++;
            colMap.push({ type: 'vsude', category: cat.key, colIndex: vsudCol });
            cat.criteria.forEach(cr => {
                colMap.push({ type: 'criterion', category: cat.key, criterion: cr.key, label: cr.label, colIndex: col });
                col++;
            });
            colMap.push({ type: 'suma', category: cat.key, colIndex: col });
            col++;
        });

        const totalCols = col - 1;

        const setCell = (r, c, v, s) => {
            const addr = XLSX.utils.encode_cell({ r, c: c - 1 });
            ws[addr] = { v, t: typeof v === 'number' ? 'n' : 's' };
            if (s) ws[addr].s = s;
        };

        const headerStyle = { font: { bold: true }, fill: { fgColor: { rgb: 'FFFF00' } }, alignment: { horizontal: 'center', vertical: 'center', wrapText: true } };
        const catHeaderStyle = { font: { bold: true }, alignment: { horizontal: 'center' }, border: { bottom: { style: 'thin' } } };
        const sumaStyle = { font: { bold: true }, fill: { fgColor: { rgb: 'FFFF00' } }, alignment: { horizontal: 'center' } };
        const normalStyle = { alignment: { horizontal: 'center', vertical: 'top', wrapText: true } };

        ws['!merges'] = [];

        let catStartCol = codeCol + 1;
        categories.forEach(cat => {
            const catCols = 1 + cat.criteria.length + 1;
            ws['!merges'].push({
                s: { r: 0, c: catStartCol - 1 },
                e: { r: 0, c: catStartCol + catCols - 2 }
            });
            setCell(1, catStartCol, cat.name, catHeaderStyle);
            catStartCol += catCols;
        });

        setCell(2, codeCol, 'Kód', headerStyle);
        colMap.forEach(entry => {
            if (entry.type === 'vsude') setCell(2, entry.colIndex, 'všude\n0-1-2', headerStyle);
            else if (entry.type === 'criterion') setCell(2, entry.colIndex, entry.label, headerStyle);
            else if (entry.type === 'suma') setCell(2, entry.colIndex, 'SUMA', sumaStyle);
        });

        candidates.forEach((candidate, i) => {
            const row = i + 3;
            setCell(row, codeCol, candidate.code || '', normalStyle);

            colMap.forEach(entry => {
                if (entry.type === 'vsude') {
                    setCell(row, entry.colIndex, '', normalStyle);
                } else if (entry.type === 'criterion') {
                    const ev = candidate.evaluation?.[entry.category];
                    const score = ev?.[entry.criterion];
                    const penalties = ev?.penalties?.[entry.criterion] || [];
                    const codes = penalties.map(p => penaltyCodes[p] || '?').join(',');
                    const val = score !== undefined ? `${score}${codes ? ' ' + codes : ''}` : '';
                    setCell(row, entry.colIndex, val, normalStyle);
                } else if (entry.type === 'suma') {
                    const sum = calculateCategorySum(candidate, entry.category);
                    setCell(row, entry.colIndex, sum, sumaStyle);
                }
            });
        });

        const colWidths = [{ wch: 6 }];
        colMap.forEach(entry => {
            if (entry.type === 'suma' || entry.type === 'vsude') colWidths.push({ wch: 8 });
            else colWidths.push({ wch: 10 });
        });
        ws['!cols'] = colWidths;
        ws['!rows'] = [{ hpt: 20 }, { hpt: 35 }];
        ws['!ref'] = XLSX.utils.encode_range({ r: 0, c: 0 }, { r: candidates.length + 2, c: totalCols - 1 });

        XLSX.utils.book_append_sheet(wb, ws, 'Hodnocení');

        const wsLegend = XLSX.utils.aoa_to_sheet(legendData);
        wsLegend['!cols'] = [{ wch: 50 }];
        XLSX.utils.book_append_sheet(wb, wsLegend, 'Legenda');

        XLSX.writeFile(wb, `TalentWeb_${currentYear.replace('/', '-')}.xlsx`);
        showToast('Excel exportován ✓');
    };

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

    return (
        <>
            <AppHeader
                currentYear={currentYear}
                onYearChange={setCurrentYear}
                onLogout={handleLogout}
            />
            <div className="content-wrapper">
                {currentView === 'overview' ? (
                    <OverviewScreen
                        candidates={candidates}
                        calculateCategorySum={calculateCategorySum}
                        onOpenEvaluation={openEvaluation}
                        onMoveCandidate={moveCandidate}
                        onManageCandidates={handleManageCandidates}
                        onExport={exportToExcel}
                    />
                ) : (
                    <EvaluationScreen
                        candidates={candidates}
                        currentIndex={currentCandidateIndex}
                        onBack={() => { setCurrentView('overview'); }}
                        onNavigate={navigateCandidate}
                        onSave={saveEvaluation}
                        calculateCategorySum={calculateCategorySum}
                    />
                )}
            </div>
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </>
    );
}
