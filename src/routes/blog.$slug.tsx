import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { Calendar, Clock, ArrowLeft } from "lucide-react";
import { getPostBySlug, getAllPosts, type BlogPost } from "@/lib/blog";
import { createSeoMeta, SITE_URL } from "./__root";

export const Route = createFileRoute("/blog/$slug")({
  loader: ({ params }) => {
    const post = getPostBySlug(params.slug);
    if (!post) throw notFound();
    return { post };
  },
  head: ({ loaderData }) => {
    const post = loaderData?.post;
    if (!post) return { meta: [] };
    const url = `${SITE_URL}/blog/${post.slug}`;
    return {
      meta: createSeoMeta({
        title: `${post.title} — Blog Mandat`,
        description: post.description,
        canonical: url,
        ogType: "article",
        publishedTime: post.date,
      }),
      links: [{ rel: "canonical", href: url }],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Article",
            headline: post.title,
            description: post.description,
            datePublished: post.date,
            author: { "@type": "Organization", name: post.author },
            publisher: { "@type": "Organization", name: "Mandat" },
            mainEntityOfPage: url,
          }),
        },
      ],
    };
  },
  component: BlogPostPage,
  notFoundComponent: () => (
    <div className="container-app py-24 text-center">
      <h1 className="font-display text-4xl mb-3">Article introuvable</h1>
      <Link to="/blog" className="text-primary underline">
        Retour au blog
      </Link>
    </div>
  ),
});

function renderContent(md: string) {
  const blocks = md.split(/\n\n+/);
  return blocks.map((b, i) => {
    if (b.startsWith("## ")) {
      return (
        <h2
          key={i}
          className="font-display text-2xl md:text-3xl font-medium tracking-tight mt-12 mb-4 text-ink"
        >
          {b.replace(/^##\s+/, "")}
        </h2>
      );
    }
    if (b.startsWith("- ")) {
      const items = b.split("\n").map((l) => l.replace(/^-\s+/, ""));
      return (
        <ul key={i} className="my-5 space-y-2 list-disc pl-6 text-ink/90">
          {items.map((it, j) => (
            <li
              key={j}
              dangerouslySetInnerHTML={{
                __html: it.replace(
                  /\*\*(.+?)\*\*/g,
                  '<strong class="text-ink">$1</strong>',
                ),
              }}
            />
          ))}
        </ul>
      );
    }
    return (
      <p
        key={i}
        className="my-5 text-lg leading-relaxed text-ink/85"
        dangerouslySetInnerHTML={{
          __html: b
            .replace(
              /\[([^\]]+)\]\(([^)]+)\)/g,
              '<a href="$2" class="text-primary underline underline-offset-4 hover:opacity-80">$1</a>',
            )
            .replace(
              /\*\*(.+?)\*\*/g,
              '<strong class="text-ink font-medium">$1</strong>',
            ),
        }}
      />
    );
  });
}

function BlogPostPage() {
  const { post } = Route.useLoaderData() as { post: BlogPost };
  const related = getAllPosts()
    .filter((p) => p.slug !== post.slug)
    .slice(0, 3);

  return (
    <article className="container-app py-16 max-w-3xl">
      <Link
        to="/blog"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors mb-8"
      >
        <ArrowLeft className="w-4 h-4" aria-hidden /> Tous les articles
      </Link>

      <header className="mb-10 animate-fade-up">
        <div className="flex flex-wrap gap-2 mb-4">
          {post.tags.map((t) => (
            <span
              key={t}
              className="text-[11px] uppercase tracking-wider px-2.5 py-1 rounded-full bg-primary/10 text-primary font-medium"
            >
              {t}
            </span>
          ))}
        </div>
        <h1 className="font-display text-4xl md:text-5xl font-medium tracking-tight text-ink mb-4">
          {post.title}
        </h1>
        <p className="text-xl text-muted-foreground mb-5">{post.description}</p>
        <div className="flex items-center gap-5 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <Calendar className="w-4 h-4" aria-hidden />
            {new Date(post.date).toLocaleDateString("fr-FR", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Clock className="w-4 h-4" aria-hidden />
            {post.readingMinutes} min de lecture
          </span>
        </div>
      </header>

      <div className="prose-content">{renderContent(post.content)}</div>

      {related.length > 0 && (
        <section className="mt-20 pt-10 border-t border-border/60">
          <h2 className="font-display text-2xl font-medium tracking-tight mb-6">
            À lire ensuite
          </h2>
          <div className="grid gap-4">
            {related.map((p) => (
              <Link
                key={p.slug}
                to="/blog/$slug"
                params={{ slug: p.slug }}
                className="glass rounded-2xl p-5 border border-border/60 hover:border-primary/50 transition-all"
              >
                <h3 className="font-display text-lg font-medium text-ink mb-1">
                  {p.title}
                </h3>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {p.description}
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}
    </article>
  );
}
