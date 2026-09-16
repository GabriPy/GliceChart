/**
 * Valida un range in minuti da query string.
 * Ritorna il numero valido, oppure null se il valore è assente/non valido/fuori bounds.
 */

function parseRange(raw, { def = 180, min = 60, max = 129600 } = {}) {
    if (raw === undefined) return def;
    if (!/^\d+$/.test(String(raw).trim())) return null;

    const range = parseInt(raw, 10);
    if (!Number.isFinite(range) || range < min || range > max) return null;

    return rande;
}

module.exports = { parseRange };