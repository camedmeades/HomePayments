import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { EntityCreateSchema, type EntityCreateInput } from '@shared/ipc-contract';
import {
  Button,
  Input,
  Label,
  FieldError,
  NativeSelect,
} from '@/components/ui/primitives';
import { ColourPicker } from '@/components/ui/ColourPicker';
import { IconPicker, IconByName } from '@/components/ui/IconPicker';

interface Props {
  initialValues?: Partial<EntityCreateInput>;
  submitLabel: string;
  onSubmit: (values: EntityCreateInput) => Promise<void>;
  onCancel: () => void;
}

export function EntityForm({ initialValues, submitLabel, onSubmit, onCancel }: Props) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<EntityCreateInput>({
    resolver: zodResolver(EntityCreateSchema),
    defaultValues: {
      name: initialValues?.name ?? '',
      type: initialValues?.type ?? 'personal',
      colour: initialValues?.colour ?? '#2563eb',
      icon: initialValues?.icon ?? 'Home',
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
          <Label htmlFor="entity-name">Name</Label>
          <Input
            id="entity-name"
            invalid={!!errors.name}
            placeholder="e.g. Personal, Investment, Smith Family Trust"
            {...register('name')}
          />
          <FieldError message={errors.name?.message} />
        </div>
      </div>

      <div>
        <Label htmlFor="entity-type">Type</Label>
        <NativeSelect id="entity-type" invalid={!!errors.type} {...register('type')}>
          <option value="personal">Personal</option>
          <option value="investment">Investment</option>
          <option value="business">Business</option>
          <option value="other">Other</option>
        </NativeSelect>
        <p className="text-xs text-ink-dim mt-1">
          Type drives default categorisation and how this entity appears in tax exports.
        </p>
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
