// Server function pour récupérer les députés de la 16e législature
// via l'archive ouverte de nosdeputes.fr (2022-2024).
import { createServerFn } from "@tanstack/react-start";

export type Depute16 = {
  id_an: string;
  slug: string;
  nom: string;
  prenom: string;
  nom_de_famille: string;
  groupe: string;
  groupe_sigle: string;
  nom_circo: string;
  num_deptmt: string;
  num_circo: number;
  sexe: string;
  url_an: string;
  photo: string;
};

export const getDeputes16 = createServerFn({ method: "GET" }).handler(
  async (): Promise<Depute16[]> => {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 20_000);
    try {
      const r = await fetch("https://www.nosdeputes.fr/deputes/json", {
        signal: ctrl.signal,
        headers: { Accept: "application/json" },
      });
      clearTimeout(t);
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const data: any = await r.json();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const list: any[] = data?.deputes ?? [];
      const out: Depute16[] = [];
      for (const x of list) {
        const d = x?.depute ?? x;
        if (!d) continue;
        const prenom = String(d.prenom ?? "").slice(0, 100);
        const nom = String(d.nom_de_famille ?? d.nom ?? "").slice(0, 100);
        const slug = String(d.slug ?? "")
          .replace(/[^a-z0-9-]/gi, "")
          .slice(0, 100);
        const groupeNom = String(
          d.groupe_sigle ?? d.parti_ratt_financier ?? "NI",
        );
        out.push({
          id_an: String(d.id_an ?? "")
            .replace(/[^A-Z0-9]/g, "")
            .slice(0, 20),
          slug,
          nom: `${prenom} ${nom}`.trim(),
          prenom,
          nom_de_famille: nom,
          groupe: groupeNom,
          groupe_sigle: groupeNom,
          nom_circo: String(d.nom_circo ?? "").slice(0, 150),
          num_deptmt: String(d.num_deptmt ?? "").replace(/[^0-9A-Z]/g, ""),
          num_circo: parseInt(String(d.num_circo ?? "0"), 10) || 0,
          sexe: d.sexe === "F" ? "F" : "H",
          url_an: String(d.url_an ?? "").slice(0, 300),
          photo: `https://www.nosdeputes.fr/depute/photo/${slug}/220`,
        });
      }
      return out.sort((a, b) =>
        a.nom_de_famille.localeCompare(b.nom_de_famille, "fr"),
      );
    } catch (e) {
      clearTimeout(t);
      throw e;
    }
  },
);

export type Scrutin16 = {
  numero: string;
  date: string;
  titre: string;
  sort: string;
  isAdopte: boolean;
  nombre_pours: string;
  nombre_contres: string;
  nombre_abstentions: string;
};

export const getScrutins16 = createServerFn({ method: "GET" }).handler(
  async (): Promise<Scrutin16[]> => {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 30_000);
    try {
      const r = await fetch("https://www.nosdeputes.fr/16/scrutins/json", {
        signal: ctrl.signal,
        headers: { Accept: "application/json" },
      });
      clearTimeout(t);
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const data: any = await r.json();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const list: any[] = data?.scrutins ?? [];
      const out: Scrutin16[] = [];
      for (const x of list) {
        const s = x?.scrutin ?? x;
        if (!s) continue;
        const sortRaw = String(s.sort ?? "");
        const isAdopte = /adopt/i.test(sortRaw) && !/non/i.test(sortRaw);
        out.push({
          numero: String(s.numero ?? ""),
          date: String(s.date ?? ""),
          titre: String(s.titre ?? s.objet ?? `Scrutin n°${s.numero}`),
          sort: isAdopte ? "adopté" : "rejeté",
          isAdopte,
          nombre_pours: String(s.nombre_pours ?? "0"),
          nombre_contres: String(s.nombre_contres ?? "0"),
          nombre_abstentions: String(s.nombre_abstentions ?? "0"),
        });
      }
      return out.sort((a, b) => b.date.localeCompare(a.date));
    } catch (e) {
      clearTimeout(t);
      throw e;
    }
  },
);
