"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import questionData from "../data/data.json";

const QUESTIONS_PER_BATCH = 5;
const GAME_KEY = "loveseal:quiz-progress";

type Level = "simple" | "intermediate" | "hard";

type Question = {
  id: number;
  book: string;
  level: Level;
  question: string;
  options: string[];
  answer: string;
};

type SavedGame = {
  level: Level;
  questionIds: number[];
  answers: Record<string, string>;
  currentBatch: number;
  completed: boolean;
};

const questions = questionData as Question[];

const levelNames: Record<Level, string> = {
  simple: "Word Son",
  intermediate: "Testimony Son",
  hard: "Prophecy Son",
};

function isLevel(value: string | null): value is Level {
  return value === "simple" || value === "intermediate" || value === "hard";
}

function shuffledIds(level: Level) {
  const ids = questions.filter((question) => question.level === level).map((question) => question.id);

  for (let index = ids.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [ids[index], ids[randomIndex]] = [ids[randomIndex], ids[index]];
  }

  return ids;
}

function createGame(level: Level): SavedGame {
  return {
    level,
    questionIds: shuffledIds(level),
    answers: {},
    currentBatch: 0,
    completed: false,
  };
}

export default function QuizPage() {
  const [game, setGame] = useState<SavedGame | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const selectedLevel = window.localStorage.getItem("loveseal:selected-level");

    if (!isLevel(selectedLevel)) {
      setReady(true);
      return;
    }

    let nextGame: SavedGame | null = null;
    const saved = window.localStorage.getItem(GAME_KEY);

    if (saved) {
      try {
        const parsed = JSON.parse(saved) as SavedGame;
        if (
          parsed.level === selectedLevel &&
          Array.isArray(parsed.questionIds) &&
          parsed.questionIds.length > 0
        ) {
          nextGame = parsed;
        }
      } catch {
        window.localStorage.removeItem(GAME_KEY);
      }
    }

    setGame(nextGame ?? createGame(selectedLevel));
    setReady(true);
  }, []);

  useEffect(() => {
    if (ready && game) {
      window.localStorage.setItem(GAME_KEY, JSON.stringify(game));
    }
  }, [game, ready]);

  const orderedQuestions = useMemo(() => {
    if (!game) return [];
    const byId = new Map(questions.map((question) => [question.id, question]));
    return game.questionIds
      .map((id) => byId.get(id))
      .filter((question): question is Question => Boolean(question));
  }, [game]);

  const totalBatches = Math.ceil(orderedQuestions.length / QUESTIONS_PER_BATCH);
  const batchStart = (game?.currentBatch ?? 0) * QUESTIONS_PER_BATCH;
  const currentQuestions = orderedQuestions.slice(batchStart, batchStart + QUESTIONS_PER_BATCH);
  const answeredInBatch = currentQuestions.filter((question) => game?.answers[String(question.id)]).length;
  const batchComplete = currentQuestions.length > 0 && answeredInBatch === currentQuestions.length;

  const selectAnswer = useCallback((questionId: number, answer: string) => {
    setGame((current) => current ? {
      ...current,
      answers: { ...current.answers, [String(questionId)]: answer },
    } : current);
  }, []);

  const nextBatch = () => {
    if (!batchComplete) return;
    setGame((current) => current ? {
      ...current,
      currentBatch: Math.min(current.currentBatch + 1, totalBatches - 1),
    } : current);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const previousBatch = () => {
    setGame((current) => current ? {
      ...current,
      currentBatch: Math.max(current.currentBatch - 1, 0),
    } : current);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const finishQuiz = () => {
    if (!batchComplete) return;
    setGame((current) => current ? { ...current, completed: true } : current);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const restartQuiz = () => {
    if (!game) return;
    setGame(createGame(game.level));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (!ready) {
    return (
      <main className="quiz-shell quiz-loading" aria-live="polite">
        <div className="loading-mark" aria-hidden="true">★</div>
        <p>Preparing your quest…</p>
      </main>
    );
  }

  if (!game) {
    return (
      <main className="quiz-shell quiz-empty">
        <div className="empty-card">
          <span aria-hidden="true">?</span>
          <h1>Choose your rank first</h1>
          <p>We need a level before we can build your question deck.</p>
          <Link href="/levels" className="primary-cta">
            <span>Select a level</span><span className="cta-arrow" aria-hidden="true">→</span>
          </Link>
        </div>
      </main>
    );
  }

  const correctCount = orderedQuestions.filter(
    (question) => game.answers[String(question.id)] === question.answer,
  ).length;
  const percentage = Math.round((correctCount / orderedQuestions.length) * 100);
  const answeredTotal = Object.keys(game.answers).length;

  if (game.completed) {
    const resultMessage = percentage >= 80
      ? "Outstanding! You know these letters well."
      : percentage >= 60
        ? "Strong work! Your next run can go even higher."
        : "Good start! Review the misses and rise again.";

    return (
      <main className="quiz-shell result-shell">
        <div className="quiz-halftone" aria-hidden="true" />
        <header className="quiz-header">
          <Image src="/loveseal-logo.png" alt="LoveSeal Church" width={292} height={93} className="brand-logo" priority />
          <span className="quiz-rank-badge">{levelNames[game.level]}</span>
        </header>

        <section className="result-content">
          <div className="result-burst" aria-hidden="true"><span>{percentage}%</span></div>
          <p className="result-kicker">Quest complete!</p>
          <h1>Your score is in</h1>
          <p className="result-message">{resultMessage}</p>

          <div className="score-strip">
            <div><strong>{correctCount}</strong><span>Correct</span></div>
            <div><strong>{orderedQuestions.length - correctCount}</strong><span>Missed</span></div>
            <div><strong>{orderedQuestions.length}</strong><span>Total</span></div>
          </div>

          <div className="result-actions">
            <button type="button" className="primary-cta" onClick={restartQuiz}>
              <span>Play again</span><span className="cta-arrow" aria-hidden="true">↻</span>
            </button>
            <Link href="/levels" className="secondary-cta">Change level</Link>
          </div>

          {correctCount < orderedQuestions.length && (
            <div className="review-panel">
              <div className="review-heading">
                <span>Review round</span>
                <strong>Learn from the close calls</strong>
              </div>
              {orderedQuestions
                .filter((question) => game.answers[String(question.id)] !== question.answer)
                .map((question, index) => (
                  <article className="review-item" key={question.id}>
                    <span className="review-number">{String(index + 1).padStart(2, "0")}</span>
                    <div>
                      <span className="question-book">{question.book}</span>
                      <h2>{question.question}</h2>
                      <p><b>Your answer:</b> {game.answers[String(question.id)]}</p>
                      <p className="correct-answer"><b>Correct answer:</b> {question.answer}</p>
                    </div>
                  </article>
                ))}
            </div>
          )}
        </section>
      </main>
    );
  }

  const isLastBatch = game.currentBatch === totalBatches - 1;
  const progress = Math.round((answeredTotal / orderedQuestions.length) * 100);

  return (
    <main className="quiz-shell">
      <div className="quiz-halftone" aria-hidden="true" />
      <header className="quiz-header">
        <Link href="/" aria-label="LoveSeal Bible Quest home">
          <Image src="/loveseal-logo.png" alt="LoveSeal Church" width={292} height={93} className="brand-logo" priority />
        </Link>
        <Link href="/levels" className="quit-link">Save &amp; exit</Link>
      </header>

      <section className="quiz-content" aria-labelledby="quiz-title">
        <div className="quiz-topline">
          <div>
            <span className="quiz-overline">{levelNames[game.level]} challenge</span>
            <h1 id="quiz-title">Round {game.currentBatch + 1}</h1>
          </div>
          <div className="question-counter">
            <strong>{Math.min(batchStart + 1, orderedQuestions.length)}–{Math.min(batchStart + currentQuestions.length, orderedQuestions.length)}</strong>
            <span>of {orderedQuestions.length}</span>
          </div>
        </div>

        <div className="quiz-progress" aria-label={`${progress}% of questions answered`}>
          <div style={{ width: `${progress}%` }} />
        </div>
        <div className="batch-pips" aria-label={`Batch ${game.currentBatch + 1} of ${totalBatches}`}>
          {Array.from({ length: totalBatches }, (_, index) => (
            <span key={index} className={index <= game.currentBatch ? "is-active" : ""} />
          ))}
        </div>

        <div className="questions-list">
          {currentQuestions.map((question, index) => {
            const selectedAnswer = game.answers[String(question.id)];
            const questionNumber = batchStart + index + 1;

            return (
              <fieldset className="question-panel" key={question.id}>
                <legend className="sr-only">Question {questionNumber}</legend>
                <div className="question-heading">
                  <span className="question-number">{String(questionNumber).padStart(2, "0")}</span>
                  <div>
                    <span className="question-book">{question.book}</span>
                    <h2>{question.question}</h2>
                  </div>
                </div>
                <div className="answer-grid">
                  {question.options.map((option, optionIndex) => {
                    const isSelected = selectedAnswer === option;
                    return (
                      <label className={`answer-option${isSelected ? " is-selected" : ""}`} key={option}>
                        <input
                          type="radio"
                          name={`question-${question.id}`}
                          value={option}
                          checked={isSelected}
                          onChange={() => selectAnswer(question.id, option)}
                        />
                        <span className="option-letter">{String.fromCharCode(65 + optionIndex)}</span>
                        <span>{option}</span>
                        <span className="option-check" aria-hidden="true">✓</span>
                      </label>
                    );
                  })}
                </div>
              </fieldset>
            );
          })}
        </div>

        <div className="quiz-navigation">
          <button type="button" className="quiz-nav-button previous" onClick={previousBatch} disabled={game.currentBatch === 0}>
            <span aria-hidden="true">←</span> Previous
          </button>
          <span className="batch-status">
            {batchComplete ? "Round cleared!" : `${currentQuestions.length - answeredInBatch} unanswered`}
          </span>
          <button
            type="button"
            className="quiz-nav-button next"
            onClick={isLastBatch ? finishQuiz : nextBatch}
            disabled={!batchComplete}
          >
            {isLastBatch ? "Finish quest" : "Next round"} <span aria-hidden="true">{isLastBatch ? "★" : "→"}</span>
          </button>
        </div>
      </section>
    </main>
  );
}
