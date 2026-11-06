"use client";

import { useCallback, useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useArcadeClear } from "@/components/learn/games/use-arcade-clear";
import { ArcadeClearFx } from "@/components/learn/games/arcade-clear-fx";
import type { ArcadeGameDef } from "@/server/learning/arcade-games";
import { ARCADE_DRILL_XP, ARCADE_DRILL_PERFECT_BONUS_XP } from "@/server/learning/arcade-games";

function mulberry(seed: number) {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle<T>(arr: T[], rand: () => number) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

const COMPLEXITY_BANK = [
  { prompt: "Scan an unsorted array once", answer: "O(n)", decoys: ["O(1)", "O(n log n)", "O(n²)"] },
  { prompt: "Binary search on a sorted list", answer: "O(log n)", decoys: ["O(n)", "O(1)", "O(n²)"] },
  { prompt: "Hash map average lookup", answer: "O(1)", decoys: ["O(n)", "O(log n)", "O(n log n)"] },
  { prompt: "Nested loop over n×n pairs", answer: "O(n²)", decoys: ["O(n)", "O(n log n)", "O(2ⁿ)"] },
  { prompt: "Comparison sort (merge / heap)", answer: "O(n log n)", decoys: ["O(n)", "O(log n)", "O(n²)"] },
  { prompt: "Insert at head of linked list", answer: "O(1)", decoys: ["O(n)", "O(log n)", "O(n²)"] },
  { prompt: "Build heap from n elements", answer: "O(n)", decoys: ["O(n log n)", "O(n²)", "O(log n)"] },
  { prompt: "DFS/BFS over V edges E", answer: "O(V+E)", decoys: ["O(V²)", "O(E log V)", "O(V)"] },
  { prompt: "Matrix multiply naïve n×n", answer: "O(n³)", decoys: ["O(n²)", "O(n log n)", "O(2ⁿ)"] },
  { prompt: "Check digit parity", answer: "O(1)", decoys: ["O(n)", "O(log n)", "O(n²)"] },
];

const SEQUENCE_BANK = [
  ["Clarify", "Examples", "Brute force", "Optimize", "Code", "Test"],
  ["Read input", "Parse", "Validate", "Transform", "Emit", "Ack"],
  ["Split", "Conquer", "Merge", "Base case"],
  ["Acquire", "Critical section", "Release", "Join"],
  ["Index", "Probe", "Hash", "Resolve", "Return"],
];

const TERM_PAIRS = [
  ["Stack", "LIFO"],
  ["Queue", "FIFO"],
  ["Hash map", "Avg O(1) lookup"],
  ["Heap", "Priority extract"],
  ["BFS", "Level order"],
  ["DFS", "Path recursion"],
  ["Mutex", "Exclusive lock"],
  ["Idempotent", "Safe retry"],
  ["SLO", "Service objective"],
  ["Cache", "Faster store"],
  ["Trie", "Prefix tree"],
  ["Graph", "Nodes + edges"],
];

type Card = { id: number; text: string; pair: number; flipped: boolean; matched: boolean };

export function ProceduralArcadeGame({ game }: { game: ArcadeGameDef }) {
  const { reportClear, busy, clearTick, lastXp } = useArcadeClear(game.slug);
  const need = 2 + Math.min(3, game.difficulty);

  const [started, setStarted] = useState(false);
  const [finished, setFinished] = useState(false);
  const [perfect, setPerfect] = useState(true);
  const [message, setMessage] = useState("Press start when ready.");
  const [score, setScore] = useState(0);

  const [numbers, setNumbers] = useState<number[]>([]);
  const [target, setTarget] = useState(0);
  const [picked, setPicked] = useState<number[]>([]);

  const [lo, setLo] = useState(1);
  const [hi, setHi] = useState(100);
  const [secret, setSecret] = useState(50);
  const [guesses, setGuesses] = useState(0);

  const [quizBank, setQuizBank] = useState<typeof COMPLEXITY_BANK>([]);
  const [quizIdx, setQuizIdx] = useState(0);
  const [choices, setChoices] = useState<string[]>([]);

  const [seqOrder, setSeqOrder] = useState<string[]>([]);
  const [seqShuffled, setSeqShuffled] = useState<string[]>([]);
  const [seqIdx, setSeqIdx] = useState(0);

  const [stack, setStack] = useState<number[]>([]);
  const [stackGoal, setStackGoal] = useState<number[]>([]);

  const [bits, setBits] = useState(0);
  const [bitGoal, setBitGoal] = useState(0);

  const [cards, setCards] = useState<Card[]>([]);
  const [flipIds, setFlipIds] = useState<number[]>([]);

  const [tapHits, setTapHits] = useState(0);
  const [tapPhase, setTapPhase] = useState(0);
  const [latency, setLatency] = useState(40);

  const seedRng = useCallback(
    (salt = 0) => mulberry((game.seed ^ (game.difficulty * 9973) ^ salt) >>> 0),
    [game.seed, game.difficulty],
  );

  const finishRun = useCallback(
    async (okPerfect: boolean, finalScore: number) => {
      setFinished(true);
      setPerfect(okPerfect);
      setMessage(okPerfect ? "Perfect clear!" : "Cleared — room to sharpen.");
      await reportClear({ perfect: okPerfect, score: finalScore });
    },
    [reportClear],
  );

  const addProgress = useCallback(
    (nextPerfect: boolean, delta = 1) => {
      setScore((prev) => {
        const next = prev + delta;
        if (next >= need) {
          void finishRun(nextPerfect, next);
        }
        return next;
      });
    },
    [finishRun, need],
  );

  const bootstrap = useCallback(() => {
    const seeded = seedRng(1);
    setStarted(true);
    setFinished(false);
    setPerfect(true);
    setScore(0);
    setPicked([]);
    setGuesses(0);
    setFlipIds([]);
    setTapHits(0);
    setTapPhase(0);
    setSeqIdx(0);
    setQuizIdx(0);

    if (game.engine === "two-sum") {
      const t = 10 + Math.floor(seeded() * (8 + game.difficulty * 6));
      const a = 2 + Math.floor(seeded() * (t - 3));
      const b = t - a;
      const vals = [a, b];
      while (vals.length < 6 + game.difficulty) vals.push(1 + Math.floor(seeded() * (t + 8)));
      setTarget(t);
      setNumbers(shuffle(vals, seeded));
      setMessage(`Find two numbers that sum to ${t}.`);
    } else if (game.engine === "binary-guess") {
      const max = 32 + game.difficulty * 32;
      setLo(1);
      setHi(max);
      setSecret(1 + Math.floor(seeded() * max));
      setMessage(`Secret is in 1…${max}. Halve the range.`);
    } else if (game.engine === "complexity-quiz") {
      const bank = shuffle(COMPLEXITY_BANK, seeded).slice(0, 4 + Math.min(2, game.difficulty));
      setQuizBank(bank);
      setQuizIdx(0);
      setChoices(shuffle([bank[0]!.answer, ...bank[0]!.decoys], seeded));
      setMessage("Pick the right Big-O.");
    } else if (game.engine === "sequence-order") {
      const base = SEQUENCE_BANK[Math.floor(seeded() * SEQUENCE_BANK.length)]!;
      setSeqOrder(base);
      setSeqShuffled(shuffle(base, seeded));
      setMessage("Tap steps in the correct order.");
    } else if (game.engine === "stack-machine") {
      const goal = [1, 2, 3].map((_, i) => 1 + Math.floor(seeded() * (4 + i + game.difficulty)));
      setStackGoal(goal);
      setStack([]);
      setNumbers(shuffle([...goal, ...goal.map((n) => n + 1 + Math.floor(seeded() * 3))], seeded).slice(0, 6));
      setMessage(`Build bottom→top as [${goal.join(", ")}].`);
    } else if (game.engine === "bit-puzzle") {
      const goal = 1 + Math.floor(seeded() * (15 + game.difficulty * 8));
      setBitGoal(goal);
      setBits(0);
      setMessage(`Flip bits until value equals ${goal}.`);
    } else if (game.engine === "memory-match") {
      const pairs = shuffle(TERM_PAIRS, seeded).slice(0, 3 + Math.min(3, game.difficulty));
      const flat = pairs.flatMap(([a, b], pair) => [
        { id: pair * 2, text: a, pair, flipped: false, matched: false },
        { id: pair * 2 + 1, text: b, pair, flipped: false, matched: false },
      ]);
      setCards(shuffle(flat, seeded));
      setMessage("Match each term to its definition.");
    } else if (game.engine === "tap-timing") {
      setLatency(30 + Math.floor(seeded() * 40));
      setMessage("Tap only while latency is under the SLO (80ms).");
    }
  }, [game.difficulty, game.engine, seedRng]);

  useEffect(() => {
    if (game.engine !== "tap-timing" || !started || finished) return;
    const id = window.setInterval(() => {
      setLatency((prev) =>
        Math.round(Math.max(10, Math.min(160, prev + (Math.random() > 0.5 ? 12 : -10) + (Math.random() * 8 - 4)))),
      );
      setTapPhase((p) => p + 1);
    }, 420);
    return () => window.clearInterval(id);
  }, [game.engine, started, finished]);

  function onTwoSum(idx: number) {
    if (finished) return;
    const next = picked.includes(idx) ? picked.filter((i) => i !== idx) : [...picked, idx].slice(-2);
    setPicked(next);
    if (next.length < 2) return;
    const sum = numbers[next[0]!]! + numbers[next[1]!]!;
    if (sum === target) {
      setMessage("Pair found.");
      setPicked([]);
      const nextPerfect = perfect;
      addProgress(nextPerfect);
      const seeded = seedRng(20 + score);
      const t = target;
      const a = 2 + Math.floor(seeded() * (t - 3));
      const b = t - a;
      const vals = [a, b];
      while (vals.length < numbers.length) vals.push(1 + Math.floor(seeded() * (t + 8)));
      setNumbers(shuffle(vals, seeded));
    } else {
      setPerfect(false);
      setMessage("Not the pair.");
      setPicked([]);
    }
  }

  function onBinary(dir: "low" | "high" | "hit") {
    if (finished) return;
    const mid = Math.floor((lo + hi) / 2);
    setGuesses((g) => g + 1);
    if (dir === "hit") {
      if (mid === secret) {
        setMessage("Found.");
        addProgress(perfect);
        const seeded = seedRng(30 + score);
        const max = Math.max(hi, 32);
        setSecret(1 + Math.floor(seeded() * max));
        setLo(1);
        setHi(max);
      } else {
        setPerfect(false);
        setMessage("Not mid.");
      }
      return;
    }
    if (dir === "low") {
      if (secret < mid) setHi(Math.max(lo, mid - 1));
      else {
        setPerfect(false);
        setMessage("Wrong half.");
      }
    } else if (secret > mid) setLo(Math.min(hi, mid + 1));
    else {
      setPerfect(false);
      setMessage("Wrong half.");
    }
  }

  function onQuiz(choice: string) {
    if (finished || !quizBank[quizIdx]) return;
    const current = quizBank[quizIdx]!;
    if (choice === current.answer) {
      const nextIdx = quizIdx + 1;
      if (nextIdx >= quizBank.length) {
        void finishRun(perfect, score + 1);
        setScore(score + 1);
        return;
      }
      setQuizIdx(nextIdx);
      const next = quizBank[nextIdx]!;
      setChoices(shuffle([next.answer, ...next.decoys], seedRng(40 + nextIdx)));
      setMessage("Correct.");
      setScore((s) => s + 1);
    } else {
      setPerfect(false);
      setMessage("Miss.");
    }
  }

  function onSeqTap(step: string) {
    if (finished) return;
    if (step !== seqOrder[seqIdx]) {
      setPerfect(false);
      setMessage(`Next should be “${seqOrder[seqIdx]}”.`);
      return;
    }
    const next = seqIdx + 1;
    if (next >= seqOrder.length) {
      setSeqIdx(0);
      setMessage("Sequence cleared.");
      addProgress(perfect);
      const seeded = seedRng(50 + score);
      const base = SEQUENCE_BANK[Math.floor(seeded() * SEQUENCE_BANK.length)]!;
      setSeqOrder(base);
      setSeqShuffled(shuffle(base, seeded));
    } else {
      setSeqIdx(next);
      setMessage(`Locked ${next}/${seqOrder.length}.`);
    }
  }

  function onStackPush(n: number) {
    if (finished) return;
    const next = [...stack, n];
    setStack(next);
    if (next.length === stackGoal.length && next.every((v, i) => v === stackGoal[i])) {
      setMessage("Stack matches.");
      addProgress(perfect);
      const seeded = seedRng(60 + score);
      const goal = [1, 2, 3].map((_, i) => 1 + Math.floor(seeded() * (4 + i + game.difficulty)));
      setStackGoal(goal);
      setStack([]);
      setNumbers(shuffle([...goal, ...goal.map((x) => x + 1 + Math.floor(seeded() * 3))], seeded).slice(0, 6));
    }
  }

  function onBitToggle(bit: number) {
    if (finished) return;
    const next = bits ^ (1 << bit);
    setBits(next);
    if (next === bitGoal) {
      setMessage("Mask matched.");
      addProgress(perfect);
      const seeded = seedRng(70 + score);
      setBitGoal(1 + Math.floor(seeded() * (15 + game.difficulty * 8)));
      setBits(0);
    }
  }

  function onCard(id: number) {
    if (finished) return;
    const card = cards.find((c) => c.id === id);
    if (!card || card.matched || card.flipped || flipIds.length >= 2) return;
    const nextFlip = [...flipIds, id];
    setCards((cs) => cs.map((c) => (c.id === id ? { ...c, flipped: true } : c)));
    setFlipIds(nextFlip);
    if (nextFlip.length < 2) return;
    const ca = cards.find((c) => c.id === nextFlip[0])!;
    const cb = cards.find((c) => c.id === nextFlip[1])!;
    // cb may not be flipped in state yet — compare pairs from ids
    const a = cards.find((c) => c.id === nextFlip[0])!;
    const b = { ...card };
    if (a.pair === b.pair) {
      setCards((cs) => cs.map((c) => (c.pair === a.pair ? { ...c, matched: true, flipped: true } : c)));
      setFlipIds([]);
      const still = cards.filter((c) => !c.matched && c.pair !== a.pair);
      if (still.length === 0) {
        setMessage("Board cleared.");
        addProgress(perfect);
        const seeded = seedRng(80 + score);
        const pairs = shuffle(TERM_PAIRS, seeded).slice(0, 3 + Math.min(3, game.difficulty));
        const flat = pairs.flatMap(([t, d], pair) => [
          { id: pair * 2, text: t, pair, flipped: false, matched: false },
          { id: pair * 2 + 1, text: d, pair, flipped: false, matched: false },
        ]);
        setCards(shuffle(flat, seeded));
      }
    } else {
      void ca;
      void cb;
      setPerfect(false);
      window.setTimeout(() => {
        setCards((cs) => cs.map((c) => (nextFlip.includes(c.id) ? { ...c, flipped: false } : c)));
        setFlipIds([]);
      }, 450);
    }
  }

  function onTap() {
    if (finished) return;
    if (latency < 80) {
      const hits = tapHits + 1;
      setTapHits(hits);
      setMessage(`Healthy tap · ${hits}/${need}`);
      if (hits >= need) void finishRun(perfect, hits);
    } else {
      setPerfect(false);
      setMessage("Spike — wait for green.");
    }
  }

  if (!started) {
    return (
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <Badge variant="amber">D{game.difficulty}</Badge>
          <Badge variant="cyan">{game.skill}</Badge>
          <Badge>
            +{ARCADE_DRILL_XP} XP · perfect +{ARCADE_DRILL_PERFECT_BONUS_XP}
          </Badge>
        </div>
        <p className="text-sm text-slate-600">{game.blurb}</p>
        <p className="font-mono text-xs text-slate-500">
          Seed {game.seed} · {game.engine}
        </p>
        <Button onClick={bootstrap}>Start drill</Button>
      </div>
    );
  }

  const quiz = quizBank[quizIdx];

  return (
    <div className="relative space-y-4">
      <ArcadeClearFx xp={lastXp} trigger={clearTick} />
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="cyan">
          Progress {Math.min(score, need)}/{need}
        </Badge>
        {game.engine === "complexity-quiz" && (
          <Badge>
            {quizIdx + 1}/{quizBank.length}
          </Badge>
        )}
        {game.engine === "binary-guess" && <Badge>{guesses} guesses</Badge>}
        {game.engine === "tap-timing" && (
          <Badge variant={latency < 80 ? "emerald" : "amber"}>{latency} ms</Badge>
        )}
        {!perfect && <Badge variant="amber">imperfect</Badge>}
        {finished && <Badge variant="emerald">{perfect ? "perfect clear" : "cleared"}</Badge>}
      </div>
      <p className="text-sm text-slate-700">{message}</p>

      {game.engine === "two-sum" && (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          <div className="col-span-full rounded-xl border border-cyan-200 bg-cyan-50/80 px-3 py-2 font-mono text-sm">
            Target {target}
          </div>
          {numbers.map((n, i) => (
            <button
              key={`${n}-${i}`}
              type="button"
              disabled={finished}
              onClick={() => onTwoSum(i)}
              className={cn(
                "rounded-xl border px-3 py-4 text-lg font-semibold transition",
                picked.includes(i) ? "border-cyan-500 bg-cyan-100" : "border-slate-200 bg-white hover:border-cyan-400",
              )}
            >
              {n}
            </button>
          ))}
        </div>
      )}

      {game.engine === "binary-guess" && (
        <div className="space-y-3">
          <p className="font-mono text-sm text-slate-600">
            Range [{lo}, {hi}] · mid {Math.floor((lo + hi) / 2)}
          </p>
          <div className="flex flex-wrap gap-2">
            <Button disabled={finished} variant="secondary" onClick={() => onBinary("low")}>
              Secret lower
            </Button>
            <Button disabled={finished} onClick={() => onBinary("hit")}>
              Mid is secret
            </Button>
            <Button disabled={finished} variant="secondary" onClick={() => onBinary("high")}>
              Secret higher
            </Button>
          </div>
        </div>
      )}

      {game.engine === "complexity-quiz" && quiz && (
        <div className="space-y-3">
          <p className="text-lg font-medium text-slate-900">{quiz.prompt}</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {choices.map((c) => (
              <Button key={c} disabled={finished} variant="secondary" onClick={() => onQuiz(c)}>
                {c}
              </Button>
            ))}
          </div>
        </div>
      )}

      {game.engine === "sequence-order" && (
        <div className="flex flex-wrap gap-2">
          {seqShuffled.map((step, i) => {
            const done = seqOrder.indexOf(step) < seqIdx && seqOrder.slice(0, seqIdx).includes(step);
            return (
              <Button key={`${step}-${i}`} disabled={finished || done} variant="secondary" onClick={() => onSeqTap(step)}>
                {step}
              </Button>
            );
          })}
        </div>
      )}

      {game.engine === "stack-machine" && (
        <div className="space-y-3">
          <p className="font-mono text-xs text-slate-500">
            Goal [{stackGoal.join(", ")}] · now [{stack.join(", ")}]
          </p>
          <div className="flex flex-wrap gap-2">
            {numbers.map((n, i) => (
              <Button key={`${n}-${i}`} disabled={finished} size="sm" onClick={() => onStackPush(n)}>
                Push {n}
              </Button>
            ))}
            <Button disabled={finished || stack.length === 0} variant="secondary" size="sm" onClick={() => setStack((s) => s.slice(0, -1))}>
              Pop
            </Button>
          </div>
        </div>
      )}

      {game.engine === "bit-puzzle" && (
        <div className="space-y-3">
          <p className="font-mono text-sm">
            Value {bits} · goal {bitGoal} · {bits.toString(2).padStart(8, "0")}
          </p>
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: 8 }, (_, bit) => (
              <Button
                key={bit}
                disabled={finished}
                variant={(bits >> bit) & 1 ? "default" : "secondary"}
                size="sm"
                onClick={() => onBitToggle(bit)}
              >
                bit {bit}
              </Button>
            ))}
          </div>
        </div>
      )}

      {game.engine === "memory-match" && (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {cards.map((c) => (
            <button
              key={c.id}
              type="button"
              disabled={finished || c.matched}
              onClick={() => onCard(c.id)}
              className={cn(
                "min-h-16 rounded-xl border px-2 py-3 text-sm transition",
                c.matched
                  ? "border-emerald-300 bg-emerald-50"
                  : c.flipped
                    ? "border-cyan-400 bg-cyan-50"
                    : "border-slate-200 bg-slate-50 hover:border-cyan-300",
              )}
            >
              {c.flipped || c.matched ? c.text : "?"}
            </button>
          ))}
        </div>
      )}

      {game.engine === "tap-timing" && (
        <div className="space-y-3">
          <div
            className={cn(
              "rounded-2xl border px-4 py-8 text-center transition",
              latency < 80 ? "border-emerald-300 bg-emerald-50" : "border-amber-300 bg-amber-50",
            )}
          >
            <p className="font-mono text-xs uppercase tracking-wider text-slate-500">Latency · tick {tapPhase}</p>
            <p className="mt-1 text-4xl font-semibold text-slate-900">{latency} ms</p>
            <p className="mt-1 text-sm text-slate-600">{latency < 80 ? "Under SLO — tap now" : "Spike — hold"}</p>
          </div>
          <Button disabled={finished} onClick={onTap}>
            Tap
          </Button>
        </div>
      )}

      <div className="flex flex-wrap gap-2 pt-2">
        {finished ? (
          <Button disabled={busy} onClick={bootstrap}>
            Play again
          </Button>
        ) : (
          <Button variant="ghost" onClick={() => setStarted(false)}>
            Reset
          </Button>
        )}
      </div>
    </div>
  );
}
