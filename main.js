import { createClient } from '@supabase/supabase-js';

// Supabase configuration
// Option 1: Set directly here (replace YOUR_SUPABASE_URL and YOUR_SUPABASE_ANON_KEY)
// Option 2: Create config.js file (see config.example.js)
// Option 3: Use environment variables (for build-time replacement)

let SUPABASE_URL = 'YOUR_SUPABASE_URL';
let SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';

// Try to load from config.js if available (async)
async function loadConfig() {
    try {
        const config = await import('./config.js');
        if (config.SUPABASE_CONFIG) {
            SUPABASE_URL = config.SUPABASE_CONFIG.url;
            SUPABASE_ANON_KEY = config.SUPABASE_CONFIG.anonKey;
        }
    } catch (e) {
        // config.js not found, check if values are set in HTML
        const scriptTag = document.querySelector('script[data-supabase-url]');
        if (scriptTag) {
            SUPABASE_URL = scriptTag.dataset.supabaseUrl || SUPABASE_URL;
            SUPABASE_ANON_KEY = scriptTag.dataset.supabaseAnonKey || SUPABASE_ANON_KEY;
        } else {
            console.warn('Supabase credentials not found. Please set SUPABASE_URL and SUPABASE_ANON_KEY in main.js or create config.js');
        }
    }
}

// Initialize Supabase client
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
    // Check if user is already logged in
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
        currentUser = session.user;
        showMainScreen();
        await loadYears();
    } else {
        showLoginScreen();
    }

    // Setup event listeners
    setupEventListeners();
}

function setupEventListeners() {
    loginForm.addEventListener('submit', handleLogin);
    logoutBtn.addEventListener('click', handleLogout);
    yearSelector.addEventListener('change', handleYearChange);
    backToOverviewBtn.addEventListener('click', showOverview);
    addCandidateBtn.addEventListener('click', handleAddCandidate);
    searchInput.addEventListener('input', filterCandidates);
    sortSelect.addEventListener('change', sortCandidates);
    prevCandidateBtn.addEventListener('click', () => navigateCandidate(-1));
    nextCandidateBtn.addEventListener('click', () => navigateCandidate(1));
    saveEvaluationBtn.addEventListener('click', saveEvaluation);

    // Score selectors - update sums automatically
    document.querySelectorAll('.score-select').forEach(select => {
        select.addEventListener('change', handleScoreChange);
    });

    // Listen for auth state changes
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

    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
    });

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
    
    // Generate years from 2020 to current year + 1
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

    // Try to select current year
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
        return;
    }

    currentYear = selectedYear;
    await loadCandidates();
    showOverview();
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
            <td><a href="#" class="btn-link" data-index="${index}">Upravit</a></td>
        `;

        row.querySelector('.btn-link').addEventListener('click', (e) => {
            e.preventDefault();
            openEvaluation(index);
        });

        candidatesTbody.appendChild(row);
    });
}

function calculateCategorySum(candidate, category) {
    if (!candidate.evaluation || !candidate.evaluation[category]) {
        return 0;
    }

    const categoryData = candidate.evaluation[category];
    let sum = 0;

    // Check if formal rules is 0 - if so, return 0
    if (categoryData.formal === 0) {
        return 0;
    }

    // Sum all criteria scores
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

async function handleAddCandidate() {
    if (!currentYear) {
        alert('Nejprve vyberte školní rok');
        return;
    }

    const code = prompt('Zadejte kód nového uchazeče (např. F001):');
    if (!code) return;

    const { data, error } = await supabase
        .from('candidates')
        .insert({
            code: code.trim(),
            school_year: currentYear,
            evaluation: {
                portrait: { formal: 0 },
                file: { formal: 0 },
                'still-life': { formal: 0 }
            }
        })
        .select()
        .single();

    if (error) {
        alert('Chyba při vytváření uchazeče: ' + error.message);
        return;
    }

    await loadCandidates();
    const index = candidates.findIndex(c => c.id === data.id);
    if (index !== -1) {
        openEvaluation(index);
    }
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

    // Load evaluation data
    const evaluation = candidate.evaluation || {
        portrait: { formal: 0 },
        file: { formal: 0 },
        'still-life': { formal: 0 }
    };

    // Load scores for each category
    ['portrait', 'file', 'still-life'].forEach(category => {
        const categoryData = evaluation[category] || { formal: 0 };
        
        Object.keys(categoryData).forEach(key => {
            if (key !== 'penalties' && typeof categoryData[key] === 'number') {
                const select = document.querySelector(`.score-select[data-category="${category}"][data-criterion="${key}"]`);
                if (select) {
                    select.value = categoryData[key];
                }
            }
        });

        // Load penalties
        if (categoryData.penalties) {
            Object.keys(categoryData.penalties).forEach(criterion => {
                const penalties = categoryData.penalties[criterion] || [];
                penalties.forEach(penalty => {
                    const checkbox = document.querySelector(
                        `.penalty-reasons[data-category="${category}"][data-criterion="${criterion}"] input[value="${penalty}"]`
                    );
                    if (checkbox) {
                        checkbox.checked = true;
                    }
                });
            });
        }
    });

    updateSums();
    updateDisabledStates();
}

function navigateCandidate(direction) {
    const newIndex = currentCandidateIndex + direction;
    if (newIndex >= 0 && newIndex < candidates.length) {
        // Save current evaluation before navigating
        saveEvaluation(false).then(() => {
            openEvaluation(newIndex);
        });
    }
}

function updateNavigationButtons() {
    prevCandidateBtn.disabled = currentCandidateIndex <= 0;
    nextCandidateBtn.disabled = currentCandidateIndex >= candidates.length - 1;
}

// Score handling
function handleScoreChange(e) {
    const select = e.target;
    const category = select.dataset.category;
    const criterion = select.dataset.criterion;
    const value = parseInt(select.value);

    // If formal rules is set to 0, lock other criteria
    if (criterion === 'formal' && value === 0) {
        lockCategory(category);
    } else if (criterion === 'formal' && value > 0) {
        unlockCategory(category);
    }

    updateSums();
}

function lockCategory(category) {
    const categorySection = document.querySelector(`.category-section:has(.score-select[data-category="${category}"][data-criterion="formal"])`);
    const criteria = categorySection.querySelectorAll(`.criterion[data-depends-on="${category}-formal"]`);
    
    criteria.forEach(criterion => {
        criterion.classList.add('disabled');
        const select = criterion.querySelector('.score-select');
        if (select) select.value = '0';
    });

    // Set sum to 0
    const sumElement = document.getElementById(`${category}-sum`);
    if (sumElement) {
        sumElement.textContent = '0';
    }
}

function unlockCategory(category) {
    const categorySection = document.querySelector(`.category-section:has(.score-select[data-category="${category}"][data-criterion="formal"])`);
    const criteria = categorySection.querySelectorAll(`.criterion[data-depends-on="${category}-formal"]`);
    
    criteria.forEach(criterion => {
        criterion.classList.remove('disabled');
    });
}

function updateDisabledStates() {
    ['portrait', 'file', 'still-life'].forEach(category => {
        const formalSelect = document.querySelector(`.score-select[data-category="${category}"][data-criterion="formal"]`);
        if (formalSelect && parseInt(formalSelect.value) === 0) {
            lockCategory(category);
        } else {
            unlockCategory(category);
        }
    });
}

function updateSums() {
    // Calculate portrait sum
    const portraitSum = calculateCurrentCategorySum('portrait');
    document.getElementById('portrait-sum').textContent = portraitSum;

    // Calculate file sum
    const fileSum = calculateCurrentCategorySum('file');
    document.getElementById('file-sum').textContent = fileSum;

    // Calculate still-life sum
    const stillLifeSum = calculateCurrentCategorySum('still-life');
    document.getElementById('still-life-sum').textContent = stillLifeSum;

    // Calculate total
    const total = portraitSum + fileSum + stillLifeSum;
    document.getElementById('total-sum').textContent = total;
}

function calculateCurrentCategorySum(category) {
    const formalSelect = document.querySelector(`.score-select[data-category="${category}"][data-criterion="formal"]`);
    if (!formalSelect || parseInt(formalSelect.value) === 0) {
        return 0;
    }

    let sum = 0;
    const selects = document.querySelectorAll(`.score-select[data-category="${category}"]`);
    selects.forEach(select => {
        sum += parseInt(select.value) || 0;
    });

    return sum;
}

async function saveEvaluation(showAlert = true) {
    if (!currentCandidateId) return;

    // Collect evaluation data
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

    // Update local data
    const candidate = candidates[currentCandidateIndex];
    candidate.evaluation = evaluation;

    if (showAlert) {
        alert('Hodnocení uloženo');
    }

    // Update overview table if visible
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

        // Collect penalties
        const penaltyContainer = document.querySelector(
            `.penalty-reasons[data-category="${category}"][data-criterion="${criterion}"]`
        );
        if (penaltyContainer) {
            const checked = Array.from(penaltyContainer.querySelectorAll('input:checked')).map(cb => cb.value);
            if (checked.length > 0) {
                penalties[criterion] = checked;
            }
        }
    });

    if (Object.keys(penalties).length > 0) {
        data.penalties = penalties;
    }

    return data;
}

// Initialize on load
init();
