"use client";

/** Minimal markdown-ish renderer for curriculum lessons (headings, lists, code fences). */
export function LessonBody({ md }: { md: string }) {
  const blocks = md.trim().split(/\n\n+/);
  return (
    <div className="space-y-4 text-sm leading-relaxed text-slate-300">
      {blocks.map((block, i) => {
        if (block.startsWith("### ")) {
          return (
            <h3 key={i} className="pt-2 text-base font-semibold text-slate-100">
              {block.slice(4)}
            </h3>
          );
        }
        if (block.startsWith("## ")) {
          return (
            <h2 key={i} className="pt-2 font-serif-display text-xl text-slate-50">
              {block.slice(3)}
            </h2>
          );
        }
        if (block.startsWith("```")) {
          const lines = block.split("\n");
          const code = lines.slice(1, lines[lines.length - 1]?.startsWith("```") ? -1 : undefined).join("\n");
          return (
            <pre
              key={i}
              className="overflow-x-auto rounded-lg border border-slate-800 bg-black/50 p-3 font-mono text-[11px] text-cyan-100/90"
            >
              {code}
            </pre>
          );
        }
        if (/^\|.+\|/.test(block)) {
          const rows = block
            .split("\n")
            .filter((l) => l.includes("|") && !/^\|?\s*-+/.test(l))
            .map((l) =>
              l
                .split("|")
                .map((c) => c.trim())
                .filter(Boolean),
            );
          if (rows.length) {
            return (
              <div key={i} className="overflow-x-auto rounded-lg border border-slate-800">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-slate-800 text-slate-500">
                    <tr>
                      {rows[0]!.map((c) => (
                        <th key={c} className="px-3 py-2 font-medium">
                          {c}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.slice(1).map((r, ri) => (
                      <tr key={ri} className="border-b border-slate-800/80">
                        {r.map((c, ci) => (
                          <td key={ci} className="px-3 py-2 text-slate-300">
                            {c}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          }
        }
        if (block.startsWith("- ") || block.startsWith("1. ")) {
          const items = block.split("\n");
          return (
            <ul key={i} className="list-disc space-y-1 pl-5">
              {items.map((line, li) => (
                <li key={li}>{line.replace(/^(-|\d+\.)\s+/, "").replace(/\*\*(.+?)\*\*/g, "$1")}</li>
              ))}
            </ul>
          );
        }
        const html = block
          .replace(/\*\*(.+?)\*\*/g, "<strong class='text-slate-100'>$1</strong>")
          .replace(/`([^`]+)`/g, "<code class='rounded bg-slate-900 px-1 font-mono text-[11px] text-cyan-200'>$1</code>");
        return <p key={i} dangerouslySetInnerHTML={{ __html: html }} />;
      })}
    </div>
  );
}
