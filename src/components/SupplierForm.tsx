import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { SupplierCreateSchema, type SupplierCreateInput } from '@shared/ipc-contract';
import {
  Button,
  Input,
  Label,
  FieldError,
  NativeSelect,
} from '@/components/ui/primitives';
import type { Entity, Category } from '@shared/types';

interface Props {
  entities: Entity[];
  categories: Category[];
  initialValues?: Partial<SupplierCreateInput>;
  submitLabel: string;
  onSubmit: (values: SupplierCreateInput) => Promise<void>;
  onCancel: () => void;
}

export function SupplierForm({
  entities,
  categories,
  initialValues,
  submitLabel,
  onSubmit,
  onCancel,
}: Props) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SupplierCreateInput>({
    resolver: zodResolver(SupplierCreateSchema),
    defaultValues: {
      name: initialValues?.name ?? '',
      domain: initialValues?.domain ?? '',
      defaultEntityId: initialValues?.defaultEntityId ?? null,
      defaultCategoryId: initialValues?.defaultCategoryId ?? null,
    },
  });

  return (
    <form
      onSubmit={handleSubmit(async (values) => {
        // Normalise empty strings to null for nullable fields.
        const cleaned: SupplierCreateInput = {
          ...values,
          domain: values.domain?.trim() ? values.domain.trim() : null,
          defaultEntityId: values.defaultEntityId || null,
          defaultCategoryId: values.defaultCategoryId || null,
        };
        await onSubmit(cleaned);
      })}
      className="p-5 space-y-4"
    >
      <div>
        <Label htmlFor="supplier-name">Name</Label>
        <Input
          id="supplier-name"
          invalid={!!errors.name}
          placeholder="e.g. AGL, Origin Energy, Telstra"
          {...register('name')}
        />
        <FieldError message={errors.name?.message} />
      </div>

      <div>
        <Label htmlFor="supplier-domain">Email domain (optional)</Label>
        <Input
          id="supplier-domain"
          placeholder="e.g. agl.com.au"
          {...register('domain')}
        />
        <p className="text-xs text-ink-dim mt-1">
          Used later to match Gmail emails to this supplier automatically.
        </p>
      </div>

      <div>
        <Label htmlFor="supplier-entity">Default entity (optional)</Label>
        <NativeSelect id="supplier-entity" {...register('defaultEntityId')}>
          <option value="">— None —</option>
          {entities.map((e) => (
            <option key={e.id} value={e.id}>
              {e.name}
            </option>
          ))}
        </NativeSelect>
      </div>

      <div>
        <Label htmlFor="supplier-category">Default category (optional)</Label>
        <NativeSelect id="supplier-category" {...register('defaultCategoryId')}>
          <option value="">— None —</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </NativeSelect>
        <p className="text-xs text-ink-dim mt-1">
          New bills from this supplier will pre-fill with these defaults.
        </p>
      </div>

      <div className="flex justify-end gap-2 pt-2 border-t border-border -mx-5 px-5 -mb-5 pb-5">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" disabled={isSubmitting}>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
