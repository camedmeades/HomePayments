import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Activity, Database, KeyRound, Layers, Tags } from 'lucide-react';

export function Dashboard() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['health'],
    queryFn: api.health,
  });

  return (
    <div className="space-y-6 max-w-4xl">
      <section className="panel">
        <header className="panel-header flex items-center justify-between">
          <div>
            <h2 className="font-semibold">Welcome back</h2>
            <p className="text-sm text-ink-dim mt-1">
              You're looking at the Phase 1 scaffold. Once entities, categories and bills are
              wired in (next step), this page will show urgent items, totals and insights.
            </p>
          </div>
        </header>
      </section>

      <section className="panel">
        <header className="panel-header">
          <h3 className="font-semibold text-sm tracking-tight flex items-center gap-2">
            <Activity size={15} /> System status
          </h3>
        </header>
        <div className="panel-body">
          {isLoading && <p className="text-sm text-ink-dim">Checking…</p>}
          {error && (
            <p className="text-sm text-bad">
              Could not reach the main process: {String(error)}
            </p>
          )}
          {data && (
            <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm">
              <Stat label="App version" value={`v${data.appVersion}`} />
              <Stat
                label="Schema"
                value={`#${data.dbSchemaVersion}`}
                Icon={Database}
              />
              <Stat label="Entities seeded" value={data.entityCount} Icon={Layers} />
              <Stat label="Categories seeded" value={data.categoryCount} Icon={Tags} />
              <Stat
                label="Encryption"
                value={data.encryptionAvailable ? 'Active' : 'Unavailable'}
                Icon={KeyRound}
                tone={data.encryptionAvailable ? 'ok' : 'warn'}
              />
              <div className="col-span-2">
                <div className="text-ink-dim text-xs uppercase tracking-wider mb-1">
                  Database file
                </div>
                <code className="text-xs bg-bg px-2 py-1 rounded border border-border break-all">
                  {data.dbPath}
                </code>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function Stat({
  label,
  value,
  Icon,
  tone = 'neutral',
}: {
  label: string;
  value: string | number;
  Icon?: typeof Database;
  tone?: 'neutral' | 'ok' | 'warn' | 'bad';
}) {
  const toneClass =
    tone === 'ok' ? 'text-ok' : tone === 'warn' ? 'text-warn' : tone === 'bad' ? 'text-bad' : '';
  return (
    <div>
      <div className="text-ink-dim text-xs uppercase tracking-wider mb-1 flex items-center gap-1.5">
        {Icon && <Icon size={11} />}
        {label}
      </div>
      <div className={`font-medium ${toneClass}`}>{value}</div>
    </div>
  );
}
