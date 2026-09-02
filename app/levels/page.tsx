"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const levels = [
  {
    id: "simple",
    rank: "Rank 01",
    title: "Word Son",
    difficulty: "Simple",
    mark: "W",
    tagline: "Start with the foundations.",
    description: "Recognisable people, places, and well-known verse completions.",
    questions: 21,
  },
  {
    id: "intermediate",
    rank: "Rank 02",
    title: "Testimony Son",
    difficulty: "Intermediate",
    mark: "T",
    tagline: "Put your memory to work.",
    description: "Verse locations, names, sequences, and detailed letter knowledge.",
    questions: 21,
  },
  {
    id: "hard",
    rank: "Rank 03",
    title: "Prophecy Son",
    difficulty: "Hard",
    mark: "P",
    tagline: "Only the sharpest prevail.",
    description: "Close verse references and deceptively similar answer choices.",
    questions: 18,
  },
] as const;

type LevelId = (typeof levels)[number]["id"];

export default function LevelsPage() {
  const [selected, setSelected] = useState<LevelId | null>(null);
  const router = useRouter();
  const selectedLevel = levels.find((level) => level.id === selected);

  useEffect(() => {
    const savedLevel = window.localStorage.getItem("loveseal:selected-level");
    if (levels.some((level) => level.id === savedLevel)) {
      setSelected(savedLevel as LevelId);
    }
  }, []);

  const chooseLevel = (level: LevelId) => {
    setSelected(level);
    window.localStorage.setItem("loveseal:selected-level", level);
  };

  const beginChallenge = () => {
    if (!selected) return;
    window.localStorage.setItem("loveseal:selected-level", selected);
    router.push("/quiz");
  };

  return (
    <main className="levels-shell">
      <div className="levels-halftone levels-halftone-left" aria-hidden="true" />
      <div className="levels-halftone levels-halftone-right" aria-hidden="true" />
      <div className="levels-spark levels-spark-one" aria-hidden="true">✦</div>
      <div className="levels-spark levels-spark-two" aria-hidden="true">★</div>

      <header className="levels-header">
        <Link href="/" aria-label="Back to LoveSeal Bible Quest home">
          <Image
            src="/loveseal-logo.png"
            alt="LoveSeal Church"
            width={292}
            height={93}
            className="brand-logo"
            priority
          />
        </Link>
        <Link href="/" className="back-link">
          <span aria-hidden="true">←</span> Back home
        </Link>
      </header>

      <section className="levels-content" aria-labelledby="levels-title">
        <div className="levels-heading">
          <div className="level-kicker">Choose your challenge</div>
          <h1 id="levels-title">Select your level</h1>
          <p>Every Son has a starting point. Pick your rank and step into the Word.</p>
        </div>

        <div className="level-grid" role="radiogroup" aria-label="Quiz difficulty">
          {levels.map((level, index) => {
            const isSelected = selected === level.id;

            return (
              <button
                key={level.id}
                type="button"
                role="radio"
                aria-checked={isSelected}
                className={`level-card level-card-${level.id}${isSelected ? " is-selected" : ""}`}
                onClick={() => chooseLevel(level.id)}
                style={{ "--card-order": index } as React.CSSProperties}
              >
                <span className="rank-ribbon">{level.rank}</span>
                <span className="level-medallion" aria-hidden="true">
                  <span>{level.mark}</span>
                  <i>★</i>
                </span>
                <span className="difficulty-pill">{level.difficulty}</span>
                <strong>{level.title}</strong>
                <em>{level.tagline}</em>
                <span className="level-description">{level.description}</span>
                <span className="level-meta">
                  <span><b>{level.questions}</b> questions</span>
                  <span><b>3</b> books</span>
                </span>
                <span className="select-state">
                  {isSelected ? "Selected!" : "Choose this rank"}
                  <span aria-hidden="true">{isSelected ? "✓" : "→"}</span>
                </span>
              </button>
            );
          })}
        </div>

        <div className={`selection-dock${selectedLevel ? " has-selection" : ""}`} aria-live="polite">
          <div>
            <span className="dock-label">Your quest</span>
            <strong>{selectedLevel ? `${selectedLevel.title} is ready` : "Pick a rank to continue"}</strong>
          </div>
          <button
            type="button"
            className="dock-button"
            disabled={!selectedLevel}
            onClick={beginChallenge}
          >
            {selectedLevel ? "Begin challenge" : "Select a level"}
            <span aria-hidden="true">⚡</span>
          </button>
        </div>
      </section>
    </main>
  );
}
