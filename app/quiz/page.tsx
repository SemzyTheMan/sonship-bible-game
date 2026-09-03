"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import questionData from "../data/data.json";

const QUESTIONS_PER_BATCH = 5;
const QUESTIONS_PER_BOOK = 4;
const QUESTIONS_PER_GAME = 12;
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

type ReviewFilter = "all" | "correct" | "missed";

const questions = questionData as Question[];

const levelNames: Record<Level, string> = {
  simple: "Word Son",
  intermediate: "Testimony Son",
  hard: "Prophecy Son",
};

const resultMessages: Record<Level, { low: string; middle: string; high: string }> = {
  simple: {
    low: "Oh Son, pay attention to reading. Return to the Word and build your foundation.",
    middle: "Oh Son, press on in the Word. Keep journeying higher.",
    high: "Oh Son, Testimony awaits. Give diligence and press further.",
  },
  intermediate: {
    low: "Oh Son, do not be dismayed. Keep warring, and let the Word strengthen your testimony.",
    middle: "Oh Son, your testimony grows stronger. Hold fast, and keep pressing toward Prophecy.",
    high: "Oh Son, Prophecy calls. You have kept the testimony—press on to the deeper things.",
  },
  hard: {
    low: "Oh Son, do not be dismayed! Draw strength from the Testimony and rise again.",
    middle: "Oh Son, you are drawing near. Search the letters carefully and press toward mastery.",
    high: "Oh Son, the Book awaits. Press on.",
  },
};

const questionReferences: Record<number, string> = {
  1: "1 Timothy 1:1", 2: "1 Timothy 1:3", 3: "1 Timothy 2:5", 4: "1 Timothy 4:12",
  5: "1 Timothy 5:23", 6: "1 Timothy 6:6", 7: "1 Timothy 6:10", 8: "1 Timothy 1:20",
  9: "1 Timothy 2:1–2", 10: "1 Timothy 3:15", 11: "1 Timothy 4:13", 12: "1 Timothy 5:9",
  13: "1 Timothy 5:19", 14: "1 Timothy 6:12", 15: "1 Timothy 4:4", 16: "1 Timothy 4:6",
  17: "1 Timothy 5:10", 18: "1 Timothy 5:21", 19: "1 Timothy 6:11", 20: "1 Timothy 6:20",
  21: "2 Timothy 1:5", 22: "2 Timothy 1:5", 23: "2 Timothy 1:7", 24: "2 Timothy 2:3",
  25: "2 Timothy 4:7", 26: "2 Timothy 4:11", 27: "2 Timothy 4:13", 28: "2 Timothy 1:15",
  29: "2 Timothy 1:16–17", 30: "2 Timothy 2:15", 31: "2 Timothy 3:8", 32: "2 Timothy 3:11",
  33: "2 Timothy 3:16", 34: "2 Timothy 4:10", 35: "2 Timothy 2:10", 36: "2 Timothy 2:17",
  37: "2 Timothy 2:17", 38: "2 Timothy 2:22", 39: "2 Timothy 4:10", 40: "2 Timothy 4:20",
  41: "Titus 1:1", 42: "Titus 1:5", 43: "Titus 1:5", 44: "Titus 1:12",
  45: "Titus 2:6", 46: "Titus 3:2", 47: "Titus 3:12", 48: "Titus 1:4",
  49: "Titus 1:8", 50: "Titus 2:3", 51: "Titus 2:10", 52: "Titus 2:13",
  53: "Titus 3:10", 54: "Titus 3:13", 55: "Titus 1:2", 56: "Titus 1:7",
  57: "Titus 1:15", 58: "Titus 2:12", 59: "Titus 3:9", 60: "Titus 3:12",
};

const learningNotes: Partial<Record<number, string>> = {
  8: "Hymenaeus and Alexander are the pair named here. Hymenaeus and Philetus appear together later in 2 Timothy 2:17.",
  12: "The KJV says a widow taken into the number should be at least threescore years old—sixty years.",
  13: "The letter requires two or three witnesses before an accusation against an elder is received.",
  17: "The sequence is important: lodging strangers is followed by washing the saints’ feet, then relieving the afflicted.",
  21: "Lois was Timothy’s grandmother. Eunice, who is named in the same verse, was his mother.",
  22: "Eunice was Timothy’s mother, while Lois was his grandmother. Both are remembered for their unfeigned faith.",
  28: "Phygellus and Hermogenes are named as having turned away. Hymenaeus and Philetus are the pair connected with false teaching in chapter 2.",
  31: "Jannes and Jambres are the two names linked with resisting Moses; the other pairs belong to different passages.",
  34: "Demas went to Thessalonica. In the same verse, Crescens went to Galatia and Titus to Dalmatia.",
  37: "Hymenaeus and Philetus are named after the image of words spreading like a canker. Alexander is paired with Hymenaeus in 1 Timothy.",
  39: "The three destinations are close together: Demas—Thessalonica, Crescens—Galatia, and Titus—Dalmatia.",
  40: "Keep the locations paired correctly: Erastus stayed at Corinth, while Trophimus was left sick at Miletum.",
  42: "Titus was left in Crete to set in order what remained and appoint elders in every city.",
  47: "Paul asked Titus to come to Nicopolis because he had decided to spend the winter there.",
  48: "Titus is called Paul’s own son after the common faith. In 2 Timothy 1:2, Timothy is called his dearly beloved son.",
  54: "Zenas the lawyer and Apollos were to be helped on their journey. Artemas and Tychicus are named in the previous verse.",
  60: "Paul might send either Artemas or Tychicus to Titus before Titus travelled to meet him at Nicopolis.",
};

function isLevel(value: string | null): value is Level {
  return value === "simple" || value === "intermediate" || value === "hard";
}

function shuffle<T>(items: T[]) {
  const shuffled = [...items];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[index]];
  }

  return shuffled;
}

function shuffledIds(level: Level) {
  const books = ["1 Timothy", "2 Timothy", "Titus"];
  const balancedSelection = books.flatMap((book) =>
    shuffle(
      questions.filter((question) => question.level === level && question.book === book),
    )
      .slice(0, QUESTIONS_PER_BOOK)
      .map((question) => question.id),
  );

  return shuffle(balancedSelection);
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

function getLearningPoint(question: Question) {
  return learningNotes[question.id]
    ?? `The correct answer is “${question.answer}.” You can verify this detail in ${questionReferences[question.id]}.`;
}

function joinBookNames(bookNames: string[]) {
  if (bookNames.length <= 1) return bookNames[0] ?? "";
  if (bookNames.length === 2) return `${bookNames[0]} and ${bookNames[1]}`;
  return `${bookNames.slice(0, -1).join(", ")}, and ${bookNames.at(-1)}`;
}

export default function QuizPage() {
  const [game, setGame] = useState<SavedGame | null>(null);
  const [ready, setReady] = useState(false);
  const [reviewFilter, setReviewFilter] = useState<ReviewFilter>("all");

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
          parsed.questionIds.length === QUESTIONS_PER_GAME &&
          new Set(parsed.questionIds).size === QUESTIONS_PER_GAME &&
          parsed.answers &&
          typeof parsed.answers === "object"
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
    const messages = resultMessages[game.level];
    const resultMessage = percentage < 50
      ? messages.low
      : percentage < 75
        ? messages.middle
        : messages.high;
    const bookStats = ["1 Timothy", "2 Timothy", "Titus"].map((book) => {
      const bookQuestions = orderedQuestions.filter((question) => question.book === book);
      const correct = bookQuestions.filter(
        (question) => game.answers[String(question.id)] === question.answer,
      ).length;
      return {
        book,
        correct,
        total: bookQuestions.length,
        percentage: Math.round((correct / bookQuestions.length) * 100),
      };
    });
    const highestBookScore = Math.max(...bookStats.map((stat) => stat.percentage));
    const lowestBookScore = Math.min(...bookStats.map((stat) => stat.percentage));
    const strongestBooks = bookStats.filter((stat) => stat.percentage === highestBookScore);
    const focusBooks = bookStats.filter((stat) => stat.percentage === lowestBookScore);
    const balancedAcrossBooks = highestBookScore === lowestBookScore;
    const readingAdvice = balancedAcrossBooks
      ? `Your performance was evenly balanced across all three letters at ${highestBookScore}%. Review each letter, then return for a sharper run.`
      : `Your strongest ${strongestBooks.length > 1 ? "letters were" : "letter was"} ${joinBookNames(strongestBooks.map((stat) => stat.book))} at ${highestBookScore}%. Give your next reading time to ${joinBookNames(focusBooks.map((stat) => stat.book))}, where you scored ${lowestBookScore}%.`;
    const reviewQuestions = orderedQuestions.filter((question) => {
      if (reviewFilter === "all") return true;
      const isCorrect = game.answers[String(question.id)] === question.answer;
      return reviewFilter === "correct" ? isCorrect : !isCorrect;
    });

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

          <section className="book-analytics" aria-labelledby="book-analytics-title">
            <div className="analytics-heading">
              <span>Performance map</span>
              <h2 id="book-analytics-title">Your letter-by-letter result</h2>
            </div>
            <div className="book-stat-grid">
              {bookStats.map((stat) => (
                <article className="book-stat-card" key={stat.book}>
                  <div className="book-stat-topline">
                    <strong>{stat.book}</strong>
                    <span>{stat.percentage}%</span>
                  </div>
                  <div className="book-stat-bar" aria-label={`${stat.percentage}% in ${stat.book}`}>
                    <span style={{ width: `${stat.percentage}%` }} />
                  </div>
                  <p>{stat.correct} of {stat.total} correct</p>
                </article>
              ))}
            </div>
            <div className="reading-advice">
              <span aria-hidden="true">☀</span>
              <div>
                <strong>Your next move</strong>
                <p>{readingAdvice}</p>
              </div>
            </div>
          </section>

          <div className="result-actions">
            <button type="button" className="primary-cta" onClick={restartQuiz}>
              <span>Play again</span><span className="cta-arrow" aria-hidden="true">↻</span>
            </button>
            <Link href="/levels" className="secondary-cta">Change level</Link>
          </div>

          <div className="review-panel">
            <div className="review-heading">
              <span>Review round</span>
              <strong>See what you knew—and what to learn</strong>
            </div>
            <div className="review-filters" role="group" aria-label="Filter reviewed questions">
              {(["all", "correct", "missed"] as ReviewFilter[]).map((filter) => {
                const count = filter === "all"
                  ? orderedQuestions.length
                  : filter === "correct"
                    ? correctCount
                    : orderedQuestions.length - correctCount;
                return (
                  <button
                    type="button"
                    key={filter}
                    className={reviewFilter === filter ? "is-active" : ""}
                    aria-pressed={reviewFilter === filter}
                    onClick={() => setReviewFilter(filter)}
                  >
                    {filter} <span>{count}</span>
                  </button>
                );
              })}
            </div>
            <div className="review-list" aria-live="polite">
              {reviewQuestions.map((question, index) => {
                const playerAnswer = game.answers[String(question.id)];
                const isCorrect = playerAnswer === question.answer;
                return (
                  <article className={`review-item ${isCorrect ? "is-correct" : "is-missed"}`} key={question.id}>
                    <span className="review-number">{String(index + 1).padStart(2, "0")}</span>
                    <div>
                      <div className="review-item-topline">
                        <span className="question-book">{question.book}</span>
                        <span className="answer-status">{isCorrect ? "Correct ✓" : "Missed ✕"}</span>
                      </div>
                      <h2>{question.question}</h2>
                      <p><b>Your answer:</b> {playerAnswer}</p>
                      {!isCorrect && <p className="correct-answer"><b>Correct answer:</b> {question.answer}</p>}
                      <div className="learning-point">
                        <span>Learning point · {questionReferences[question.id]}</span>
                        <p>{getLearningPoint(question)}</p>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
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
