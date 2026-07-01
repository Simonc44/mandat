import { createFileRoute, Link } from "@tanstack/react-router";
import { Calendar, Clock, ArrowRight } from "lucide-react";
import { getAllPosts } from "@/lib/blog";
import { createSeoMeta, SITE_URL } from "./__root";

export const Route = createFileRoute("/blog/")({
  head: () => ({
    meta: createSeoMeta({
      title: "Blog Mandat — Comprendre l'Assemblée nationale",
      description:
        "Guides, analyses et méthodologie sur les votes des députés, la 17e législature et l'open data parlementaire. Sans étiquette politique.",
      canonical: `${SITE_URL}/blog`,
    }),
    links: [{ rel: "canonical", href: `${SITE_URL}/blog` }],
  }),
  component: BlogIndex,
});

function BlogIndex() {
  const posts = getAllPosts();
  return (
    <div className="container-app py-16 max-w-4xl">
      <header className="mb-14 animate-fade-up">
        <p className="text-xs uppercase tracking-[0.24em] text-primary/80 mb-3">
          Le journal de Mandat
        </p>
        <h1 className="font-display text-5xl md:text-6xl font-medium tracking-tight mb-5 text-ink">
          Comprendre l'Assemblée, autrement.
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl">
          Décryptages, méthodes et coulisses de la fabrique de la loi.
          Un article, une idée claire — sans jargon, sans parti pris.
        </p>
      </header>

      <div className="grid gap-6">
        {posts.map((post, i) => (
          <Link
            key={post.slug}
            to="/blog/$slug"
            params={{ slug: post.slug }}
            className="group glass rounded-3xl p-8 border border-border/60 hover:border-primary/50 hover:shadow-lg transition-all animate-fade-up"
            style={{ animationDelay: `${i * 60}ms` }}
          >
            <div className="flex flex-wrap gap-2 mb-3">
              {post.tags.map((t) => (
                <span
                  key={t}
                  className="text-[11px] uppercase tracking-wider px-2.5 py-1 rounded-full bg-primary/10 text-primary font-medium"
                >
                  {t}
                </span>
              ))}
            </div>
            <h2 className="font-display text-2xl md:text-3xl font-medium tracking-tight text-ink group-hover:text-primary transition-colors mb-2">
              {post.title}
            </h2>
            <p className="text-muted-foreground mb-4">{post.description}</p>
            <div className="flex items-center gap-5 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" aria-hidden />
                {new Date(post.date).toLocaleDateString("fr-FR", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" aria-hidden />
                {post.readingMinutes} min
              </span>
              <span className="inline-flex items-center gap-1.5 text-primary font-medium ml-auto">
                Lire <ArrowRight className="w-3.5 h-3.5" aria-hidden />
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
