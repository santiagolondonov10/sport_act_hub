import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';

const baseFieldClasses =
  'w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-brand-800 focus:outline-none focus:ring-2 focus:ring-brand-800/20 disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed';

interface FieldWrapperProps {
  label: string;
  htmlFor: string;
  required?: boolean;
  hint?: string;
  children: ReactNode;
}

export function FieldWrapper({ label, htmlFor, required, hint, children }: FieldWrapperProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="text-sm font-medium text-gray-700">
        {label} {required && <span className="text-danger-500">*</span>}
      </label>
      {children}
      {hint && <span className="text-xs text-gray-500">{hint}</span>}
    </div>
  );
}

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  hint?: string;
}

export function TextField({ label, hint, id, required, className = '', ...rest }: TextFieldProps) {
  const inputId = id ?? label.toLowerCase().replace(/\s+/g, '-');
  return (
    <FieldWrapper label={label} htmlFor={inputId} required={required} hint={hint}>
      <input id={inputId} className={`${baseFieldClasses} ${className}`} required={required} {...rest} />
    </FieldWrapper>
  );
}

interface TextAreaFieldProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  hint?: string;
}

export function TextAreaField({ label, hint, id, required, className = '', ...rest }: TextAreaFieldProps) {
  const inputId = id ?? label.toLowerCase().replace(/\s+/g, '-');
  return (
    <FieldWrapper label={label} htmlFor={inputId} required={required} hint={hint}>
      <textarea id={inputId} className={`${baseFieldClasses} ${className}`} required={required} {...rest} />
    </FieldWrapper>
  );
}

interface SelectOption {
  value: string;
  label: string;
}

interface SelectFieldProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  options: SelectOption[];
  hint?: string;
}

export function SelectField({ label, hint, id, required, options, className = '', ...rest }: SelectFieldProps) {
  const inputId = id ?? label.toLowerCase().replace(/\s+/g, '-');
  return (
    <FieldWrapper label={label} htmlFor={inputId} required={required} hint={hint}>
      <select id={inputId} className={`${baseFieldClasses} ${className}`} required={required} {...rest}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </FieldWrapper>
  );
}
