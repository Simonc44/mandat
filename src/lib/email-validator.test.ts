import { describe, it, expect } from "vitest";
import { validateEmailForSubscription } from "./email-validator";

describe("validateEmailForSubscription", () => {
  it("should accept valid standard emails", () => {
    expect(validateEmailForSubscription("test.user@example.com")).toEqual({ isValid: true });
    expect(validateEmailForSubscription("citizen.john@asso.fr")).toEqual({ isValid: true });
  });

  it("should block empty or invalid format emails", () => {
    expect(validateEmailForSubscription("")).toEqual({
      isValid: false,
      error: "L'adresse email est requise.",
    });
    expect(validateEmailForSubscription("invalidemail")).toEqual({
      isValid: false,
      error: "Le format de l'adresse email est invalide.",
    });
    expect(validateEmailForSubscription("test@@example.com")).toEqual({
      isValid: false,
      error: "Le format de l'adresse email est invalide.",
    });
  });

  it("should block temporary and disposable emails", () => {
    expect(validateEmailForSubscription("hello@yopmail.com")).toEqual({
      isValid: false,
      error: "Les adresses email temporaires ou jetables ne sont pas autorisées pour s'abonner.",
    });
    expect(validateEmailForSubscription("user@mailinator.com")).toEqual({
      isValid: false,
      error: "Les adresses email temporaires ou jetables ne sont pas autorisées pour s'abonner.",
    });
    expect(validateEmailForSubscription("john@temp-mail.org")).toEqual({
      isValid: false,
      error: "Les adresses email temporaires ou jetables ne sont pas autorisées pour s'abonner.",
    });
    expect(validateEmailForSubscription("test@sub.yopmail.com")).toEqual({
      isValid: false,
      error: "Les adresses email temporaires ou jetables ne sont pas autorisées pour s'abonner.",
    });
  });

  it("should validate Google/Gmail specific compatibility rules", () => {
    // Valid gmail addresses
    expect(validateEmailForSubscription("valid.gmail.user@gmail.com")).toEqual({ isValid: true });
    expect(validateEmailForSubscription("username123@gmail.com")).toEqual({ isValid: true });
    expect(validateEmailForSubscription("user.name+tag@gmail.com")).toEqual({ isValid: true });
    expect(validateEmailForSubscription("abcdef@googlemail.com")).toEqual({ isValid: true });

    // Username too short (< 6 chars)
    expect(validateEmailForSubscription("abc@gmail.com")).toEqual({
      isValid: false,
      error: "L'adresse Gmail n'est pas compatible avec Google (le nom d'utilisateur doit faire entre 6 et 30 caractères).",
    });

    // Username too long (> 30 chars)
    expect(validateEmailForSubscription("abcdefghijklmnopqrstuvwxyz12345@gmail.com")).toEqual({
      isValid: false,
      error: "L'adresse Gmail n'est pas compatible avec Google (le nom d'utilisateur doit faire entre 6 et 30 caractères).",
    });

    // Invalid characters (e.g., underscore, hyphen in username before '+')
    expect(validateEmailForSubscription("user_name@gmail.com")).toEqual({
      isValid: false,
      error: "L'adresse Gmail contient des caractères non compatibles (uniquement des lettres, des chiffres et des points).",
    });
    expect(validateEmailForSubscription("user-name@gmail.com")).toEqual({
      isValid: false,
      error: "L'adresse Gmail contient des caractères non compatibles (uniquement des lettres, des chiffres et des points).",
    });

    // Consecutive periods
    expect(validateEmailForSubscription("user..name@gmail.com")).toEqual({
      isValid: false,
      error: "L'adresse Gmail n'est pas compatible (les points consécutifs ne sont pas autorisés par Google).",
    });

    // Starting or ending periods
    expect(validateEmailForSubscription(".username@gmail.com")).toEqual({
      isValid: false,
      error: "L'adresse Gmail n'est pas compatible (elle ne peut pas commencer ni se terminer par un point).",
    });
    expect(validateEmailForSubscription("username.@gmail.com")).toEqual({
      isValid: false,
      error: "L'adresse Gmail n'est pas compatible (elle ne peut pas commencer ni se terminer par un point).",
    });
  });
});
