import { prisma } from "@/lib/db";
import { dateKey } from "@/server/saas/daily";
import {
  CHAPTER_CLEAR_XP,
  COMBO_XP,
  LESSON_XP,
  chapterBonusForLesson,
  touchLearnStreak,
} from "@/server/learning/gamification";

/** Award lesson XP with same-day combo and chapter-clear bonuses. */
export async function awardLessonClear(opts: {
  userId: string;
  track: "interview" | "ai";
  lessonSlug: string;
  completedBefore: string[];
  completedAfter: string[];
}) {
  const today = dateKey();
  const streak = await prisma.userStreak.findUnique({ where: { userId: opts.userId } });
  const alreadyLitToday = streak?.lastDateKey === today;

  let xpEarned = LESSON_XP;
  let comboXp = 0;
  if (alreadyLitToday) {
    comboXp = COMBO_XP;
    xpEarned += comboXp;
  }

  const chapterXp = chapterBonusForLesson({
    track: opts.track,
    lessonSlug: opts.lessonSlug,
    completedBefore: opts.completedBefore,
    completedAfter: opts.completedAfter,
  });
  if (chapterXp) xpEarned += chapterXp;

  await touchLearnStreak(opts.userId);

  return {
    xpEarned,
    lessonXp: LESSON_XP,
    comboXp,
    chapterXp,
    chapterClearXp: CHAPTER_CLEAR_XP,
  };
}
