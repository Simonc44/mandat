import { describe, it, expect } from "vitest";
import {
  normalize,
  sanitizeSearchInput,
  photoUrl,
  sanitizeSlug,
  sanitizeText,
  positionLabel,
  positionColor,
  groupeMeta,
} from "./api";

describe("normalize()", () => {
  it("supprime les accents", () => {
    expect(normalize("éàüèîôûç")).toBe("eaueiouc");
  });

  it("met en minuscules", () => {
    expect(normalize("DUPONT Jean-Luc")).toBe("dupont jean-luc");
  });

  it("gère les caractères spéciaux", () => {
    expect(normalize("Jean@Luc! (75)")).toBe("jean luc 75");
  });

  it("nettoie les espaces multiples", () => {
    expect(normalize("  jean   luc  ")).toBe("jean luc");
  });

  it("retourne vide si input non valide", () => {
    expect(normalize("")).toBe("");
    // @ts-ignore - testing runtime behavior
    expect(normalize(null)).toBe("");
    // @ts-ignore
    expect(normalize(undefined)).toBe("");
  });
});

describe("sanitizeSearchInput()", () => {
  it("supprime les balises HTML mais garde le contenu (sans caractères interdits)", () => {
    // <script>alert("xss")</script>Hello
    // -> alertxssHello (car <script> et </script> sont supprimés, ainsi que " et ())
    expect(sanitizeSearchInput('<script>alert("xss")</script>Hello')).toBe(
      "alertxssHello",
    );
    expect(sanitizeSearchInput("<b>Gras</b>")).toBe("Gras");
  });

  it("supprime les caractères dangereux", () => {
    expect(sanitizeSearchInput("test; drop table users;")).toBe(
      "test drop table users",
    );
    expect(sanitizeSearchInput('input "value"')).toBe("input value");
  });

  it("supprime javascript:", () => {
    // javascript:alert(1) -> alert1 (car : et () sont supprimés)
    expect(sanitizeSearchInput("javascript:alert(1)")).toBe("alert1");
  });

  it("limite la longueur à 150 caractères", () => {
    const longInput = "a".repeat(200);
    expect(sanitizeSearchInput(longInput)).toHaveLength(150);
  });

  it("nettoie les espaces", () => {
    expect(sanitizeSearchInput("  recherche   multiple  ")).toBe(
      "recherche multiple",
    );
  });

  it("retourne vide pour les types invalides", () => {
    expect(sanitizeSearchInput(null)).toBe("");
    expect(sanitizeSearchInput(123)).toBe("");
    expect(sanitizeSearchInput({})).toBe("");
  });
});

describe("photoUrl()", () => {
  it("génère une URL valide pour la législature 17 (défaut)", () => {
    expect(photoUrl("PA793214")).toBe(
      "https://www2.assemblee-nationale.fr/static/tribun/17/photos/793214.jpg",
    );
  });

  it("génère une URL valide pour la législature 16", () => {
    expect(photoUrl("PA793214", 16)).toBe(
      "https://www2.assemblee-nationale.fr/static/tribun/16/photos/793214.jpg",
    );
  });

  it("retourne vide si le format ID est invalide", () => {
    expect(photoUrl("793214")).toBe("");
    expect(photoUrl("ABC12345")).toBe("");
    expect(photoUrl("")).toBe("");
  });

  it("gère les IDs longs ou courts", () => {
    expect(photoUrl("PA123")).toBe(
      "https://www2.assemblee-nationale.fr/static/tribun/17/photos/123.jpg",
    );
    expect(photoUrl("PA1234567890")).toBe(
      "https://www2.assemblee-nationale.fr/static/tribun/17/photos/1234567890.jpg",
    );
  });
});

describe("sanitizeSlug()", () => {
  it("met en minuscules et nettoie les caractères", () => {
    expect(sanitizeSlug("mon-super-slug")).toBe("mon-super-slug");
  });

  it("gère les tirets multiples", () => {
    expect(sanitizeSlug("test---slug")).toBe("test-slug");
  });

  it("supprime les tirets au début et à la fin", () => {
    expect(sanitizeSlug("-test-")).toBe("test");
  });

  it("limite la longueur à 100 caractères", () => {
    const longSlug = "a".repeat(150);
    expect(sanitizeSlug(longSlug)).toHaveLength(100);
  });

  it("retourne vide pour les types invalides", () => {
    expect(sanitizeSlug(null)).toBe("");
    expect(sanitizeSlug(123)).toBe("");
  });
});

describe("sanitizeText()", () => {
  it("supprime les balises HTML et limite la longueur", () => {
    expect(sanitizeText("<b>Hello</b> World", 5)).toBe("Hello");
  });

  it("retourne vide pour les types invalides", () => {
    expect(sanitizeText(null)).toBe("");
  });
});

describe("positionLabel()", () => {
  it("retourne le label correct pour chaque position", () => {
    expect(positionLabel("pour")).toBe("Pour");
    expect(positionLabel("contre")).toBe("Contre");
    expect(positionLabel("abstention")).toBe("Abstention");
    expect(positionLabel("nonVotant")).toBe("Absent");
  });
});

describe("positionColor()", () => {
  it("retourne la couleur correcte pour chaque position", () => {
    expect(positionColor("pour")).toBe("var(--color-pour)");
    expect(positionColor("contre")).toBe("var(--color-contre)");
  });
});

describe("groupeMeta()", () => {
  it("retourne les métadonnées pour un groupe connu", () => {
    // On ne connaît pas la liste exacte sans lire GROUPES, mais on peut tester NI
    const meta = groupeMeta("NI");
    expect(meta.nom).toBe("Non inscrits");
  });

  it("gère les groupes inconnus", () => {
    const meta = groupeMeta("INCONNU");
    expect(meta.nom).toBe("INCONNU");
    expect(meta.couleur).toBe("oklch(0.55 0.02 285)");
  });
});
