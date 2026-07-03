import { useRef } from 'react'
import { motion, useInView, useScroll, useTransform } from 'framer-motion'
import './twist.css'

// ─── Animation variants (UI/UX Pro Max: spring-physics, stagger-sequence, exit-faster-than-enter) ───
const fadeUp = {
  hidden: { opacity: 0, y: 32 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.08,
      duration: 0.55,
      ease: [0.22, 1, 0.36, 1],
    },
  }),
}

const staggerContainer = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.1, delayChildren: 0.2 },
  },
}

const cardVariant = {
  hidden: { opacity: 0, y: 40, scale: 0.97 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
  },
}

// ─── Feature data ───────────────────────────────────────────────────────────
const FEATURES = [
  {
    icon: (
      <svg width="28" height="28" fill="none" viewBox="0 0 28 28" aria-hidden="true">
        <path d="M14 3C8 3 3 8 3 14s5 11 11 11 11-5 11-11S20 3 14 3Z" stroke="#7C3AED" strokeWidth="2" strokeLinecap="round" />
        <path d="M9 14l3.5 3.5L19 10" stroke="#06B6D4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    title: 'Scripts de closing qui convertissent',
    description:
      'Des scripts adaptatifs alimentés par l'IA qui s'ajustent en temps réel au profil de votre prospect. Fini les objections sans réponse.',
    tag: 'IA Adaptative',
  },
  {
    icon: (
      <svg width="28" height="28" fill="none" viewBox="0 0 28 28" aria-hidden="true">
        <rect x="3" y="6" width="22" height="16" rx="3" stroke="#7C3AED" strokeWidth="2" />
        <path d="M3 11h22" stroke="#06B6D4" strokeWidth="2" />
        <circle cx="8" cy="17" r="1.5" fill="#7C3AED" />
        <circle cx="14" cy="17" r="1.5" fill="#7C3AED" />
      </svg>
    ),
    title: 'Pipeline visuel en temps réel',
    description:
      'Visualisez chaque deal à chaque étape. Identifiez les blocages avant qu'ils ne coûtent du chiffre. Votre équipe, synchronisée au millimètre.',
    tag: 'Pipeline CRM',
  },
  {
    icon: (
      <svg width="28" height="28" fill="none" viewBox="0 0 28 28" aria-hidden="true">
        <path d="M5 22l4-8 5 4 4-9 5 5" stroke="#7C3AED" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="23" cy="5" r="2" fill="#06B6D4" />
      </svg>
    ),
    title: 'Analytics de performance closing',
    description:
      'Taux de conversion par closer, par script, par heure. Des insights granulaires pour former, motiver et démultiplier vos résultats.',
    tag: 'Analytics',
  },
]

// ─── Sub-components ──────────────────────────────────────────────────────────
function AnimatedOrb({ className }: { className: string }) {
  return <div className={`twist-orb ${className}`} aria-hidden="true" />
}

function FeatureCard({
  feature,
  index,
}: {
  feature: (typeof FEATURES)[0]
  index: number
}) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })

  return (
    <motion.div
      ref={ref}
      variants={cardVariant}
      initial="hidden"
      animate={inView ? 'visible' : 'hidden'}
      custom={index}
      className="twist-feature-card"
      whileHover={{
        y: -6,
        transition: { duration: 0.25, ease: [0.22, 1, 0.36, 1] },
      }}
      role="article"
    >
      <div className="twist-feature-icon">{feature.icon}</div>
      <span className="twist-feature-tag">{feature.tag}</span>
      <h3 className="twist-feature-title">{feature.title}</h3>
      <p className="twist-feature-desc">{feature.description}</p>
    </motion.div>
  )
}

function HeroSection() {
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] })
  const y = useTransform(scrollYProgress, [0, 1], ['0%', '18%'])
  const opacity = useTransform(scrollYProgress, [0, 0.7], [1, 0])

  return (
    <section className="twist-hero" ref={ref} aria-label="Section héro Twist">
      {/* Mesh gradient background */}
      <div className="twist-hero-bg" aria-hidden="true">
        <AnimatedOrb className="twist-orb--violet" />
        <AnimatedOrb className="twist-orb--cyan" />
        <AnimatedOrb className="twist-orb--indigo" />
        <div className="twist-noise" />
      </div>

      <motion.div className="twist-hero-content" style={{ y, opacity }}>
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="twist-hero-inner"
        >
          <motion.span variants={fadeUp} className="twist-eyebrow">
            Le SaaS de closing nouvelle génération
          </motion.span>

          <motion.h1 variants={fadeUp} className="twist-hero-title">
            Fermez plus de deals.
            <br />
            <span className="twist-title-accent">Twist</span> le jeu.
          </motion.h1>

          <motion.p variants={fadeUp} className="twist-hero-sub">
            Twist unifie vos scripts, votre pipeline et vos analytics dans un outil
            conçu pour les closers qui ne laissent rien sur la table.
          </motion.p>

          <motion.div variants={fadeUp} className="twist-hero-ctas">
            <a
              href="#cta"
              className="twist-btn-primary"
              aria-label="Démarrer avec Twist gratuitement"
            >
              Démarrer gratuitement
              <svg width="16" height="16" fill="none" viewBox="0 0 16 16" aria-hidden="true">
                <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </a>
            <a href="#features" className="twist-btn-ghost">
              Voir les fonctionnalités
            </a>
          </motion.div>

          <motion.div variants={fadeUp} className="twist-social-proof">
            <div className="twist-avatars" aria-hidden="true">
              {['V', 'M', 'S', 'A'].map((l, i) => (
                <div key={i} className="twist-avatar" style={{ '--i': i } as React.CSSProperties}>{l}</div>
              ))}
            </div>
            <p>
              <strong>+240 closers</strong> ont rejoint Twist ce mois-ci
            </p>
          </motion.div>
        </motion.div>

        {/* Glass dashboard preview card */}
        <motion.div
          initial={{ opacity: 0, y: 48, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 0.55, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="twist-hero-card"
          aria-label="Aperçu du dashboard Twist"
        >
          <div className="twist-card-header">
            <span className="twist-card-dot" style={{ background: '#ff5f57' }} />
            <span className="twist-card-dot" style={{ background: '#febc2e' }} />
            <span className="twist-card-dot" style={{ background: '#28c840' }} />
            <span className="twist-card-title">Twist · Dashboard</span>
          </div>
          <div className="twist-card-body">
            <div className="twist-card-stat">
              <span className="twist-card-stat-value">87<span>%</span></span>
              <span className="twist-card-stat-label">Taux de closing</span>
              <span className="twist-card-badge twist-card-badge--up">+12% ce mois</span>
            </div>
            <div className="twist-card-bars">
              {[65, 80, 55, 90, 75, 95, 70].map((h, i) => (
                <motion.div
                  key={i}
                  className="twist-card-bar"
                  style={{ height: `${h * 0.7}px` }}
                  initial={{ scaleY: 0 }}
                  animate={{ scaleY: 1 }}
                  transition={{ delay: 0.8 + i * 0.07, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                />
              ))}
            </div>
            <div className="twist-card-pipeline">
              {['Prospection', 'Démo', 'Négociation', 'Closed'].map((s, i) => (
                <div key={i} className="twist-pipeline-step">
                  <div className="twist-pipeline-dot" style={{ '--active': i < 3 ? 1 : 0 } as React.CSSProperties} />
                  <span>{s}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </motion.div>

      <div className="twist-hero-scroll" aria-hidden="true">
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ repeat: Infinity, duration: 1.6, ease: 'easeInOut' }}
        >
          <svg width="20" height="20" fill="none" viewBox="0 0 20 20">
            <path d="M10 4v12M6 12l4 4 4-4" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </motion.div>
      </div>
    </section>
  )
}

function FeaturesSection() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <section id="features" className="twist-features" aria-labelledby="features-heading">
      <div className="twist-container">
        <motion.div
          ref={ref}
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
          variants={staggerContainer}
          className="twist-section-header"
        >
          <motion.span variants={fadeUp} className="twist-eyebrow">
            Fonctionnalités
          </motion.span>
          <motion.h2 variants={fadeUp} id="features-heading" className="twist-section-title">
            Tout ce dont un closer
            <br />
            <span className="twist-title-accent">a besoin</span>
          </motion.h2>
          <motion.p variants={fadeUp} className="twist-section-sub">
            Trois piliers pour transformer votre processus de vente en machine de guerre.
          </motion.p>
        </motion.div>

        <div className="twist-features-grid" role="list">
          {FEATURES.map((f, i) => (
            <FeatureCard key={f.title} feature={f} index={i} />
          ))}
        </div>
      </div>
    </section>
  )
}

function CTASection() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })

  return (
    <section id="cta" className="twist-cta" aria-labelledby="cta-heading">
      <div className="twist-cta-bg" aria-hidden="true">
        <AnimatedOrb className="twist-orb--cta-violet" />
        <AnimatedOrb className="twist-orb--cta-cyan" />
      </div>
      <motion.div
        ref={ref}
        className="twist-container twist-cta-inner"
        initial="hidden"
        animate={inView ? 'visible' : 'hidden'}
        variants={staggerContainer}
      >
        <motion.span variants={fadeUp} className="twist-eyebrow">
          Rejoignez Twist
        </motion.span>
        <motion.h2 variants={fadeUp} id="cta-heading" className="twist-cta-title">
          Prêt à changer
          <br />
          votre façon de closer ?
        </motion.h2>
        <motion.p variants={fadeUp} className="twist-cta-sub">
          Essai gratuit 14 jours · Aucune carte requise · Setup en 3 minutes
        </motion.p>
        <motion.div variants={fadeUp}>
          <a
            href="#"
            className="twist-btn-primary twist-btn-primary--large"
            aria-label="Commencer l'essai gratuit de Twist"
          >
            Commencer l'essai gratuit
            <svg width="18" height="18" fill="none" viewBox="0 0 18 18" aria-hidden="true">
              <path d="M3.5 9h11M9 4.5l4.5 4.5L9 13.5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </a>
        </motion.div>
      </motion.div>
    </section>
  )
}

function Footer() {
  return (
    <footer className="twist-footer" role="contentinfo">
      <div className="twist-container twist-footer-inner">
        <span className="twist-footer-logo">Twist</span>
        <p className="twist-footer-copy">© 2025 Twist SaaS. Tous droits réservés.</p>
        <nav className="twist-footer-nav" aria-label="Liens de pied de page">
          <a href="#">Confidentialité</a>
          <a href="#">CGU</a>
          <a href="#">Contact</a>
        </nav>
      </div>
    </footer>
  )
}

// ─── Main export ─────────────────────────────────────────────────────────────
export default function TwistLanding() {
  return (
    <div className="twist-root" lang="fr">
      <a href="#features" className="twist-skip-link">
        Aller au contenu principal
      </a>

      <nav className="twist-nav" role="navigation" aria-label="Navigation principale Twist">
        <div className="twist-container twist-nav-inner">
          <span className="twist-nav-logo" aria-label="Twist">
            Twist
          </span>
          <div className="twist-nav-links">
            <a href="#features" className="twist-nav-link">Fonctionnalités</a>
            <a href="#cta" className="twist-nav-link">Tarifs</a>
            <a href="#cta" className="twist-btn-nav">Démarrer</a>
          </div>
        </div>
      </nav>

      <main id="main-content">
        <HeroSection />
        <FeaturesSection />
        <CTASection />
      </main>

      <Footer />
    </div>
  )
}
