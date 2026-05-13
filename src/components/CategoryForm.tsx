import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CategoryCreateSchema, type CategoryCreateInput } from '@shared/ipc-contract';
import { Button, Input, Label, FieldError } from '@/components/ui/primitives';
import { ColourPicker } from '@/components/ui/ColourPicker';
import { IconPicker, IconByName } from '@/components/ui/IconPicker';

interface Props {
  initialValues?: Partial<CategoryCreateInput>;
  submitLabel: string;
  onSubmit: (values: CategoryCreateInput) => Promise<void>;
  onCancel: () => void;
}

export function CategoryForm({ initialValues, submitLabel, onSubmit, onCancel }: Props) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CategoryCreateInput>({
    resolver: zodResolver(CategoryCreateSchema),
    defaultValues: {
      name: initialValues?.name ?? '',
      colour: initialValues?.colour ?? '#737373',
      icon: initialValues?.icon ?? 'Tag',
      parentCategoryId: initialValues?.parentCategoryId ?? null,
    },
  });

  const colour = watch('colour');
  const icon = watch('icon');

  return (
    <form
      onSubmit={handleSubmit(async (values) => {
        await onSubmit(values);
      })}
      className="p-5 space-y-4"
    >
      <div className="flex items-center gap-3">
        <span
          className="w-10 h-10 rounded-md flex items-center justify-center text-white shrink-0"
          style={{ background: colour }}
        >
          <IconByName name={icon} size={20} />
        </span>
        <div className="flex-1">
          <Label htmlFor="cat-name">Name</Label>
          <Input
            id="cat-name"
            invalid={!!errors.name}
            placeholder="e.g. Electricity, Council rates, Streaming"
            {...register('name')}
          />
          <FieldError message={errors.name?.message} />
        </div>
      </div>

      <div>
        <Label>Colour</Label>
        <ColourPicker value={colour} onChange={(c) => setValue('colour', c)} />
        <FieldError message={errors.colour?.message} />
      </div>

      <div>
        <Label>Icon</Label>
        <IconPicker value={icon} onChange={(i) => setValue('icon', i)} />
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
