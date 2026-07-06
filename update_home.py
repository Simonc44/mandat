import sys

with open('src/routes/index.tsx', 'r') as f:
    lines = f.readlines()

new_lines = []
skip = 0
for i, line in enumerate(lines):
    if skip > 0:
        skip -= 1
        continue

    # 1. Imports
    if 'import { StoryReveal }' in line:
        new_lines.append(line)
        new_lines.append('import { getAllPosts, type BlogPost } from "@/lib/blog";\n')
        continue

    # 2. Loader
    if 'loader: async () => {' in line:
        new_lines.append(line)
        new_lines.append('    const [stats, latest] = await Promise.all([\n')
        new_lines.append('      getHomeStats(),\n')
        new_lines.append('      getLatestScrutins(),\n')
        new_lines.append('    ]);\n')
        new_lines.append('    const posts = getAllPosts();\n')
        new_lines.append('    return { stats, latest, latestPost: posts[0] || null };\n')
        new_lines.append('  },\n')
        # Skip original loader lines
        for j in range(i+1, i+10):
            if '},' in lines[j]:
                skip = j - i
                break
        continue

    # 3. Home signature
    if 'function Home() {' in line:
        new_lines.append('function Home() {\n')
        new_lines.append('  const { stats, latest, latestPost } = Route.useLoaderData() as {\n')
        new_lines.append('    stats: HomeStats;\n')
        new_lines.append('    latest: Scrutin[];\n')
        new_lines.append('    latestPost: BlogPost | null;\n')
        new_lines.append('  };\n')
        # Skip original signature
        for j in range(i+1, i+10):
            if '};' in lines[j]:
                skip = j - i
                break
        continue

    # 4. Hero cleanup
    if 'Sur n\'importe quel texte de loi, en quelques secondes.{" "}' in line:
        new_lines.append('            Sur n\'importe quel texte de loi, en quelques secondes. Sans\n')
        new_lines.append('            étiquette politique.\n')
        # Skip until </p>
        for j in range(i+1, i+20):
            if '</p>' in lines[j]:
                skip = j - i
                break
        continue

    # 5. StatPill usage block replacement
    if '<StoryReveal as="section" className="container-app pb-16">' in line:
        # Check if it's the one with StatPill
        is_statpill = False
        for j in range(i, i+10):
            if 'StatPill' in lines[j]:
                is_statpill = True
                break
        if is_statpill:
            new_lines.append('      <StatsSection stats={stats} />\n')
            new_lines.append('      <LatestBlogSection post={latestPost} />\n')
            new_lines.append('      <SimulatorCTASection />\n')
            # Skip until </StoryReveal>
            for j in range(i+1, i+30):
                if '</StoryReveal>' in lines[j]:
                    skip = j - i
                    break
            continue

    # 6. TursoIcon
    if 'function TursoIcon()' in line:
        new_lines.append('function TursoIcon() {\n')
        new_lines.append('  return (\n')
        new_lines.append('    <svg\n')
        new_lines.append('      width="20"\n')
        new_lines.append('      height="20"\n')
        new_lines.append('      viewBox="0 0 201 170"\n')
        new_lines.append('      fill="currentColor"\n')
        new_lines.append('      xmlns="http://www.w3.org/2000/svg"\n')
        new_lines.append('      aria-hidden="true"\n')
        new_lines.append('    >\n')
        new_lines.append('      <path d="M200.035 48.61C195.365 20.67 170.875 0 170.875 0V30.78L156.335 34.53L147.225 23.56L142.415 33.02C132.495 30.32 118.835 28.58 100.045 28.58C81.2549 28.58 67.5949 30.33 57.6749 33.02L52.8649 23.56L43.7549 34.53L29.2149 30.78V0C29.2149 0 4.72493 20.67 0.0549316 48.61L32.1949 59.73C33.2449 79.16 41.9849 131.61 44.4849 136.37C47.1449 141.44 61.2649 155.93 72.3149 161.5C72.3149 161.5 76.3149 157.27 78.7549 153.54C81.8549 157.19 97.8649 169.99 100.055 169.99C102.245 169.99 118.255 157.2 121.355 153.54C123.795 157.27 127.795 161.5 127.795 161.5C138.845 155.93 152.965 141.44 155.625 136.37C158.125 131.61 166.865 79.16 167.915 59.73L200.055 48.61H200.035ZM153.845 93.35L132.095 95.29L134.005 121.96C134.005 121.96 120.775 132.91 100.045 132.91C79.3149 132.91 66.0849 121.96 66.0849 121.96L67.9949 95.29L46.2449 93.35L42.5249 63.31L78.5749 75.79L75.7749 113.18C82.4749 114.88 89.5249 116.57 100.055 116.57C110.585 116.57 117.625 114.88 124.325 113.18L121.525 75.79L157.575 63.31L153.855 93.35H153.845Z" />\n')
        new_lines.append('    </svg>\n')
        new_lines.append('  );\n')
        new_lines.append('}\n')
        # Skip until end of function
        for j in range(i+1, i+50):
            if '}' in lines[j] and j > i + 5:
                skip = j - i
                break
        continue

    # 7. Helper components insertion
    if 'function StatPill' in line:
        new_lines.append('\nfunction Counter({ value }: { value: number }) {\n')
        new_lines.append('  const ref = useRef<HTMLSpanElement>(null);\n')
        new_lines.append('  const [displayValue, setDisplayValue] = useState(0);\n')
        new_lines.append('\n  useEffect(() => {\n')
        new_lines.append('    if (typeof window === "undefined") return;\n')
        new_lines.append('    const el = ref.current;\n')
        new_lines.append('    if (!el) return;\n')
        new_lines.append('\n    (async () => {\n')
        new_lines.append('      const gsapMod = await import("gsap");\n')
        new_lines.append('      const stMod = await import("gsap/ScrollTrigger");\n')
        new_lines.append('      const gsap = gsapMod.default;\n')
        new_lines.append('      const ScrollTrigger = stMod.ScrollTrigger;\n')
        new_lines.append('      gsap.registerPlugin(ScrollTrigger);\n')
        new_lines.append('\n      const obj = { val: 0 };\n')
        new_lines.append('      ScrollTrigger.create({\n')
        new_lines.append('        trigger: el,\n')
        new_lines.append('        start: "top 90%",\n')
        new_lines.append('        onEnter: () => {\n')
        new_lines.append('          gsap.to(obj, {\n')
        new_lines.append('            val: value,\n')
        new_lines.append('            duration: 2,\n')
        new_lines.append('            ease: "power2.out",\n')
        new_lines.append('            onUpdate: () => setDisplayValue(Math.floor(obj.val)),\n')
        new_lines.append('          });\n')
        new_lines.append('        },\n')
        new_lines.append('        once: true,\n')
        new_lines.append('      });\n')
        new_lines.append('    })();\n')
        new_lines.append('  }, [value]);\n')
        new_lines.append('\n  return <span ref={ref}>{displayValue.toLocaleString("fr-FR")}</span>;\n')
        new_lines.append('}\n')
        new_lines.append('\nfunction StatsSection({ stats }: { stats: HomeStats }) {\n')
        new_lines.append('  return (\n')
        new_lines.append('    <section className="relative z-10 my-20 px-4">\n')
        new_lines.append('      <div className="container-app">\n')
        new_lines.append('        <ScrollScene variant="tilt" className="grid grid-cols-1 md:grid-cols-3 gap-6">\n')
        new_lines.append('          <div data-tilt className="stat-box card-glass rounded-[2.5rem] p-10 text-center flex flex-col items-center justify-center min-h-[220px]">\n')
        new_lines.append('            <div className="stat-value font-display text-6xl md:text-7xl mb-3 tracking-tighter text-foreground">\n')
        new_lines.append('              <Counter value={stats.deputesCount} />\n')
        new_lines.append('            </div>\n')
        new_lines.append('            <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-semibold">Député·es</div>\n')
        new_lines.append('          </div>\n')
        new_lines.append('          <div data-tilt className="stat-box card-glass rounded-[2.5rem] p-10 text-center flex flex-col items-center justify-center min-h-[220px]">\n')
        new_lines.append('            <div className="stat-value font-display text-6xl md:text-7xl mb-3 tracking-tighter text-foreground">\n')
        new_lines.append('              <Counter value={stats.scrutinsCount} />\n')
        new_lines.append('            </div>\n')
        new_lines.append('            <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-semibold">Scrutins</div>\n')
        new_lines.append('          </div>\n')
        new_lines.append('          <div data-tilt className="stat-box card-glass rounded-[2.5rem] p-10 text-center flex flex-col items-center justify-center min-h-[220px]">\n')
        new_lines.append('            <div className="stat-value font-display text-6xl md:text-7xl mb-3 tracking-tighter text-foreground">\n')
        new_lines.append('              <Counter value={stats.groupesCount} />\n')
        new_lines.append('            </div>\n')
        new_lines.append('            <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-semibold">Groupes</div>\n')
        new_lines.append('          </div>\n')
        new_lines.append('        </ScrollScene>\n')
        new_lines.append('      </div>\n')
        new_lines.append('    </section>\n')
        new_lines.append('  );\n')
        new_lines.append('}\n')
        new_lines.append('\nfunction LatestBlogSection({ post }: { post: BlogPost | null }) {\n')
        new_lines.append('  if (!post) return null;\n')
        new_lines.append('  return (\n')
        new_lines.append('    <section className="py-20 border-t border-border/40">\n')
        new_lines.append('      <div className="container-app">\n')
        new_lines.append('        <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">\n')
        new_lines.append('          <div>\n')
        new_lines.append('            <div className="text-xs uppercase tracking-[0.18em] text-primary/80 mb-3 font-medium">Dernier blog posté</div>\n')
        new_lines.append('            <h2 className="font-display text-3xl md:text-5xl leading-[1.05]">Nos décryptages <span className="text-gradient italic">politiques</span></h2>\n')
        new_lines.append('          </div>\n')
        new_lines.append('          <Link to="/blog" className="text-sm font-medium text-primary hover:underline pb-1">Voir tous les articles →</Link>\n')
        new_lines.append('        </div>\n')
        new_lines.append('\n        <Link to="/blog/$slug" params={{ slug: post.slug }} className="group block card-glass rounded-[2.5rem] p-8 md:p-12 hover:border-primary/40 transition-colors">\n')
        new_lines.append('          <div className="flex flex-col md:flex-row gap-8 md:items-center">\n')
        new_lines.append('            <div className="flex-1">\n')
        new_lines.append('              <div className="flex items-center gap-3 text-xs text-muted-foreground mb-4">\n')
        new_lines.append('                <time dateTime={post.date}>{new Date(post.date).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}</time>\n')
        new_lines.append('                <span>·</span>\n')
        new_lines.append('                <span>{post.readingMinutes} min de lecture</span>\n')
        new_lines.append('              </div>\n')
        new_lines.append('              <h3 className="font-display text-2xl md:text-4xl mb-4 group-hover:text-primary transition-colors">{post.title}</h3>\n')
        new_lines.append('              <p className="text-muted-foreground line-clamp-2 text-lg md:text-xl leading-relaxed">{post.description}</p>\n')
        new_lines.append('            </div>\n')
        new_lines.append('            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">\n')
        new_lines.append('              <svg className="w-6 h-6 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">\n')
        new_lines.append('                <path d="M5 12h14M12 5l7 7-7 7" />\n')
        new_lines.append('              </svg>\n')
        new_lines.append('            </div>\n')
        new_lines.append('          </div>\n')
        new_lines.append('        </Link>\n')
        new_lines.append('      </div>\n')
        new_lines.append('    </section>\n')
        new_lines.append('  );\n')
        new_lines.append('}\n')
        new_lines.append('\nfunction SimulatorCTASection() {\n')
        new_lines.append('  return (\n')
        new_lines.append('    <section className="py-24 bg-primary/5 border-y border-primary/10 overflow-hidden relative">\n')
        new_lines.append('      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] opacity-20 pointer-events-none" style={{ background: "radial-gradient(circle, var(--color-primary), transparent 70%)", filter: "blur(120px)" }} />\n')
        new_lines.append('      <div className="container-app relative z-10">\n')
        new_lines.append('        <div className="max-w-4xl mx-auto text-center">\n')
        new_lines.append('          <h2 className="font-display text-4xl md:text-6xl mb-8 leading-[1.1] tracking-tight">Visualisez les <span className="text-gradient italic">coalitions</span> possibles</h2>\n')
        new_lines.append('          <p className="text-lg md:text-xl text-muted-foreground mb-12 leading-relaxed">Utilisez notre outil de Simulateur de coalition pour mieux comprendre où sont vos députés et comment se structure l\'Assemblée.</p>\n')
        new_lines.append('          <Link to="/groupes" className="btn-primary px-10 py-5 rounded-full text-lg font-semibold inline-flex items-center gap-3 shadow-2xl shadow-primary/20 hover:scale-105 transition-transform">\n')
        new_lines.append('            Lancer le simulateur\n')
        new_lines.append('            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">\n')
        new_lines.append('              <path d="M5 12h14M12 5l7 7-7 7" />\n')
        new_lines.append('            </svg>\n')
        new_lines.append('          </Link>\n')
        new_lines.append('        </div>\n')
        new_lines.append('      </div>\n')
        new_lines.append('    </section>\n')
        new_lines.append('  );\n')
        new_lines.append('}\n')
        new_lines.append(line)
        continue

    new_lines.append(line)

with open('src/routes/index.tsx', 'w') as f:
    f.writelines(new_lines)
