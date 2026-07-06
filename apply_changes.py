import re

with open('src/routes/index.tsx', 'r') as f:
    content = f.read()

diffs = [
    (r'import { StoryReveal } from "@/components/StoryReveal";\nimport { Unlock, Scale, ShieldCheck } from "lucide-react";',
     'import { StoryReveal } from "@/components/StoryReveal";\nimport { getAllPosts, type BlogPost } from "@/lib/blog";\nimport { Unlock, Scale, ShieldCheck } from "lucide-react";'),

    (r'loader: async \(\) => \{\n    const \[stats, latest\] = await Promise\.all\(\[\n      getHomeStats\(\),\n      getLatestScrutins\(\),\n    \]\);\n    return \{ stats, latest \};\n  \},',
     'loader: async () => {\n    const [stats, latest] = await Promise.all([\n      getHomeStats(),\n      getLatestScrutins(),\n    ]);\n    const posts = getAllPosts();\n    return { stats, latest, latestPost: posts[0] || null };\n  },'),

    (r'function Home\(\) \{\n  const \{ stats, latest \} = Route\.useLoaderData\(\) as \{\n    stats: HomeStats;\n    latest: Scrutin\[\];\n  \};',
     'function Home() {\n  const { stats, latest, latestPost } = Route.useLoaderData() as {\n    stats: HomeStats;\n    latest: Scrutin[];\n    latestPost: BlogPost | null;\n  };'),

    (r'<StoryReveal as="section" className="container-app pb-16">.*?</StoryReveal>',
     '<StatsSection stats={stats} />\n      <LatestBlogSection post={latestPost} />\n      <SimulatorCTASection />'),
]

for pattern, replacement in diffs:
    content = re.sub(pattern, replacement, content, flags=re.DOTALL)

# Hero cleanup
hero_old = """          <p
            className="mx-auto max-w-2xl text-base sm:text-lg text-muted-foreground mb-10 leading-relaxed animate-fade-up px-2"
            style={{ animationDelay: "160ms" }}
          >
            Sur n'importe quel texte de loi, en quelques secondes.{" "}
            <strong className="text-foreground">
              {stats.scrutinsCount.toLocaleString("fr-FR")} scrutins
            </strong>{" "}
            et{" "}
            <strong className="text-foreground">
              {stats.deputesCount.toLocaleString("fr-FR")} député·es
            </strong>{" "}
            — sans étiquette politique.
          </p>"""
hero_new = """          <p
            className="mx-auto max-w-2xl text-base sm:text-lg text-muted-foreground mb-10 leading-relaxed animate-fade-up px-2"
            style={{ animationDelay: "160ms" }}
          >
            Sur n'importe quel texte de loi, en quelques secondes. Sans
            étiquette politique.
          </p>"""
content = content.replace(hero_old, hero_new)

# TursoIcon and Helpers
helpers = """
function Counter({ value }: { value: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const el = ref.current;
    if (!el) return;

    (async () => {
      const gsapMod = await import("gsap");
      const stMod = await import("gsap/ScrollTrigger");
      const gsap = gsapMod.default;
      const ScrollTrigger = stMod.ScrollTrigger;
      gsap.registerPlugin(ScrollTrigger);

      const obj = { val: 0 };
      ScrollTrigger.create({
        trigger: el,
        start: "top 90%",
        onEnter: () => {
          gsap.to(obj, {
            val: value,
            duration: 2,
            ease: "power2.out",
            onUpdate: () => setDisplayValue(Math.floor(obj.val)),
          });
        },
        once: true,
      });
    })();
  }, [value]);

  return <span ref={ref}>{displayValue.toLocaleString("fr-FR")}</span>;
}

function StatsSection({ stats }: { stats: HomeStats }) {
  return (
    <section className="relative z-10 my-20 px-4">
      <div className="container-app">
        <ScrollScene
          variant="tilt"
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          <div
            data-tilt
            className="stat-box card-glass rounded-[2.5rem] p-10 text-center flex flex-col items-center justify-center min-h-[220px]"
          >
            <div className="stat-value font-display text-6xl md:text-7xl mb-3 tracking-tighter text-foreground">
              <Counter value={stats.deputesCount} />
            </div>
            <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-semibold">
              Député·es
            </div>
          </div>
          <div
            data-tilt
            className="stat-box card-glass rounded-[2.5rem] p-10 text-center flex flex-col items-center justify-center min-h-[220px]"
          >
            <div className="stat-value font-display text-6xl md:text-7xl mb-3 tracking-tighter text-foreground">
              <Counter value={stats.scrutinsCount} />
            </div>
            <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-semibold">
              Scrutins
            </div>
          </div>
          <div
            data-tilt
            className="stat-box card-glass rounded-[2.5rem] p-10 text-center flex flex-col items-center justify-center min-h-[220px]"
          >
            <div className="stat-value font-display text-6xl md:text-7xl mb-3 tracking-tighter text-foreground">
              <Counter value={stats.groupesCount} />
            </div>
            <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-semibold">
              Groupes
            </div>
          </div>
        </ScrollScene>
      </div>
    </section>
  );
}

function LatestBlogSection({ post }: { post: BlogPost | null }) {
  if (!post) return null;
  return (
    <section className="py-20 border-t border-border/40">
      <div className="container-app">
        <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
          <div>
            <div className="text-xs uppercase tracking-[0.18em] text-primary/80 mb-3 font-medium">
              Dernier blog posté
            </div>
            <h2 className="font-display text-3xl md:text-5xl leading-[1.05]">
              Nos décryptages <span className="text-gradient italic">politiques</span>
            </h2>
          </div>
          <Link
            to="/blog"
            className="text-sm font-medium text-primary hover:underline pb-1"
          >
            Voir tous les articles →
          </Link>
        </div>

        <Link
          to="/blog/$slug"
          params={{ slug: post.slug }}
          className="group block card-glass rounded-[2.5rem] p-8 md:p-12 hover:border-primary/40 transition-colors"
        >
          <div className="flex flex-col md:flex-row gap-8 md:items-center">
            <div className="flex-1">
              <div className="flex items-center gap-3 text-xs text-muted-foreground mb-4">
                <time dateTime={post.date}>
                  {new Date(post.date).toLocaleDateString("fr-FR", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </time>
                <span>·</span>
                <span>{post.readingMinutes} min de lecture</span>
              </div>
              <h3 className="font-display text-2xl md:text-4xl mb-4 group-hover:text-primary transition-colors">
                {post.title}
              </h3>
              <p className="text-muted-foreground line-clamp-2 text-lg md:text-xl leading-relaxed">
                {post.description}
              </p>
            </div>
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
              <svg
                className="w-6 h-6 text-primary"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        </Link>
      </div>
    </section>
  );
}

function SimulatorCTASection() {
  return (
    <section className="py-24 bg-primary/5 border-y border-primary/10 overflow-hidden relative">
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] opacity-20 pointer-events-none"
        style={{
          background:
            "radial-gradient(circle, var(--color-primary), transparent 70%)",
          filter: "blur(120px)",
        }}
      />

      <div className="container-app relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="font-display text-4xl md:text-6xl mb-8 leading-[1.1] tracking-tight">
            Visualisez les <span className="text-gradient italic">coalitions</span> possibles
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground mb-12 leading-relaxed">
            Utilisez notre outil de Simulateur de coalition pour mieux comprendre où sont vos députés et comment se structure l'Assemblée.
          </p>
          <Link
            to="/groupes"
            className="btn-primary px-10 py-5 rounded-full text-lg font-semibold inline-flex items-center gap-3 shadow-2xl shadow-primary/20 hover:scale-105 transition-transform"
          >
            Lancer le simulateur
            <svg
              className="w-5 h-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
}

function TursoIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 201 170"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path d="M200.035 48.61C195.365 20.67 170.875 0 170.875 0V30.78L156.335 34.53L147.225 23.56L142.415 33.02C132.495 30.32 118.835 28.58 100.045 28.58C81.2549 28.58 67.5949 30.33 57.6749 33.02L52.8649 23.56L43.7549 34.53L29.2149 30.78V0C29.2149 0 4.72493 20.67 0.0549316 48.61L32.1949 59.73C33.2449 79.16 41.9849 131.61 44.4849 136.37C47.1449 141.44 61.2649 155.93 72.3149 161.5C72.3149 161.5 76.3149 157.27 78.7549 153.54C81.8549 157.19 97.8649 169.99 100.055 169.99C102.245 169.99 118.255 157.2 121.355 153.54C123.795 157.27 127.795 161.5 127.795 161.5C138.845 155.93 152.965 141.44 155.625 136.37C158.125 131.61 166.865 79.16 167.915 59.73L200.055 48.61H200.035ZM153.845 93.35L132.095 95.29L134.005 121.96C134.005 121.96 120.775 132.91 100.045 132.91C79.3149 132.91 66.0849 121.96 66.0849 121.96L67.9949 95.29L46.2449 93.35L42.5249 63.31L78.5749 75.79L75.7749 113.18C82.4749 114.88 89.5249 116.57 100.055 116.57C110.585 116.57 117.625 114.88 124.325 113.18L121.525 75.79L157.575 63.31L153.855 93.35H153.845Z" />
    </svg>
  );
}"""

turso_old_pattern = re.compile(r'function TursoIcon\(\) \{.*?\}', re.DOTALL)
content = turso_old_pattern.sub(helpers, content)

with open('src/routes/index.tsx', 'w') as f:
    f.write(content)
