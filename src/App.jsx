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

    // Excel export – improved formatting with separate score/penalty columns
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

        const categories = [
            {
                name: 'PORTRÉT', key: 'portrait', color: '4472C4',
                criteria: [
                    { key: 'formal', label: 'Formální' },
                    { key: 'genre', label: 'Žánr' },
                    { key: 'creativity', label: 'Kreativita' },
                    { key: 'composition', label: 'Kompozice' },
                    { key: 'technical', label: 'Technika' },
                ]
            },
            {
                name: 'SOUBOR', key: 'file', color: '548235',
                criteria: [
                    { key: 'formal', label: 'Formální' },
                    { key: 'relevance', label: 'Souvislost' },
                    { key: 'creativity', label: 'Kreativita' },
                    { key: 'composition', label: 'Kompozice' },
                    { key: 'technical', label: 'Technika' },
                ]
            },
            {
                name: 'ZÁTIŠÍ', key: 'still-life', color: 'BF8F00',
                criteria: [
                    { key: 'formal', label: 'Formální' },
                    { key: 'genre', label: 'Žánr' },
                ]
            }
        ];

        const legendData = [
            ['ZKRATKY DŮVODŮ PENALIZACE'],
            [''],
            ['FORMÁLNÍ PRAVIDLA:'],
            ['  A = Jiný počet fotografií'],
            ['  B = Nenalepené na podkladovém papíru'],
            ['  C = Jiný formát nebo orientace'],
            [''],
            ['ŽÁNR:'],
            ['  D = Nedodržení žánru'],
            ['  E = Nedodržení požadavků'],
            [''],
            ['KREATIVITA:'],
            ['  F = Nezajímavý námět'],
            ['  G = Malá míra kreativity'],
            ['  H = Nekonzistentní soubor'],
            [''],
            ['KOMPOZICE:'],
            ['  A = Nedodržení kompozičních pravidel'],
            ['  B = Nevhodné použití hloubky ostrosti'],
            ['  C = Chybné ořezy'],
            ['  D = Srostlice'],
            ['  E = Rušivé prvky'],
            [''],
            ['TECHNICKÁ KVALITA:'],
            ['  A = Neostrá fotografie'],
            ['  B = Nevhodná expozice'],
            ['  C = Špatné vyvážení bílé'],
            ['  D = Malé rozlišení nebo šum'],
            ['  E = Nevhodná editace'],
        ];

        // --- Border helper ---
        const thinBorder = { style: 'thin', color: { rgb: 'B0B0B0' } };
        const borders = {
            top: thinBorder, bottom: thinBorder,
            left: thinBorder, right: thinBorder,
        };

        // --- Build column layout ---
        // Each criterion → 2 columns: "body" (score) + "chyby" (penalty letters)
        // Format: KÓD | [cat: body chyby body chyby ... | SUMA] | ... | CELKEM
        let colIdx = 0; // 0-indexed
        const colMap = [];
        const merges = [];

        const codeCol = colIdx++;

        categories.forEach(cat => {
            const catStartCol = colIdx;

            cat.criteria.forEach(cr => {
                colMap.push({ type: 'score', category: cat.key, criterion: cr.key, label: cr.label, col: colIdx, catColor: cat.color });
                colIdx++;
                colMap.push({ type: 'penalty', category: cat.key, criterion: cr.key, col: colIdx, catColor: cat.color });
                colIdx++;
            });

            colMap.push({ type: 'suma', category: cat.key, col: colIdx, catColor: cat.color });
            colIdx++;

            const catEndCol = colIdx - 1;

            // Merge for category header (row 0)
            merges.push({ s: { r: 0, c: catStartCol }, e: { r: 0, c: catEndCol } });
        });

        // CELKEM column
        const totalCol = colIdx;
        colIdx++;

        const totalColsCount = colIdx;

        // --- Helper to write cell ---
        const ws = {};
        const setCell = (r, c, v, s) => {
            const addr = XLSX.utils.encode_cell({ r, c });
            ws[addr] = { v, t: typeof v === 'number' ? 'n' : 's' };
            if (s) ws[addr].s = s;
        };

        // === ROW 0: Category headers ===
        // KÓD spans rows 0+1
        merges.push({ s: { r: 0, c: 0 }, e: { r: 1, c: 0 } });
        setCell(0, 0, 'Kód', {
            font: { bold: true, color: { rgb: 'FFFFFF' }, sz: 11 },
            fill: { fgColor: { rgb: '333333' } },
            alignment: { horizontal: 'center', vertical: 'center' },
            border: borders,
        });

        // CELKEM spans rows 0+1
        merges.push({ s: { r: 0, c: totalCol }, e: { r: 1, c: totalCol } });
        setCell(0, totalCol, 'CELKEM', {
            font: { bold: true, color: { rgb: 'FFFFFF' }, sz: 11 },
            fill: { fgColor: { rgb: '7030A0' } },
            alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
            border: borders,
        });

        categories.forEach(cat => {
            // Find first col of this category
            const firstEntry = colMap.find(e => e.category === cat.key);
            if (!firstEntry) return;
            setCell(0, firstEntry.col, cat.name, {
                font: { bold: true, color: { rgb: 'FFFFFF' }, sz: 12 },
                fill: { fgColor: { rgb: cat.color } },
                alignment: { horizontal: 'center', vertical: 'center' },
                border: borders,
            });
        });

        // === ROW 1: Sub-headers (criterion labels) ===
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
            } else if (entry.type === 'penalty') {
                setCell(1, entry.col, 'chyby', {
                    font: { italic: true, sz: 8, color: { rgb: 'FFFFFF' } },
                    fill: { fgColor: { rgb: lightColor } },
                    alignment: { horizontal: 'center', vertical: 'center' },
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

        // === DATA ROWS (starting at row 2) ===
        candidates.forEach((candidate, i) => {
            const row = i + 2;
            const isEven = i % 2 === 0;
            const rowBg = isEven ? 'F5F5F5' : 'FFFFFF';

            // Kód
            setCell(row, codeCol, candidate.code || '', {
                font: { bold: true, sz: 10 },
                fill: { fgColor: { rgb: rowBg } },
                alignment: { horizontal: 'center', vertical: 'center' },
                border: borders,
            });

            colMap.forEach(entry => {
                if (entry.type === 'score') {
                    const ev = candidate.evaluation?.[entry.category];
                    const score = ev?.[entry.criterion];
                    setCell(row, entry.col, score !== undefined ? score : '', {
                        font: { sz: 10 },
                        fill: { fgColor: { rgb: rowBg } },
                        alignment: { horizontal: 'center', vertical: 'center' },
                        border: borders,
                    });
                } else if (entry.type === 'penalty') {
                    const ev = candidate.evaluation?.[entry.category];
                    const penalties = ev?.penalties?.[entry.criterion] || [];
                    const codes = penalties.map(p => penaltyCodes[p] || '?').join(', ');
                    setCell(row, entry.col, codes, {
                        font: { sz: 9, color: { rgb: codes ? 'CC0000' : '999999' } },
                        fill: { fgColor: { rgb: rowBg } },
                        alignment: { horizontal: 'center', vertical: 'center' },
                        border: borders,
                    });
                } else if (entry.type === 'suma') {
                    const sum = calculateCategorySum(candidate, entry.category);
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

            // CELKEM
            const portraitSum = calculateCategorySum(candidate, 'portrait');
            const fileSum = calculateCategorySum(candidate, 'file');
            const slSum = calculateCategorySum(candidate, 'still-life');
            const grandTotal = portraitSum + fileSum + slSum;

            setCell(row, totalCol, grandTotal, {
                font: { bold: true, sz: 12, color: { rgb: 'FFFFFF' } },
                fill: { fgColor: { rgb: '7030A0' } },
                alignment: { horizontal: 'center', vertical: 'center' },
                border: borders,
            });
        });

        // === Column widths ===
        const colWidths = [{ wch: 7 }]; // Kód
        colMap.forEach(entry => {
            if (entry.type === 'score') colWidths.push({ wch: 10 });
            else if (entry.type === 'penalty') colWidths.push({ wch: 8 });
            else if (entry.type === 'suma') colWidths.push({ wch: 7 });
        });
        colWidths.push({ wch: 9 }); // CELKEM

        // === Row heights ===
        const rowHeights = [{ hpt: 28 }, { hpt: 24 }]; // header rows
        candidates.forEach(() => rowHeights.push({ hpt: 20 }));

        // === Finalize worksheet ===
        ws['!merges'] = merges;
        ws['!cols'] = colWidths;
        ws['!rows'] = rowHeights;
        ws['!ref'] = XLSX.utils.encode_range(
            { r: 0, c: 0 },
            { r: candidates.length + 1, c: totalColsCount - 1 }
        );

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Hodnocení');

        // === Legenda sheet ===
        const wsLegend = XLSX.utils.aoa_to_sheet(legendData);
        wsLegend['!cols'] = [{ wch: 55 }];
        XLSX.utils.book_append_sheet(wb, wsLegend, 'Legenda zkratek');

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
