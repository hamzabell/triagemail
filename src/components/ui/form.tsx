import * as React from 'react';
import * as LabelPrimitive from '@radix-ui/react-label';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

import { Label } from '@/components/ui/label';

const formVariants = cva('space-y-2', {
  variants: {
    layout: {
      default: 'space-y-2',
      horizontal: 'grid grid-cols-3 gap-4',
    },
  },
  defaultVariants: {
    layout: 'default',
  },
});

export interface FormProps extends React.FormHTMLAttributes<HTMLFormElement>, VariantProps<typeof formVariants> {
  asChild?: boolean;
}

const Form = React.forwardRef<HTMLFormElement, FormProps>(({ className, layout, ...props }, ref) => {
  return <form ref={ref} className={cn(formVariants({ layout, className }))} {...props} />;
});
Form.displayName = 'Form';

const FormItem = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    return <div ref={ref} className={cn('space-y-2', className)} {...props} />;
  },
);
FormItem.displayName = 'FormItem';

const FormLabel = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root>
>(({ className, ...props }, ref) => {
  return (
    <Label
      ref={ref}
      className={cn(
        'text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
        className,
      )}
      {...props}
    />
  );
});
FormLabel.displayName = FormLabel.displayName;

const FormControl = React.forwardRef<
  React.ElementRef<typeof React.Fragment>,
  React.ComponentPropsWithoutRef<typeof React.Fragment>
>(({ ...props }, ref) => {
  return <React.Fragment ref={ref} {...props} />;
});
FormControl.displayName = 'FormControl';

const FormDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => {
    return <p ref={ref} className={cn('text-sm text-muted-foreground', className)} {...props} />;
  },
);
FormDescription.displayName = 'FormDescription';

const FormMessage = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, children, ...props }, ref) => {
    return (
      <p ref={ref} className={cn('text-sm font-medium text-destructive', className)} {...props}>
        {children}
      </p>
    );
  },
);
FormMessage.displayName = 'FormMessage';

const FormField = React.forwardRef<
  HTMLDivElement,
  {
    name: string;
    control?: any;
    render: (props: { field: unknown; fieldState: unknown }) => React.ReactElement;
  }
>(({ name, control, render, ...props }, ref) => {
  return <div ref={ref} {...props} />;
});
FormField.displayName = 'FormField';

export { Form, FormItem, FormLabel, FormControl, FormDescription, FormMessage, FormField, formVariants };
