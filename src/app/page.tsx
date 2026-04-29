const phases: {
  title: string;
  phase: string;
  description: string;
  status: "available" | "planned";
}[] = [
  {
    title: "Strava Sync",
    phase: "Phase 1",
    description:
      "Connect your Strava account and import run activity data locally.",
    status: "available",
  },
  {
    title: "Apple Health Import",
    phase: "Phase 2",
    description:
      "Import heart rate, HRV, sleep, and other health metrics from Apple Health exports.",
    status: "planned",
  },
  {
    title: "Dashboard",
    phase: "Phase 2",
    description:
      "View your running history, trends, and health data in one place.",
    status: "planned",
  },
  {
    title: "Training Analytics",
    phase: "Phase 3",
    description:
      "Deterministic training load, fitness, fatigue, and race projections computed from your local data.",
    status: "planned",
  },
  {
    title: "Grounded AI Chat",
    phase: "Phase 4",
    description:
      "Ask questions about your training grounded entirely in your local data. No hallucinations.",
    status: "planned",
  },
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100 px-6 py-16">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-14">
          <h1 className="text-5xl font-bold tracking-tight text-white mb-3">
            FarSygil
          </h1>
          <p className="text-xl text-zinc-400">
            Local-first running command center.
          </p>
        </div>

        {/* Phase cards */}
        <div className="grid gap-4">
          {phases.map((item) => (
            <div
              key={item.title}
              className={[
                "rounded-xl border px-6 py-5 transition-colors",
                item.status === "available"
                  ? "border-zinc-600 bg-zinc-900 hover:border-zinc-400"
                  : "border-zinc-800 bg-zinc-900/50 opacity-60",
              ].join(" ")}
            >
              <div className="flex items-center justify-between mb-1">
                <h2 className="text-lg font-semibold text-white">
                  {item.title}
                </h2>
                <span
                  className={[
                    "text-xs font-medium px-2 py-0.5 rounded-full",
                    item.status === "available"
                      ? "bg-emerald-900/60 text-emerald-400 border border-emerald-800"
                      : "bg-zinc-800 text-zinc-500 border border-zinc-700",
                  ].join(" ")}
                >
                  {item.phase}
                </span>
              </div>
              <p className="text-sm text-zinc-400">{item.description}</p>
            </div>
          ))}
        </div>

        {/* Footer note */}
        <p className="mt-14 text-xs text-zinc-600 text-center">
          All data is stored locally. Nothing leaves your machine.
        </p>
      </div>
    </main>
  );
}
