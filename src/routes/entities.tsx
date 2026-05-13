import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Plus, Pencil, Archive, ArchiveRestore } from 'lucide-react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/primitives';
import { AppDialog } from '@/components/ui/AppDialog';
import { IconByName } from '@/components/ui/IconPicker';
import { EntityForm } from '@/components/EntityForm';
import type { Entity } from '@shared/types';
import type { EntityCreateInput } from '@shared/ipc-contract';

type Mode =
  | { kind: 'closed' }
  | { kind: 'create' }
  | { kind: 'edit'; entity: Entity };

export function Entities() {
  const qc = useQueryClient();
  const [mode, setMode] = useState<Mode>({ kind: 'closed' });
  const [showArchived, setShowArchived] = useState(false);

  const { data: entities = [], isLoading } = useQuery({
    queryKey: ['entities'],
    queryFn: api.entities.list,
  });

  const createMutation = useMutation({
    mutationFn: (input: EntityCreateInput) => api.entities.create(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['entities'] });
      toast.success('Entity created');
      setMode({ kind: 'closed' });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const updateMutation = useMutation({
    mutationFn: (params: { id: string; input: EntityCreateInput }) =>
      api.entities.update({ id: params.id, ...params.input }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['entities'] });
      toast.success('Entity updated');
      setMode({ kind: 'closed' });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const archiveMutation = useMutation({
    mutationFn: (id: string) => api.entities.archive(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['entities'] });
      toast.success('Entity archived');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const restoreMutation = useMutation({
    mutationFn: (id: string) => api.entities.restore(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['entities'] });
      toast.success('Entity restored');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const active = entities.filter((e) => !e.isArchived);
  const archived = entities.filter((e) => e.isArchived);
  const shown = showArchived ? entities : active;

  return (
    <div className="max-w-3xl space-y-4">
      <div className="flex items-end justify-between">
        <div>
          <h2 className="font-semibold text-lg">Entities</h2>
          <p className="text-sm text-ink-dim mt-1">
            Group bills by who owns them — useful for tax and reporting.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {archived.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowArchived((v) => !v)}
            >
              {showArchived ? 'Hide archived' : `Show archived (${archived.length})`}
            </Button>
          )}
          <Button variant="primary" onClick={() => setMode({ kind: 'create' })}>
            <Plus size={14} /> New entity
          </Button>
        </div>
      </div>

      <div className="panel">
        {isLoading && <div className="panel-body text-sm text-ink-dim">Loading…</div>}
        {!isLoading && shown.length === 0 && (
          <div className="panel-body text-sm text-ink-dim">
            No entities yet. Create one to get started.
          </div>
        )}
        {!isLoading && shown.length > 0 && (
          <ul className="divide-y divide-border">
            {shown.map((e) => (
              <li
                key={e.id}
                className={`flex items-center gap-3 px-5 py-3 ${e.isArchived ? 'opacity-50' : ''}`}
              >
                <span
                  className="w-9 h-9 rounded-md flex items-center justify-center text-white shrink-0"
                  style={{ background: e.colour }}
                >
                  <IconByName name={e.icon} size={16} />
                </span>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm flex items-center gap-2">
                    {e.name}
                    {e.isArchived && (
                      <span className="text-xs font-normal text-ink-dim">
                        (archived)
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-ink-dim capitalize">{e.type}</div>
                </div>
                <div className="flex items-center gap-1">
                  {!e.isArchived && (
                    <>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setMode({ kind: 'edit', entity: e })}
                      >
                        <Pencil size={13} />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          if (confirm(`Archive "${e.name}"?`)) archiveMutation.mutate(e.id);
                        }}
                      >
                        <Archive size={13} />
                        Archive
                      </Button>
                    </>
                  )}
                  {e.isArchived && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => restoreMutation.mutate(e.id)}
                    >
                      <ArchiveRestore size={13} />
                      Restore
                    </Button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <AppDialog
        open={mode.kind === 'create'}
        onOpenChange={(o) => !o && setMode({ kind: 'closed' })}
        title="New entity"
        description="Personal, Investment, Business, or anything custom."
      >
        {mode.kind === 'create' && (
          <EntityForm
            submitLabel="Create"
            onSubmit={(values) => createMutation.mutateAsync(values).then(() => undefined)}
            onCancel={() => setMode({ kind: 'closed' })}
          />
        )}
      </AppDialog>

      <AppDialog
        open={mode.kind === 'edit'}
        onOpenChange={(o) => !o && setMode({ kind: 'closed' })}
        title="Edit entity"
      >
        {mode.kind === 'edit' && (
          <EntityForm
            initialValues={{
              name: mode.entity.name,
              type: mode.entity.type,
              colour: mode.entity.colour,
              icon: mode.entity.icon,
            }}
            submitLabel="Save changes"
            onSubmit={(values) =>
              updateMutation
                .mutateAsync({ id: mode.entity.id, input: values })
                .then(() => undefined)
            }
            onCancel={() => setMode({ kind: 'closed' })}
          />
        )}
      </AppDialog>
    </div>
  );
}
