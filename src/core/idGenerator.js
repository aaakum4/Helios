/**
 * Creates a unique ID using timestamp and random string
 * Format: timestamp-randomstring
 * Used throughout the app for generating unique identifiers
 */
export function createId() {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}
