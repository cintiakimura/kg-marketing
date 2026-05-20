/**
 * Shadcn UI components are JSX without exported prop types.
 * Declarations clear TypeScript errors in pages using checkJs.
 */
import type { ComponentType, ReactNode } from 'react';

type UiProps = {
  children?: ReactNode;
  className?: string;
  [key: string]: unknown;
};

declare module '@/components/ui/button' {
  export const Button: ComponentType<UiProps>;
}

declare module '@/components/ui/input' {
  export const Input: ComponentType<UiProps>;
}

declare module '@/components/ui/label' {
  export const Label: ComponentType<UiProps>;
}

declare module '@/components/ui/badge' {
  export const Badge: ComponentType<UiProps>;
}

declare module '@/components/ui/dialog' {
  export const Dialog: ComponentType<UiProps>;
  export const DialogContent: ComponentType<UiProps>;
  export const DialogHeader: ComponentType<UiProps>;
  export const DialogTitle: ComponentType<UiProps>;
  export const DialogDescription: ComponentType<UiProps>;
}

declare module '@/components/ui/card' {
  export const Card: ComponentType<UiProps>;
  export const CardHeader: ComponentType<UiProps>;
  export const CardTitle: ComponentType<UiProps>;
  export const CardContent: ComponentType<UiProps>;
}

declare module '@/components/ui/checkbox' {
  export const Checkbox: ComponentType<UiProps>;
}

declare module '@/components/ui/select' {
  export const Select: ComponentType<UiProps>;
  export const SelectTrigger: ComponentType<UiProps>;
  export const SelectContent: ComponentType<UiProps>;
  export const SelectItem: ComponentType<UiProps>;
  export const SelectValue: ComponentType<UiProps>;
}

declare module '@/components/ui/textarea' {
  export const Textarea: ComponentType<UiProps>;
}

declare module '@/components/ui/progress' {
  export const Progress: ComponentType<UiProps>;
}

declare module '@/components/ui/collapsible' {
  export const Collapsible: ComponentType<UiProps>;
  export const CollapsibleTrigger: ComponentType<UiProps>;
  export const CollapsibleContent: ComponentType<UiProps>;
}
