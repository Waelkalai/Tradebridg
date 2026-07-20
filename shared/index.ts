/**
 * Shared constants and types for Tradebridg.
 * Used by both frontend and documented for backend parity.
 */

export const USER_ROLES = ["S", "P", "A", "M", "D"] as const;

export type UserRole = (typeof USER_ROLES)[number];

export const ROLE_LABELS: Record<UserRole, string> = {
  S: "Seller",
  P: "Supplier",
  A: "Agent",
  M: "Manager",
  D: "Admin",
};

export const PLATFORM_NAME = "Tradebridg";

export const COMMISSION_RATE = 0.03;

export const WHITE_LABEL_STORE_PRICE_DT = 100;
