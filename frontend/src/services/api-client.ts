/**
 * Centralized API client for Haven frontend.
 * Conforms to docs/TECH_STACK.md and docs/API_SPEC.md.
 */

import { ApiErrorResponse } from "../types/health";

export class ApiError extends Error {
  readonly code: string;
  readonly status: number;
  readonly details?: Record<string, unknown>;

  constructor(
    message: string,
    code = "NETWORK_ERROR",
    status = 0,
    details?: Record<string, unknown>
  ) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

function getApiBaseUrl(): string {
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_BASE_URL) {
    return String(import.meta.env.VITE_API_BASE_URL);
  }
  if (typeof window !== 'undefined' && window.location && window.location.origin) {
    return window.location.port === '5173' ? 'http://localhost:8000' : '';
  }
  return 'http://localhost:8000';
}

export const API_BASE_URL: string = getApiBaseUrl();

interface RequestOptions extends RequestInit {
  timeoutMs?: number;
}

export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {}
): Promise<T> {
  const { timeoutMs = 10000, ...fetchOptions } = options;

  const url = `${API_BASE_URL.replace(/\/+$/, "")}${path.startsWith("/") ? path : `/${path}`}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      signal: controller.signal,
      headers: {
        Accept: "application/json",
        ...(fetchOptions.headers || {}),
      },
    });

    clearTimeout(timeoutId);

    // Try parsing JSON response if headers indicate or by default
    let json: unknown = null;
    const contentType =
      response.headers && typeof response.headers.get === "function"
        ? response.headers.get("content-type")
        : null;

    if (!contentType || contentType.includes("application/json")) {
      json = await response.json().catch(() => null);
    }

    if (!response.ok) {
      if (json && typeof json === "object" && "error" in json) {
        const errResp = json as ApiErrorResponse;
        const msg = errResp.error.message
          ? `${errResp.error.message} (HTTP ${response.status})`
          : `Request failed with status ${response.status}`;
        throw new ApiError(
          msg,
          errResp.error.code || "API_ERROR",
          response.status,
          errResp.error.details
        );
      }
      throw new ApiError(
        `Request failed with status ${response.status}`,
        "HTTP_ERROR",
        response.status
      );
    }

    return (json ?? {}) as T;
  } catch (error: unknown) {
    clearTimeout(timeoutId);

    if (error instanceof ApiError) {
      throw error;
    }

    if (error instanceof Error && error.name === "AbortError") {
      throw new ApiError(
        "The request timed out. Please check your network and backend service.",
        "TIMEOUT",
        408
      );
    }

    const rawMessage = error instanceof Error ? error.message : "Network failure";
    const message = rawMessage.toLowerCase().includes("fetch")
      ? `Network connection failed: ${rawMessage}`
      : rawMessage;

    throw new ApiError(message, "CONNECTION_FAILURE", 0);
  }
}

export async function apiBlobRequest(
  path: string,
  options: RequestOptions = {}
): Promise<Blob> {
  const { timeoutMs = 30000, ...fetchOptions } = options;

  const url = `${API_BASE_URL.replace(/\/+$/, "")}${path.startsWith("/") ? path : `/${path}`}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      signal: controller.signal,
      headers: {
        Accept: "application/pdf, application/json",
        ...(fetchOptions.headers || {}),
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      let json: unknown = null;
      try {
        json = await response.json();
      } catch {
        // Not JSON
      }

      if (json && typeof json === "object" && "error" in json) {
        const errResp = json as ApiErrorResponse;
        const msg = errResp.error.message
          ? `${errResp.error.message} (HTTP ${response.status})`
          : `Request failed with status ${response.status}`;
        throw new ApiError(
          msg,
          errResp.error.code || "API_ERROR",
          response.status,
          errResp.error.details
        );
      }
      throw new ApiError(
        `Request failed with status ${response.status}`,
        "HTTP_ERROR",
        response.status
      );
    }

    const contentType =
      response.headers && typeof response.headers.get === "function"
        ? response.headers.get("content-type")
        : null;

    if (!contentType || !contentType.toLowerCase().includes("application/pdf")) {
      throw new ApiError(
        "Invalid response format: expected application/pdf from server.",
        "INVALID_CONTENT_TYPE",
        response.status
      );
    }

    return await response.blob();
  } catch (error: unknown) {
    clearTimeout(timeoutId);

    if (error instanceof ApiError) {
      throw error;
    }

    if (error instanceof Error && error.name === "AbortError") {
      throw new ApiError(
        "The PDF export request timed out. Please check your network and backend service.",
        "TIMEOUT",
        408
      );
    }

    const rawMessage = error instanceof Error ? error.message : "Network failure";
    const message = rawMessage.toLowerCase().includes("fetch")
      ? `Network connection failed: ${rawMessage}`
      : rawMessage;

    throw new ApiError(message, "CONNECTION_FAILURE", 0);
  }
}
