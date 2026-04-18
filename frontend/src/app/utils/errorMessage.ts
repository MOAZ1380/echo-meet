import { ApiError } from "../api/client";

/**
 * Returns a user-friendly message from unknown thrown values.
 */
export function getErrorMessage(
  error: unknown,
  fallback = "Something went wrong. Please try again.",
) {
  if (error instanceof ApiError) {
    return error.message;
  }

  if (error instanceof Error) {
    if (error.message === "Failed to fetch") {
      return "Unable to reach the server. Please check your connection.";
    }

    return error.message || fallback;
  }

  if (typeof error === "string" && error.trim()) {
    return error;
  }

  return fallback;
}
