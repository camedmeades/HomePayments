import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Plus, Pencil, Archive, ArchiveRestore, GitMerge } from 'lucide-react';
import { api } from '@/lib/api';
import {
  Button,
  Label,
  NativeSelect,
} from '@/components/ui/primitives';
import { AppDialog } from '@/components/ui/AppDialog';
import { IconByName } from '@/components/ui/IconPicker';
import { CategoryForm } from '@/components/CategoryForm';
import type { Category } from '@shared/types';
import type { CategoryCreateInput } from '@shared/ipc-contract';

type Mode =
  | { kind: 'closed' }
  | { kind: 'create' }
  | { kind: 'edit'; category: Category }
  | { kind: 'merge'; source: Category };

export function Categories() {
  const qc = useQueryClient();
  const [mode, setMode] = useState<Mode>({ kind: 'closed' });
  const [showArchived, setShowArchived] = useState(false);
  const [mergeTargetId, setMergeTargetId] = useState('');

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: api.categories.list,
  });

  const createMutation = useMutation({
    mutationFn: (input: CategoryCreateInput) => api.categories.create(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['categories'] });
      toast.success('Category created');
      setMode({ kind: 'closed' });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const updateMutation = useMutation({
    mutationFn: (params: { id: string; input: CategoryCreateInput }) =>
      api.categories.update({ id: params.id, ...params.input }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['categories'] });
      toast.success('Category updated');
      setMode({ kind: 'closed' });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const archiveMutation = useMutation({
    mutationFn: (id: string) => api.categories.archive(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['categories'] });
      toast.success('Category archived');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const restoreMutation = useMutation({
    mutationFn: (id: string) => api.categories.restore(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['categories'] });
      toast.success('Category restored');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const mergeMutation = useMutation({
    mutationFn: (params: { sourceId: string; targetId: string }) =>
      api.categories.merge(params),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['categories'] });
      toast.success('Categories merged');
      setMode({ kind: 'closed' });
      setMergeTargetId('');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const active = categories.filter((c) => !c.isArchived);
  const archived = categories.filter((c) => c.isArchived);
  const shown = showArchived ? categories : active;

  return (
    <div className="max-w-4xl space-y-4">
      <div className="flex items-end justify-between">
        <div>
          <h2 className="font-semibold text-lg">Categories</h2>
          <p className="text-sm text-ink-dim mt-1">
            Group bills by type. Use Merge when you find duplicates over time.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {archived.length > 0 && (
            <Button variant="ghost" size="sm" onClick={() => setShowArchived((v) => !v)}>
              {showArchived ? 'Hide archived' : `Show archived (${archived.length})`}
            </Button>
          )}
          <Button variant="primary" onClick={() => setMode({ kind: 'create' })}>
            <Plus size={14} /> New category
          </Button>
        </div>
      </div>

      <div className="panel">
        {isLoading && <div className="panel-body text-sm text-ink-dim">Loading…</div>}
        {!isLoading && shown.length === 0 && (
          <div className="panel-body text-sm text-ink-dim">No categories yet.</div>
        )}
        {!isLoading && shown.length > 0 && (
          <ul className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 divide-border">
            {shown.map((c, i) => (
              <li
                key={c.id}
                className={`flex items-center gap-3 px-5 py-3 ${i % 2 && 'sm:border-l'} border-border ${c.isArchived ? 'opacity-50' : ''}`}
              >
                <span
                  className="w-8 h-8 rounded-md flex items-center justify-center text-white shrink-0"
                  style={{ background: c.colour }}
                >
                  <IconByName name={c.icon} size={14} />
                </span>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate">{c.name}</div>
                  {c.isArchived && (
                    <div className="text-xs text-ink-dim">archived</div>
                  )}
                </div>
                <div className="flex items-center gap-0.5">
                  {!c.isArchived && (
                    <>
                      <Button
                        size="sm"
                        variant="ghost"
                        title="Edit"
                        onClick={() => setMode({ kind: 'edit', category: c })}
                      >
                        <Pencil size={13} />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        title="Merge into another category"
                        onClick={() => setMode({ kind: 'merge', source: c })}
                      >
                        <GitMerge size={13} />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        title="Archive"
                        onClick={() => {
                          if (confirm(`Archive "${c.name}"?`))
                            archiveMutation.mutate(c.id);
                        }}
                      >
                        <Archive size={13} />
                      </Button>
                    </>
                  )}
                  {c.isArchived && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => restoreMutation.mutate(c.id)}
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
        title="New category"
      >
        {mode.kind === 'create' && (
          <CategoryForm
            submitLabel="Create"
            onSubmit={(values) =>
              createMutation.mutateAsync(values).then(() => undefined)
            }
            onCancel={() => setMode({ kind: 'closed' })}
          />
        )}
      </AppDialog>

      <AppDialog
        open={mode.kind === 'edit'}
        onOpenChange={(o) => !o && setMode({ kind: 'closed' })}
        title="Edit category"
      >
        {mode.kind === 'edit' && (
          <CategoryForm
            initialValues={{
              name: mode.category.name,
              colour: mode.category.colour,
              icon: mode.category.icon,
            }}
            submitLabel="Save changes"
            onSubmit={(values) =>
              updateMutation
                .mutateAsync({ id: mode.category.id, input: values })
                .then(() => undefined)
            }
            onCancel={() => setMode({ kind: 'closed' })}
          />
        )}
      </AppDialog>

      <AppDialog
        open={mode.kind === 'merge'}
        onOpenChange={(o) => {
          if (!o) {
            setMode({ kind: 'closed' });
            setMergeTargetId('');
          }
        }}
        title="Merge category"
        description="All bills and supplier defaults will be moved to the target. The source is then archived."
      >
        {mode.kind === 'merge' && (
          <div className="p-5 space-y-4">
            <div className="text-sm">
              Merge{' '}
              <span className="font-semibold">{mode.source.name}</span> into:
            </div>
            <div>
              <Label htmlFor="merge-target">Target category</Label>
              <NativeSelect
                id="merge-target"
                value={mergeTargetId}
                onChange={(e) => setMergeTargetId(e.target.value)}
              >
                <option value="">Select a category…</option>
                {active
                  .filter((c) => c.id !== mode.source.id)
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
              </NativeSelect>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-border -mx-5 px-5 -mb-5 pb-5">
              <Button variant="ghost" onClick={() => setMode({ kind: 'closed' })}>
                Cancel
              </Button>
              <Button
                variant="primary"
                disabled={!mergeTargetId}
                onClick={() =>
                  mergeMutation.mutate({
                    sourceId: mode.source.id,
                    targetId: mergeTargetId,
                  })
                }
              >
                Merge
              </Button>
            </div>
          </div>
        )}
      </AppDialog>
    </div>
  );
}
