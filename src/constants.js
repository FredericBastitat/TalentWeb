// ================================================================
// TalentWeb – Shared Constants
// ================================================================

export const CATEGORIES = [
    {
        key: 'portrait',
        title: 'PORTRÉT',
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
                name: 'Volba námětu / kreativita',
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
                name: 'Práce se světlem, technická kvalita',
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
                name: 'Volba námětu / kreativita',
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
                name: 'Práce se světlem, technická kvalita',
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
        color: '#60a5fa',
        bg: 'rgba(96, 165, 250, 0.12)',
        borderColor: 'rgba(96, 165, 250, 0.3)',
    },
    2: {
        name: 'Hodnotitel 2',
        shortName: 'H2',
        color: '#34d399',
        bg: 'rgba(52, 211, 153, 0.12)',
        borderColor: 'rgba(52, 211, 153, 0.3)',
    },
    3: {
        name: 'Hodnotitel 3',
        shortName: 'H3',
        color: '#fbbf24',
        bg: 'rgba(251, 191, 36, 0.12)',
        borderColor: 'rgba(251, 191, 36, 0.3)',
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
