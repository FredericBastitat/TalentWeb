import { createClient } from '@supabase/supabase-js';

let SUPABASE_URL = 'YOUR_SUPABASE_URL';
let SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';

async function loadConfig() {
    try {
        const config = await import('./config.js');
        if (config.SUPABASE_CONFIG) {
            SUPABASE_URL = config.SUPABASE_CONFIG.url;
            SUPABASE_ANON_KEY = config.SUPABASE_CONFIG.anonKey;
        }
    } catch (e) {
        const scriptTag = document.querySelector('script[data-supabase-url]');
        if (scriptTag) {
            SUPABASE_URL = scriptTag.dataset.supabaseUrl || SUPABASE_URL;
            SUPABASE_ANON_KEY = scriptTag.dataset.supabaseAnonKey || SUPABASE_ANON_KEY;
        } else {
            console.warn('Supabase credentials not found.');
        }
    }
}

let supabase;
await loadConfig();
supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// State management
let currentUser = null;
let currentYear = null;
let candidates = [];
let currentCandidateIndex = -1;
let currentCandidateId = null;

// DOM elements
const loginScreen = document.getElementById('login-screen');
const mainScreen = document.getElementById('main-screen');
const loginForm = document.getElementById('login-form');
const logoutBtn = document.getElementById('logout-btn');
const yearSelector = document.getElementById('year-selector');
const overviewScreen = document.getElementById('overview-screen');
const evaluationScreen = document.getElementById('evaluation-screen');
const backToOverviewBtn = document.getElementById('back-to-overview');
const addCandidateBtn = document.getElementById('add-candidate-btn');
const searchInput = document.getElementById('search-input');
const sortSelect = document.getElementById('sort-select');
const candidatesTbody = document.getElementById('candidates-tbody');
const prevCandidateBtn = document.getElementById('prev-candidate');
const nextCandidateBtn = document.getElementById('next-candidate');
const candidateCounter = document.getElementById('candidate-counter');
const candidateCodeDisplay = document.getElementById('candidate-code');
const candidateCodeInput = document.getElementById('candidate-code-input');
const saveEvaluationBtn = document.getElementById('save-evaluation');

// Initialize app
async function init() {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
        currentUser = session.user;
        showMainScreen();
        await loadYears();
    } else {
        showLoginScreen();
    }
    setupEventListeners();
}

function setupEventListeners() {
    loginForm.addEventListener('submit', handleLogin);
    logoutBtn.addEventListener('click', handleLogout);
    yearSelector.addEventListener('change', handleYearChange);
    backToOverviewBtn.addEventListener('click', showOverview);
    addCandidateBtn.addEventListener('click', handleManageCandidates);
    searchInput.addEventListener('input', filterCandidates);
    sortSelect.addEventListener('change', sortCandidates);
    prevCandidateBtn.addEventListener('click', () => navigateCandidate(-1));
    nextCandidateBtn.addEventListener('click', () => navigateCandidate(1));
    saveEvaluationBtn.addEventListener('click', saveEvaluation);

    document.querySelectorAll('.score-select').forEach(select => {
        select.addEventListener('change', handleScoreChange);
    });

    supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_OUT') {
            showLoginScreen();
        } else if (event === 'SIGNED_IN' && session) {
            currentUser = session.user;
            showMainScreen();
            loadYears();
        }
    });
}

// Auth functions
async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const errorDiv = document.getElementById('login-error');

    errorDiv.textContent = '';

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
        errorDiv.textContent = error.message;
        return;
    }

    currentUser = data.user;
    showMainScreen();
    await loadYears();
}

async function handleLogout() {
    await supabase.auth.signOut();
    currentUser = null;
    currentYear = null;
    candidates = [];
    showLoginScreen();
}

function showLoginScreen() {
    loginScreen.classList.remove('hidden');
    mainScreen.classList.add('hidden');
    loginForm.reset();
    document.getElementById('login-error').textContent = '';
}

function showMainScreen() {
    loginScreen.classList.add('hidden');
    mainScreen.classList.remove('hidden');
}

// Year management
async function loadYears() {
    const currentYearValue = new Date().getFullYear();
    const years = [];

    for (let year = 2020; year <= currentYearValue + 1; year++) {
        years.push(`${year}/${year + 1}`);
    }

    yearSelector.innerHTML = '<option value="">Vyberte školní rok</option>';
    years.reverse().forEach(year => {
        const option = document.createElement('option');
        option.value = year;
        option.textContent = year;
        yearSelector.appendChild(option);
    });

    const currentYearOption = `${currentYearValue}/${currentYearValue + 1}`;
    if (years.includes(currentYearOption)) {
        yearSelector.value = currentYearOption;
        await handleYearChange();
    }
}

async function handleYearChange() {
    const selectedYear = yearSelector.value;
    if (!selectedYear) {
        candidates = [];
        renderCandidatesTable();
        updateAddButton();
        return;
    }

    currentYear = selectedYear;
    await loadCandidates();
    showOverview();
    updateAddButton();

    // Nový ročník bez uchazečů – zeptej se hned
    if (candidates.length === 0) {
        await handleManageCandidates();
    }
}

function updateAddButton() {
    addCandidateBtn.textContent = candidates.length === 0
        ? 'Inicializovat ročník'
        : 'Upravit počet uchazečů';
}

// Candidate management
async function loadCandidates() {
    const { data, error } = await supabase
        .from('candidates')
        .select('*')
        .eq('school_year', currentYear)
        .order('code', { ascending: true });

    if (error) {
        console.error('Error loading candidates:', error);
        candidates = [];
    } else {
        candidates = data || [];
    }

    renderCandidatesTable();
    updateAddButton();
}

async function handleManageCandidates() {
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
        // Přidat chybějící uchazeče
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

} else if (newCount < currentCount) {
    if (!confirm(`Opravdu chcete smazat ${currentCount - newCount} uchazečů od konce? Tato akce je nevratná.`)) return;
    const sorted = [...candidates].sort((a, b) => (a.code || '').localeCompare(b.code || ''));
    const toDelete = sorted.slice(newCount).map(c => c.id);
    console.log('Mažu IDs:', toDelete);
    const { error } = await supabase.from('candidates').delete().in('id', toDelete);
    console.log('Error:', error);
    if (error) { alert('Chyba: ' + error.message); return; }
}

    await loadCandidates();
}

async function moveCandidate(index, direction) {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= candidates.length) return;

    const a = candidates[index];
    const b = candidates[targetIndex];

    // Dočasný kód aby nedošlo ke konfliktu unique constraint
    const tempCode = `TEMP_${Date.now()}`;

    const { error: e0 } = await supabase.from('candidates').update({ code: tempCode }).eq('id', a.id);
    if (e0) { alert('Chyba při přesunu'); return; }

    const { error: e1 } = await supabase.from('candidates').update({ code: a.code }).eq('id', b.id);
    if (e1) { alert('Chyba při přesunu'); return; }

    const { error: e2 } = await supabase.from('candidates').update({ code: b.code }).eq('id', a.id);
    if (e2) { alert('Chyba při přesunu'); return; }

    await loadCandidates();
}

function renderCandidatesTable() {
    candidatesTbody.innerHTML = '';

    if (candidates.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = '<td colspan="6" style="text-align: center; padding: 2rem;">Žádní uchazeči</td>';
        candidatesTbody.appendChild(row);
        return;
    }

    candidates.forEach((candidate, index) => {
        const row = document.createElement('tr');
        const portraitSum = calculateCategorySum(candidate, 'portrait');
        const fileSum = calculateCategorySum(candidate, 'file');
        const stillLifeSum = calculateCategorySum(candidate, 'still-life');
        const total = portraitSum + fileSum + stillLifeSum;

        row.innerHTML = `
            <td>${candidate.code || ''}</td>
            <td>${portraitSum}</td>
            <td>${fileSum}</td>
            <td>${stillLifeSum}</td>
            <td><strong>${total}</strong></td>
            <td>
                <a href="#" class="btn-link" data-index="${index}">Upravit</a>
                <a href="#" class="btn-link" style="margin-left: 0.5rem;" data-up="${index}">↑</a>
                <a href="#" class="btn-link" style="margin-left: 0.5rem;" data-down="${index}">↓</a>
            </td>
        `;

        row.querySelector('[data-index]').addEventListener('click', (e) => {
            e.preventDefault();
            openEvaluation(index);
        });

        row.querySelector('[data-up]')?.addEventListener('click', async (e) => {
            e.preventDefault();
            await moveCandidate(parseInt(e.target.dataset.up), -1);
        });

        row.querySelector('[data-down]')?.addEventListener('click', async (e) => {
            e.preventDefault();
            await moveCandidate(parseInt(e.target.dataset.down), 1);
        });

        candidatesTbody.appendChild(row);
    });
}

function calculateCategorySum(candidate, category) {
    if (!candidate.evaluation || !candidate.evaluation[category]) return 0;

    const categoryData = candidate.evaluation[category];
    let sum = 0;

    if (categoryData.formal === 0) return 0;

    Object.keys(categoryData).forEach(key => {
        if (key !== 'penalties' && typeof categoryData[key] === 'number') {
            sum += categoryData[key];
        }
    });

    return sum;
}

function filterCandidates() {
    const searchTerm = searchInput.value.toLowerCase();
    const rows = candidatesTbody.querySelectorAll('tr');

    rows.forEach(row => {
        const codeCell = row.querySelector('td');
        if (codeCell) {
            const code = codeCell.textContent.toLowerCase();
            row.style.display = code.includes(searchTerm) ? '' : 'none';
        }
    });
}

function sortCandidates() {
    const sortBy = sortSelect.value;

    candidates.sort((a, b) => {
        switch (sortBy) {
            case 'code':
                return (a.code || '').localeCompare(b.code || '');
            case 'total':
                const totalA = calculateCategorySum(a, 'portrait') + calculateCategorySum(a, 'file') + calculateCategorySum(a, 'still-life');
                const totalB = calculateCategorySum(b, 'portrait') + calculateCategorySum(b, 'file') + calculateCategorySum(b, 'still-life');
                return totalB - totalA;
            case 'portrait':
                return calculateCategorySum(b, 'portrait') - calculateCategorySum(a, 'portrait');
            case 'file':
                return calculateCategorySum(b, 'file') - calculateCategorySum(a, 'file');
            case 'still-life':
                return calculateCategorySum(b, 'still-life') - calculateCategorySum(a, 'still-life');
            default:
                return 0;
        }
    });

    renderCandidatesTable();
}

// Evaluation screen
function showOverview() {
    overviewScreen.classList.remove('hidden');
    evaluationScreen.classList.add('hidden');
}

function showEvaluation() {
    overviewScreen.classList.add('hidden');
    evaluationScreen.classList.remove('hidden');
}

function openEvaluation(index) {
    if (index < 0 || index >= candidates.length) return;

    currentCandidateIndex = index;
    currentCandidateId = candidates[index].id;
    loadCandidateEvaluation();
    showEvaluation();
    updateNavigationButtons();
}

function loadCandidateEvaluation() {
    const candidate = candidates[currentCandidateIndex];
    candidateCodeDisplay.textContent = candidate.code || '';
    candidateCounter.textContent = `${candidate.code || ''} / ${candidates.length}`;

    const evaluation = candidate.evaluation || {
        portrait: { formal: 0 },
        file: { formal: 0 },
        'still-life': { formal: 0 }
    };

    ['portrait', 'file', 'still-life'].forEach(category => {
        const categoryData = evaluation[category] || { formal: 0 };

        Object.keys(categoryData).forEach(key => {
            if (key !== 'penalties' && typeof categoryData[key] === 'number') {
                const select = document.querySelector(`.score-select[data-category="${category}"][data-criterion="${key}"]`);
                if (select) select.value = categoryData[key];
            }
        });

        if (categoryData.penalties) {
            Object.keys(categoryData.penalties).forEach(criterion => {
                const penalties = categoryData.penalties[criterion] || [];
                penalties.forEach(penalty => {
                    const checkbox = document.querySelector(
                        `.penalty-reasons[data-category="${category}"][data-criterion="${criterion}"] input[value="${penalty}"]`
                    );
                    if (checkbox) checkbox.checked = true;
                });
            });
        }
    });

    updateSums();
}

function navigateCandidate(direction) {
    const newIndex = currentCandidateIndex + direction;
    if (newIndex >= 0 && newIndex < candidates.length) {
        saveEvaluation(false).then(() => {
            openEvaluation(newIndex);
        });
    }
}

function updateNavigationButtons() {
    prevCandidateBtn.disabled = currentCandidateIndex <= 0;
    nextCandidateBtn.disabled = currentCandidateIndex >= candidates.length - 1;
}

function handleScoreChange() {
    updateSums();
}

function updateSums() {
    const portraitSum = calculateCurrentCategorySum('portrait');
    document.getElementById('portrait-sum').textContent = portraitSum;

    const fileSum = calculateCurrentCategorySum('file');
    document.getElementById('file-sum').textContent = fileSum;

    const stillLifeSum = calculateCurrentCategorySum('still-life');
    document.getElementById('still-life-sum').textContent = stillLifeSum;

    const total = portraitSum + fileSum + stillLifeSum;
    document.getElementById('total-sum').textContent = total;
}

function calculateCurrentCategorySum(category) {
    const formalSelect = document.querySelector(`.score-select[data-category="${category}"][data-criterion="formal"]`);
    if (!formalSelect || parseInt(formalSelect.value) === 0) return 0;

    let sum = 0;
    const selects = document.querySelectorAll(`.score-select[data-category="${category}"]`);
    selects.forEach(select => {
        sum += parseInt(select.value) || 0;
    });

    return sum;
}

async function saveEvaluation(showAlert = true) {
    if (!currentCandidateId) return;

    const evaluation = {
        portrait: collectCategoryData('portrait'),
        file: collectCategoryData('file'),
        'still-life': collectCategoryData('still-life')
    };

    const { error } = await supabase
        .from('candidates')
        .update({ evaluation })
        .eq('id', currentCandidateId);

    if (error) {
        alert('Chyba při ukládání: ' + error.message);
        return;
    }

    const candidate = candidates[currentCandidateIndex];
    candidate.evaluation = evaluation;


    if (!evaluationScreen.classList.contains('hidden')) {
        renderCandidatesTable();
    }
}

function collectCategoryData(category) {
    const data = {};
    const penalties = {};

    const selects = document.querySelectorAll(`.score-select[data-category="${category}"]`);
    selects.forEach(select => {
        const criterion = select.dataset.criterion;
        data[criterion] = parseInt(select.value) || 0;

        const penaltyContainer = document.querySelector(
            `.penalty-reasons[data-category="${category}"][data-criterion="${criterion}"]`
        );
        if (penaltyContainer) {
            const checked = Array.from(penaltyContainer.querySelectorAll('input:checked')).map(cb => cb.value);
            if (checked.length > 0) penalties[criterion] = checked;
        }
    });

    if (Object.keys(penalties).length > 0) data.penalties = penalties;

    return data;
}

document.getElementById('export-btn').addEventListener('click', exportToExcel);

function exportToExcel() {
    if (!currentYear || candidates.length === 0) {
        alert('Nejsou žádní uchazeči k exportu');
        return;
    }

    const penaltyCodes = {
        'wrong-count': 'A',
        'wrong-mounting': 'B',
        'wrong-format': 'C',
        'wrong-genre': 'D',
        'wrong-requirements': 'E',
        'uninteresting': 'F',
        'low-creativity': 'G',
        'inconsistent': 'H',
        'wrong-rules': 'A',
        'wrong-dof': 'B',
        'wrong-crop': 'C',
        'mergers': 'D',
        'distracting': 'E',
        'unsharp': 'A',
        'exposure': 'B',
        'white-balance': 'C',
        'resolution': 'D',
        'editing': 'E',
        'relevance': 'A'
    };

    const getCellValue = (candidate, category, criterion) => {
        const ev = candidate.evaluation?.[category];
        if (!ev) return '';
        const score = ev[criterion] ?? '';
        const penalties = ev.penalties?.[criterion] || [];
        const codes = penalties.map(p => penaltyCodes[p] || '?').join(',');
        return score !== '' ? `${score}${codes ? '\n' + codes : ''}` : '';
    };

    const wb = XLSX.utils.book_new();
    const ws = {};

    // Definice kategorií a kritérií
    const categories = [
        {
            name: 'PORTRÉT',
            key: 'portrait',
            criteria: [
                { key: 'formal', label: 'formální' },
                { key: 'genre', label: 'žánr/název' },
                { key: 'creativity', label: 'kreativita' },
                { key: 'composition', label: 'kompozice' },
                { key: 'technical', label: 'technicita' },
            ]
        },
        {
            name: 'SOUBOR',
            key: 'file',
            criteria: [
                { key: 'formal', label: 'formální' },
                { key: 'relevance', label: 'žánr/název' },
                { key: 'creativity', label: 'kreativita' },
                { key: 'composition', label: 'kompozice' },
                { key: 'technical', label: 'technicita' },
            ]
        },
        {
            name: 'ZÁTIŠÍ',
            key: 'still-life',
            criteria: [
                { key: 'formal', label: 'formální' },
                { key: 'genre', label: 'žánr/název' },
            ]
        }
    ];

    // Legenda zkratek
    const legendData = [
        ['ZKRATKY DŮVODŮ'],
        ['Formální pravidla:'],
        ['A = Jiný počet fotografií'],
        ['B = Nenalepené na podkladovém papíru'],
        ['C = Jiný formát nebo orientace'],
        [''],
        ['Žánr:'],
        ['D = Nedodržení žánru'],
        ['E = Nedodržení požadavků'],
        [''],
        ['Kreativita:'],
        ['F = Nezajímavý námět'],
        ['G = Malá míra kreativity'],
        ['H = Nekonzistentní soubor'],
        [''],
        ['Kompozice:'],
        ['A = Nedodržení kompozičních pravidel'],
        ['B = Nevhodné použití hloubky ostrosti'],
        ['C = Chybné ořezy'],
        ['D = Srostlice'],
        ['E = Rušivé prvky'],
        [''],
        ['Technická kvalita:'],
        ['A = Neostrá fotografie'],
        ['B = Nevhodná expozice'],
        ['C = Špatné vyvážení bílé'],
        ['D = Malé rozlišení nebo šum'],
        ['E = Nevhodná editace'],
    ];

    // Vypočítej sloupce
    let col = 1; // 1-indexed
    const colMap = []; // { category, criterion, colIndex }

    // První sloupec = Kód
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

    // Helper pro zápis buňky
    const setCell = (r, c, v, s) => {
        const addr = XLSX.utils.encode_cell({ r, c: c - 1 });
        ws[addr] = { v, t: typeof v === 'number' ? 'n' : 's' };
        if (s) ws[addr].s = s;
    };

    // Styly
    const headerStyle = { font: { bold: true }, fill: { fgColor: { rgb: 'FFFF00' } }, alignment: { horizontal: 'center', vertical: 'center', wrapText: true } };
    const catHeaderStyle = { font: { bold: true }, alignment: { horizontal: 'center' }, border: { bottom: { style: 'thin' } } };
    const sumaStyle = { font: { bold: true }, fill: { fgColor: { rgb: 'FFFF00' } }, alignment: { horizontal: 'center' } };
    const normalStyle = { alignment: { horizontal: 'center', vertical: 'top', wrapText: true } };

    // Řádek 0: názvy kategorií (merge přes kritéria)
    ws['!merges'] = [];

    let catStartCol = codeCol + 1;
    categories.forEach(cat => {
        const catCols = 1 + cat.criteria.length + 1; // vsude + kritéria + suma
        ws['!merges'].push({
            s: { r: 0, c: catStartCol - 1 },
            e: { r: 0, c: catStartCol + catCols - 2 }
        });
        setCell(1, catStartCol, cat.name, catHeaderStyle);
        catStartCol += catCols;
    });

    // Řádek 1: záhlaví sloupců
    setCell(2, codeCol, 'Kód', headerStyle);
    colMap.forEach(entry => {
        if (entry.type === 'vsude') setCell(2, entry.colIndex, 'všude\n0-1-2', headerStyle);
        else if (entry.type === 'criterion') setCell(2, entry.colIndex, entry.label, headerStyle);
        else if (entry.type === 'suma') setCell(2, entry.colIndex, 'SUMA', sumaStyle);
    });

    // Data řádky
    candidates.forEach((candidate, i) => {
        const row = i + 3;
        setCell(row, codeCol, candidate.code || '', normalStyle);

        colMap.forEach(entry => {
            if (entry.type === 'vsude') {
                // prázdné – uživatel vyplní ručně
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

    // Šířky sloupců
    const colWidths = [{ wch: 6 }]; // Kód
    colMap.forEach(entry => {
        if (entry.type === 'suma' || entry.type === 'vsude') colWidths.push({ wch: 8 });
        else colWidths.push({ wch: 10 });
    });
    ws['!cols'] = colWidths;

    // Výška řádků pro záhlaví
    ws['!rows'] = [{ hpt: 20 }, { hpt: 35 }];

    ws['!ref'] = XLSX.utils.encode_range({ r: 0, c: 0 }, { r: candidates.length + 2, c: totalCols - 1 });

    XLSX.utils.book_append_sheet(wb, ws, 'Hodnocení');

    // List s legendou
    const wsLegend = XLSX.utils.aoa_to_sheet(legendData);
    wsLegend['!cols'] = [{ wch: 50 }];
    XLSX.utils.book_append_sheet(wb, wsLegend, 'Legenda');

    XLSX.writeFile(wb, `TalentWeb_${currentYear.replace('/', '-')}.xlsx`);
}
// Initialize on load
init();