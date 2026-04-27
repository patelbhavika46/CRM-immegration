import { ReactNode } from 'react';

interface Props {
  label: string;
  required?: boolean;
  children: ReactNode;
}

export default function FormField({ label, required, children }: Props) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}
