/**
 * Extracts and normalizes the user role from Supabase user metadata.
 * Handles various formats like:
 * - "evaluator-1", "evaluator 1", "evaluator1", "h1" -> "evaluator-1"
 * - "director", "reditel", "ředitel" -> "director"
 */
export const getRoleFromMetadata = (user) => {
    if (!user) return null;

    // Check app_metadata (preferred for admin-set roles) and user_metadata
    const rawRole = (
        user.app_metadata?.role ||
        user.user_metadata?.role ||
        user.role // fallback
    );

    if (!rawRole) return null;

    const role = String(rawRole).toLowerCase().trim();

    // 1. Director detection
    if (role.includes('director') || role.includes('reditel') || role.includes('ředitel')) {
        return 'director';
    }

    // 2. Evaluator detection (H1, H2, H3 or evaluator-1, etc.)
    const hMatch = role.match(/h([1-3])/);
    if (hMatch) {
        return `evaluator-${hMatch[1]}`;
    }

    const eMatch = role.match(/evaluator[- ]?([1-3])/);
    if (eMatch) {
        return `evaluator-${eMatch[1]}`;
    }

    const czMatch = role.match(/hodnotitel[- ]?([1-3])/);
    if (czMatch) {
        return `evaluator-${czMatch[1]}`;
    }

    // Fallback if it's strictly one of the expected app roles
    if (['evaluator-1', 'evaluator-2', 'evaluator-3', 'director'].includes(role)) {
        return role;
    }

    return null;
};
