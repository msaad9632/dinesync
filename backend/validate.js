// ==========================================
// Minimal request-body validation
// ==========================================
// Client-side `min`/`max`/`required` attributes are trivially bypassed
// (curl, devtools). This is the layer that turns a bad request into a
// clean 400 instead of a 500 or a silently-corrupt row. The DB CHECK
// constraints (see runMigrations.js) are the layer that actually holds
// if this is ever bypassed.

function requiredString(value, field, { maxLength = 255 } = {}) {
    if (typeof value !== 'string' || value.trim() === '') {
        return `${field} is required`;
    }
    if (value.length > maxLength) {
        return `${field} must be ${maxLength} characters or fewer`;
    }
    return null;
}

function optionalString(value, field, { maxLength = 255 } = {}) {
    if (value === undefined || value === null || value === '') return null;
    if (typeof value !== 'string' || value.length > maxLength) {
        return `${field} must be ${maxLength} characters or fewer`;
    }
    return null;
}

function requiredInt(value, field, { min, max } = {}) {
    const n = Number(value);
    if (!Number.isInteger(n)) return `${field} must be a whole number`;
    if (min !== undefined && n < min) return `${field} must be at least ${min}`;
    if (max !== undefined && n > max) return `${field} must be at most ${max}`;
    return null;
}

function requiredNumber(value, field, { min, max } = {}) {
    const n = Number(value);
    if (Number.isNaN(n)) return `${field} must be a number`;
    if (min !== undefined && n < min) return `${field} must be at least ${min}`;
    if (max !== undefined && n > max) return `${field} must be at most ${max}`;
    return null;
}

function oneOf(value, field, allowed) {
    if (!allowed.includes(value)) return `${field} must be one of: ${allowed.join(', ')}`;
    return null;
}

// Runs `checks` (an array of error strings/nulls) and, if any failed,
// sends a 400 and returns true so the caller can `return` immediately.
function respondIfInvalid(res, checks) {
    const errors = checks.filter(Boolean);
    if (errors.length > 0) {
        res.status(400).json({ error: errors[0] });
        return true;
    }
    return false;
}

module.exports = { requiredString, optionalString, requiredInt, requiredNumber, oneOf, respondIfInvalid };
