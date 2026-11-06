import Link from "next/link";
import { notFound } from "next/navigation";
import { CANDIDATE_ROLES } from "@/lib/access";
import { requirePageRoles } from "@/server/auth/page-guard";
import { getArcadeGame } from "@/server/learning/arcade-games";
import { Badge } from "@/components/ui/badge";
import { FrameworkFlowGame } from "@/components/learn/games/framework-flow-game";
import { BigOBlitzGame } from "@/components/learn/games/big-o-blitz-game";
import { PairSeekerGame } from "@/components/learn/games/pair-seeker-game";
import { BinaryRangeGame } from "@/components/learn/games/binary-range-game";

export default async function ArcadeGamePage({ params }: { params: Promise<{ slug: string }> }) {
  await requirePageRoles(CANDIDATE_ROLES);
  const { slug } = await params;
  const game = getArcadeGame(slug);
  if (!game) notFound();

  return (
    <div className="animate-rise mx-auto max-w-3xl space-y-6">
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <Link href="/learn/games" className="text-teal-700 hover:underline">
          ← Arcade
        </Link>
        <span className="text-slate-500">/</span>
        <span className="text-slate-600">{game.title}</span>
      </div>

      <header>
        <div className="flex flex-wrap gap-2">
          <Badge variant="cyan">{game.skill}</Badge>
          <Badge>{game.minutes} min</Badge>
        </div>
        <h1 className="mt-3 font-serif-display text-2xl sm:text-3xl">{game.title}</h1>
        <p className="mt-2 text-slate-600">{game.blurb}</p>
      </header>

      <section className="rounded-2xl border border-slate-200 bg-white/80 p-4 sm:p-6">
        {slug === "framework-flow" && <FrameworkFlowGame />}
        {slug === "big-o-blitz" && <BigOBlitzGame />}
        {slug === "pair-seeker" && <PairSeekerGame />}
        {slug === "binary-range" && <BinaryRangeGame />}
      </section>
    </div>
  );
}
