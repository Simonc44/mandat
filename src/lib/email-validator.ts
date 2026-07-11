/**
 * Validateur d'adresse email pour les abonnements de Mandat.
 *
 * Ce fichier implémente :
 * 1. Une vérification du format standard de l'adresse email.
 * 2. Un filtrage strict des adresses emails temporaires/jetables (disposable emails).
 * 3. Une validation de la compatibilité Google (Gmail rules et détection de domaines invalides).
 */

// Liste complète et extensible des principaux domaines d'emails temporaires/jetables
export const BLOCKED_DISPOSABLE_DOMAINS = new Set([
  "yopmail.com", "yopmail.fr", "yopmail.net", "cool.fr.nf", "jetable.fr.nf",
  "courriel.fr.nf", "moncourriel.fr.nf", "monemail.fr.nf", "monmail.fr.nf",
  "mailinator.com", "tempmail.com", "temp-mail.org", "guerrillamail.com",
  "sharklasers.com", "guerrillamailblock.com", "guerrillamail.net",
  "guerrillamail.org", "guerrillamail.biz", "grr.la", "dispostable.com",
  "10minutemail.com", "getairmail.com", "throwawaymail.com", "tempmailaddress.com",
  "boun.cr", "safe-mail.net", "maildrop.cc", "discard.email", "trashmail.com",
  "trashmail.de", "trashmail.me", "gmx.es", "tempmail.net", "crazymailing.com",
  "generator.email", "getnada.com", "nada.ltd", "dropmail.me", "moakt.com",
  "disposable.com", "emailondeck.com", "temp-mail.ru", "temp-mail.io",
  "fakeinbox.com", "tempmailo.com", "mailnesia.com", "mailcatch.com",
  "mintemail.com", "mytemp.email", "tempail.com", "tempr.email",
  "zippymail.info", "getmail.re", "spymail.one", "jetable.org", "boximail.com"
]);

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Valide si une adresse email est acceptable pour l'inscription aux alertes.
 * Bloque les adresses temporaires ou non compatibles avec les spécifications Google.
 */
export function validateEmailForSubscription(email: string): ValidationResult {
  const cleanEmail = (email ?? "").trim().toLowerCase();

  if (!cleanEmail) {
    return { isValid: false, error: "L'adresse email est requise." };
  }

  // 1. Validation du format standard RFC
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  if (!emailRegex.test(cleanEmail)) {
    return { isValid: false, error: "Le format de l'adresse email est invalide." };
  }

  const parts = cleanEmail.split("@");
  if (parts.length !== 2) {
    return { isValid: false, error: "L'adresse email doit contenir exactement un caractère '@'." };
  }

  const [localPart, domain] = parts;

  // 2. Vérification des adresses temporaires/jetables
  // On gère aussi les sous-domaines (ex: mail.yopmail.com)
  const domainParts = domain.split(".");
  for (let i = 0; i < domainParts.length - 1; i++) {
    const subDomain = domainParts.slice(i).join(".");
    if (BLOCKED_DISPOSABLE_DOMAINS.has(subDomain)) {
      return {
        isValid: false,
        error: "Les adresses email temporaires ou jetables ne sont pas autorisées pour s'abonner."
      };
    }
  }

  // 3. Validation de compatibilité Google (spécificités Gmail/Googlemail)
  if (domain === "gmail.com" || domain === "googlemail.com") {
    // Retirer la partie tag/plus (ex: username+tag@gmail.com -> username)
    const baseUsername = localPart.split("+")[0];

    // Règle de longueur Google : entre 6 et 30 caractères pour le nom d'utilisateur
    if (baseUsername.length < 6 || baseUsername.length > 30) {
      return {
        isValid: false,
        error: "L'adresse Gmail n'est pas compatible avec Google (le nom d'utilisateur doit faire entre 6 et 30 caractères)."
      };
    }

    // Caractères autorisés : lettres (a-z), chiffres (0-9) et points (.)
    // Note : le email-validator opère sur cleanEmail qui est déjà en minuscules.
    const gmailUsernameRegex = /^[a-z0-9.]+$/;
    if (!gmailUsernameRegex.test(baseUsername)) {
      return {
        isValid: false,
        error: "L'adresse Gmail contient des caractères non compatibles (uniquement des lettres, des chiffres et des points)."
      };
    }

    // Les points consécutifs ne sont pas autorisés
    if (baseUsername.includes("..")) {
      return {
        isValid: false,
        error: "L'adresse Gmail n'est pas compatible (les points consécutifs ne sont pas autorisés par Google)."
      };
    }

    // Ne peut pas commencer ni se terminer par un point
    if (baseUsername.startsWith(".") || baseUsername.endsWith(".")) {
      return {
        isValid: false,
        error: "L'adresse Gmail n'est pas compatible (elle ne peut pas commencer ni se terminer par un point)."
      };
    }
  }

  return { isValid: true };
}
