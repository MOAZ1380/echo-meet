import { setCookie, getJsonCookie } from "./cookies";

const PARTICIPANT_ID_COOKIE = "echo_participant_id";

/**
 * Generate a unique participant ID for guests or retrieve existing one
 */
export function getOrCreateParticipantId(): string {
  // Try to get existing participant ID from cookie
  const existingId = getCookie(PARTICIPANT_ID_COOKIE);
  if (existingId) {
    return existingId;
  }

  // Generate a new unique participant ID
  const newId = generateParticipantId();
  setCookie(PARTICIPANT_ID_COOKIE, newId, {
    expiresDays: 30, // Store for 30 days
  });

  return newId;
}

/**
 * Generate a unique participant ID format
 */
function generateParticipantId(): string {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substring(2, 9);
  return `participant_${timestamp}_${randomStr}`;
}

/**
 * Get participant ID from cookie if exists
 */
function getCookie(name: string): string | null {
  const encodedName = `${encodeURIComponent(name)}=`;
  const cookies = document.cookie ? document.cookie.split(";") : [];

  for (const cookie of cookies) {
    const normalized = cookie.trim();
    if (normalized.startsWith(encodedName)) {
      const value = normalized.slice(encodedName.length);
      return decodeURIComponent(value);
    }
  }

  return null;
}

/**
 * Get current participant ID - use user ID if authenticated, otherwise use guest participant ID
 */
export function getCurrentParticipantId(userId?: string): string {
  if (userId) {
    return userId;
  }
  return getOrCreateParticipantId();
}
