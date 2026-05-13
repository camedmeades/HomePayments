import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Store } from 'lucide-react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/primitives';
import { AppDialog } from '@/components/ui/AppDialog';
import { SupplierForm } from '@/components/SupplierForm';
import type { Supplier } from '@shared/types';
import type { SupplierCreateInput } from '@shared/ipc-contract';

type Mode =
  | { kind: 'closed' }
  | { kind: 'create' }
  | { kind: 'edit'; supplier: Supplier };

export function Suppliers() {
  const qc = useQueryClient();
  const [mode, setMode] = useState<Mode>({ kind: 'closed' });

  const { data: suppliers = [], isLoading } = useQuery({
    queryKey: ['suppliers'],
    queryFn: api.suppliers.list,
  });
  const { data: entities = [] } = useQuery({
    queryKey: ['entities'],
    queryFn: api.entities.list,
  });
  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: api.categories.list,
  });

  const createMutation = useMutation({
    mutationFn: (input: SupplierCreateInput) => api.suppliers.create(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['suppliers'] });
      toast.success('Supplier created');
      setMode({ kind: 'closed' });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const updateMutation = useMutation({
    mutationFn: (params: { id: string; input: SupplierCreateInput }) =>
      api.suppliers.update({ id: params.id, ...params.input }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['suppliers'] });
      toast.success('Supplier updated');
      setMode({ kind: 'closed' });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const archiveMutation = useMutation({
    mutationFn: (id: string) => api.suppliers.archive(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['suppliers'] });
      toast.success('Supplier removed');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const entityById = new Map(entities.map((e) => [e.id, e]));
  const categoryById = new Map(categories.map((c) => [c.id, c]));

  return (
    <div className="max-w-4xl space-y-4">
      <div className="flex items-end justify-between">
        <div>
          <h2 className="font-semibold text-lg">Suppliers</h2>
          <p className="text-sm text-ink-dim mt-1">
            Companies you receive bills from. Gmail-detected suppliers will appear here
            once Phase 2 is wired up.
          </p>
        </div>
        <Button variant="primary" onClick={() => setMode({ kind: 'create' })}>
          <Plus size={14} /> New supplier
        </Button>
      </div>

      <div className="panel">
        {isLoading && <div className="panel-body text-sm text-ink-dim">Loading…</div>}
        {!isLoading && suppliers.length === 0 && (
          <div className="panel-body py-10 text-center">
            <Store className="mx-auto text-ink-dim mb-3" size={28} strokeWidth={1.5} />
            <p className="text-sm font-medium">No suppliers yet</p>
            <p className="text-xs text-ink-dim mt-1 mb-4 max-w-sm mx-auto">
              Add suppliers manually now, or wait until Gmail sync auto-discovers them
              from your bill emails.
            </p>
            <Button variant="default" size="sm" onClick={() => setMode({ kind: 'create' })}>
              <Plus size={13} /> Add your first supplier
            </Button>
          </div>
        )}
        {!isLoading && suppliers.length > 0 && (
          <table className="w-full text-sm">
            <thead className="text-xs text-ink-dim uppercase tracking-wider border-b border-border">
              <tr>
                <th className="text-left px-5 py-3 font-medium">Name</th>
                <th className="text-left px-5 py-3 font-medium">Domain</th>
                <th className="text-left px-5 py-3 font-medium">Default entity</th>
                <th className="text-left px-5 py-3 font-medium">Default category</th>
                <th className="text-right px-5 py-3 font-medium" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {suppliers.map((s) => (
                <tr key={s.id} className="hover:bg-bg">
                  <td className="px-5 py-3 font-medium">{s.name}</td>
                  <td className="px-5 py-3 text-ink-dim">{s.domain ?? '—'}</td>
                  <td className="px-5 py-3 text-ink-dim">
                    {s.defaultEntityId ? entityById.get(s.defaultEntityId)?.name ?? '—' : '—'}
                  </td>
                  <td className="px-5 py-3 text-ink-dim">
                    {s.defaultCategoryId
                      ? categoryById.get(s.defaultCategoryId)?.name ?? '—'
                      : '—'}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        title="Edit"
                        onClick={() => setMode({ kind: 'edit', supplier: s })}
                      >
                        <Pencil size={13} />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        title="Remove"
                        onClick={() => {
                          if (confirm(`Remove supplier "${s.name}"?`))
                            archiveMutation.mutate(s.id);
                        }}
                      >
                        <Trash2 size={13} />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <AppDialog
        open={mode.kind === 'create'}
        onOpenChange={(o) => !o && setMode({ kind: 'closed' })}
        title="New supplier"
        maxWidth="lg"
      >
        {mode.kind === 'create' && (
          <SupplierForm
            entities={entities.filter((e) => !e.isArchived)}
            categories={categories.filter((c) => !c.isArchived)}
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
        title="Edit supplier"
        maxWidth="lg"
      >
        {mode.kind === 'edit' && (
          <SupplierForm
            entities={entities.filter((e) => !e.isArchived)}
            categories={categories.filter((c) => !c.isArchived)}
            initialValues={{
              name: mode.supplier.name,
              domain: mode.supplier.domain ?? undefined,
              defaultEntityId: mode.supplier.defaultEntityId ?? undefined,
              defaultCategoryId: mode.supplier.defaultCategoryId ?? undefined,
            }}
            submitLabel="Save changes"
            onSubmit={(values) =>
              updateMutation
                .mutateAsync({ id: mode.supplier.id, input: values })
                .then(() => undefined)
            }
            onCancel={() => setMode({ kind: 'closed' })}
          />
        )}
      </AppDialog>
    </div>
  );
}
