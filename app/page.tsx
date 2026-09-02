import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <main className="welcome-shell">
      <div className="dot-field" aria-hidden="true" />
      <div className="burst burst-one" aria-hidden="true">✦</div>
      <div className="burst burst-two" aria-hidden="true">✦</div>
      <div className="speed-lines speed-lines-left" aria-hidden="true" />
      <div className="speed-lines speed-lines-right" aria-hidden="true" />

      <header className="site-header">
        <Link href="/" aria-label="LoveSeal Bible Quest home">
          <Image
            src="/loveseal-logo.png"
            alt="LoveSeal Church"
            width={292}
            height={93}
            className="brand-logo"
            priority
          />
        </Link>
        <span className="game-badge">Bible Quest</span>
      </header>

      <section className="welcome-hero" aria-labelledby="welcome-title">
        <div className="speech-label">Hey, Son! 👋</div>

        <div className="open-book" aria-hidden="true">
          <div className="book-glow" />
          <div className="book-page book-page-left"><span /><span /><span /></div>
          <div className="book-spine" />
          <div className="book-page book-page-right"><span /><span /><span /></div>
          <div className="book-star star-one">★</div>
          <div className="book-star star-two">✦</div>
          <div className="book-star star-three">★</div>
        </div>

        <div className="hero-copy">
          <p className="eyebrow">Ready to rise through the ranks?</p>
          <h1 id="welcome-title">
            How well do you
            <span>know the Word?</span>
          </h1>
          <p className="hero-description">
            Take on questions from <strong>1 Timothy, 2 Timothy &amp; Titus</strong>,
            earn your rank, and prove your Bible knowledge.
          </p>
          <Link href="/levels" className="primary-cta">
            <span>Enter the Quest</span>
            <span className="cta-arrow" aria-hidden="true">→</span>
          </Link>
          <p className="micro-copy">3 ranks · 60 questions · One epic quest</p>
        </div>
      </section>

      <footer className="welcome-footer">
        <span>Made for the Sons</span><span aria-hidden="true">◆</span><span>LoveSeal Church</span>
      </footer>
    </main>
  );
}
