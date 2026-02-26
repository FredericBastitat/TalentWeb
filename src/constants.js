// ================================================================
// TalentWeb – Shared Constants
// ================================================================

export const CATEGORIES = [
    {
        key: 'portrait',
        title: 'PORTRÉT',
        color: '#fbbf24', // Yellow
        colorBg: 'rgba(251, 191, 36, 0.1)',
        criteria: [
            {
                key: 'formal',
                name: 'Formální pravidla',
                maxScore: 2,
                penalties: [
                    { value: 'wrong-count', label: 'Jiný počet fotografií' },
                    { value: 'wrong-mounting', label: 'Nenalepené na podkladovém papíru, špatný podklad' },
                    { value: 'wrong-format', label: 'Jiný formát nebo orientace fotografií' },
                ],
            },
            {
                key: 'genre',
                name: 'Žánr',
                maxScore: 2,
                penalties: [
                    { value: 'wrong-genre', label: 'Nedodržení žánru (portrét, zátiší)' },
                    { value: 'wrong-requirements', label: 'Nedodržení požadavků interiér/exteriér, vytvořené/nalezené, barva/ČB' },
                ],
            },
            {
                key: 'creativity',
                name: 'Námět / kreativita',
                maxScore: 2,
                penalties: [
                    { value: 'uninteresting', label: 'Nezajímavý námět, fotografie bez nápadu' },
                    { value: 'low-creativity', label: 'Malá míra kreativity' },
                    { value: 'inconsistent', label: 'Nekonzistentní soubor fotografií' },
                ],
            },
            {
                key: 'composition',
                name: 'Kompozice',
                maxScore: 2,
                penalties: [
                    { value: 'wrong-rules', label: 'Bezdůvodné nedodržení kompozičních pravidel' },
                    { value: 'wrong-dof', label: 'Nevhodné použití hloubky ostrosti' },
                    { value: 'wrong-crop', label: 'Chybné ořezy snímku' },
                    { value: 'mergers', label: 'Srostlice a rušivé prvky' },
                    { value: 'distracting', label: 'Rušivé prvky vyvádějící pozornost' },
                ],
            },
            {
                key: 'technical',
                name: 'Světlo / kvalita',
                maxScore: 2,
                penalties: [
                    { value: 'unsharp', label: 'Neostrá fotografie' },
                    { value: 'exposure', label: 'Nevhodná expozice' },
                    { value: 'white-balance', label: 'Špatné vyvážení bílé' },
                    { value: 'resolution', label: 'Příliš malé rozlišení nebo šum' },
                    { value: 'editing', label: 'Fotografie pokažená nevhodnou editací' },
                ],
            },
        ],
    },
    {
        key: 'file',
        title: 'SOUBOR',
        color: '#38bdf8', // Blue/Azure (More distinct from Yellow)
        colorBg: 'rgba(56, 189, 248, 0.1)',
        criteria: [
            {
                key: 'formal',
                name: 'Formální pravidla',
                maxScore: 2,
                penalties: [
                    { value: 'wrong-count', label: 'Jiný počet fotografií' },
                    { value: 'wrong-mounting', label: 'Nenalepené na podkladovém papíru' },
                    { value: 'wrong-format', label: 'Jiný formát nebo orientace' },
                ],
            },
            {
                key: 'relevance',
                name: 'Jasná souvislost s tématem souboru',
                maxScore: 2,
                penalties: [
                    { value: 'wrong-genre', label: 'Nedodržení žánru' },
                    { value: 'wrong-requirements', label: 'Nedodržení požadavků interiér/exteriér, barva/ČB' },
                ],
            },
            {
                key: 'creativity',
                name: 'Námět / kreativita',
                maxScore: 2,
                penalties: [
                    { value: 'uninteresting', label: 'Nezajímavý námět' },
                    { value: 'low-creativity', label: 'Malá míra kreativity' },
                    { value: 'inconsistent', label: 'Nekonzistentní soubor' },
                ],
            },
            {
                key: 'composition',
                name: 'Kompozice',
                maxScore: 2,
                penalties: [
                    { value: 'wrong-rules', label: 'Bezdůvodné nedodržení kompozičních pravidel' },
                    { value: 'wrong-dof', label: 'Nevhodné použití hloubky ostrosti' },
                    { value: 'wrong-crop', label: 'Chybné ořezy' },
                    { value: 'mergers', label: 'Srostlice' },
                    { value: 'distracting', label: 'Rušivé prvky' },
                ],
            },
            {
                key: 'technical',
                name: 'Světlo / kvalita',
                maxScore: 2,
                penalties: [
                    { value: 'unsharp', label: 'Neostrá fotografie' },
                    { value: 'exposure', label: 'Nevhodná expozice' },
                    { value: 'white-balance', label: 'Špatné vyvážení bílé' },
                    { value: 'resolution', label: 'Malé rozlišení nebo šum' },
                    { value: 'editing', label: 'Nevhodná editace' },
                ],
            },
        ],
    },
    {
        key: 'still-life',
        title: 'ZÁTIŠÍ',
        color: '#34d399', // Green
        colorBg: 'rgba(52, 211, 153, 0.1)',
        criteria: [
            {
                key: 'formal',
                name: 'Formální pravidla',
                maxScore: 2,
                penalties: [
                    { value: 'wrong-count', label: 'Jiný počet fotografií' },
                    { value: 'wrong-mounting', label: 'Nenalepené na podkladovém papíru' },
                    { value: 'wrong-format', label: 'Jiný formát nebo orientace' },
                ],
            },
            {
                key: 'genre',
                name: 'Žánr a požadavky',
                maxScore: 2,
                penalties: [
                    { value: 'wrong-genre', label: 'Nedodržení žánru' },
                    { value: 'wrong-requirements', label: 'Nedodržení požadavků interiér/exteriér, barva/ČB' },
                ],
            },
        ],
    },
];

export const EVALUATOR_META = {
    1: {
        name: 'Hodnotitel 1',
        shortName: 'H1',
        color: '#94a3b8',
        bg: 'rgba(148, 163, 184, 0.1)',
        borderColor: 'rgba(148, 163, 184, 0.2)',
    },
    2: {
        name: 'Hodnotitel 2',
        shortName: 'H2',
        color: '#94a3b8',
        bg: 'rgba(148, 163, 184, 0.1)',
        borderColor: 'rgba(148, 163, 184, 0.2)',
    },
    3: {
        name: 'Hodnotitel 3',
        shortName: 'H3',
        color: '#94a3b8',
        bg: 'rgba(148, 163, 184, 0.1)',
        borderColor: 'rgba(148, 163, 184, 0.2)',
    },
};

export const DIRECTOR_META = {
    name: 'Ředitel',
    shortName: 'Ř',
    color: '#c084fc',
    bg: 'rgba(192, 132, 252, 0.12)',
    borderColor: 'rgba(192, 132, 252, 0.3)',
};

export const DEFAULT_EVALUATION = {
    portrait: { formal: 0 },
    file: { formal: 0 },
    'still-life': { formal: 0 },
};

export const PENALTY_CODES = {
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
    'relevance': 'A',
};

export const PENALTY_LABELS = {
    'wrong-count': 'Jiný počet fotografií',
    'wrong-mounting': 'Nenalepené na podkladovém papíru',
    'wrong-format': 'Jiný formát nebo orientace',
    'wrong-genre': 'Nedodržení žánru',
    'wrong-requirements': 'Nedodržení požadavků',
    'uninteresting': 'Nezajímavý námět',
    'low-creativity': 'Malá míra kreativity',
    'inconsistent': 'Nekonzistentní soubor',
    'wrong-rules': 'Nedodržení kompozičních pravidel',
    'wrong-dof': 'Nevhodné použití hloubky ostrosti',
    'wrong-crop': 'Chybné ořezy',
    'mergers': 'Srostlice',
    'distracting': 'Rušivé prvky',
    'unsharp': 'Neostrá fotografie',
    'exposure': 'Nevhodná expozice',
    'white-balance': 'Špatné vyvážení bílé',
    'resolution': 'Malé rozlišení nebo šum',
    'editing': 'Nevhodná editace',
    'relevance': 'Není souvislost s tématem',
};

// Helper: calculate category sum from evaluation data
export const calculateCategorySum = (evaluation, category) => {
    if (!evaluation || !evaluation[category]) return 0;
    const categoryData = evaluation[category];
    let sum = 0;
    Object.keys(categoryData).forEach(key => {
        if (key !== 'penalties' && typeof categoryData[key] === 'number') {
            sum += categoryData[key];
        }
    });
    return sum;
};

// Helper: calculate total sum from evaluation data
export const calculateTotalSum = (evaluation) => {
    if (!evaluation) return 0;
    return (
        calculateCategorySum(evaluation, 'portrait') +
        calculateCategorySum(evaluation, 'file') +
        calculateCategorySum(evaluation, 'still-life')
    );
};
