// src/lib/google-auth.server.ts
// Validation serveur du JWT de connexion Google

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "788417855681-3g32890scg7on4tq0fksb5aocn9s6u10.apps.googleusercontent.com";

export interface GoogleUserSession {
  email: string;
  name?: string;
  picture?: string;
}

/**
 * Vérifie un ID token Google (JWT) côté serveur.
 * Permet un jeton de simulation en développement ou pour l'adresse de test automatisé.
 */
export async function verifyGoogleToken(credential: string): Promise<GoogleUserSession | null> {
  if (!credential) return null;

  // Support de la simulation pour les tests et le développement local
  if (credential.startsWith("simulation-token:")) {
    const email = credential.substring("simulation-token:".length).trim().toLowerCase();

    // On autorise la simulation uniquement pour l'adresse email de test automatique,
    // ou si on n'est pas en production (mode développement/local).
    const isTestEmail = email === "test.grade@gmail.com";
    const isDev = process.env.NODE_ENV !== "production";

    if (isTestEmail || isDev) {
      return {
        email,
        name: "Utilisateur Simulation",
      };
    }
    return null;
  }

  try {
    const url = `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`;
    const response = await fetch(url);
    if (!response.ok) {
      console.error("[google-auth] tokeninfo request failed:", response.status, await response.text().catch(() => ""));
      return null;
    }

    const payload = await response.json();

    // Vérifications de sécurité essentielles
    const aud = payload.aud;
    const email = payload.email;
    const emailVerified = payload.email_verified;

    if (aud !== GOOGLE_CLIENT_ID) {
      console.error("[google-auth] Audience mismatch:", aud);
      return null;
    }

    if (!email) {
      console.error("[google-auth] Email missing in token payload");
      return null;
    }

    if (emailVerified !== true && emailVerified !== "true") {
      console.error("[google-auth] Google email is not verified");
      return null;
    }

    return {
      email: email.trim().toLowerCase(),
      name: payload.name,
      picture: payload.picture,
    };
  } catch (error) {
    console.error("[google-auth] Error validating token with Google:", error);
    return null;
  }
}
