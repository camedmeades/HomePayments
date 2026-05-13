import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import type { ReactNode } from 'react';

interface AppDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg';
}

const widths = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-2xl',
};

export function AppDialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  maxWidth = 'md',
}: AppDialogProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm data-[state=open]:animate-in data-[state=open]:fade-in z-40" />
        <Dialog.Content
          className={`fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full ${widths[maxWidth]} bg-panel border border-border rounded-lg shadow-xl z-50 max-h-[85vh] overflow-hidden flex flex-col`}
        >
          <div className="flex items-start justify-between px-5 py-4 border-b border-border">
            <div>
              <Dialog.Title className="font-semibold text-sm">{title}</Dialog.Title>
              {description && (
                <Dialog.Description className="text-xs text-ink-dim mt-1">
                  {description}
                </Dialog.Description>
              )}
            </div>
            <Dialog.Close asChild>
              <button
                className="text-ink-dim hover:text-ink p-1 -mr-1 rounded"
                aria-label="Close"
              >
                <X size={16} />
              </button>
            </Dialog.Close>
          </div>
          <div className="overflow-y-auto">{children}</div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
