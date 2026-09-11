import type { SelectHTMLAttributes } from 'react';

interface FilterOption {
  value: string;
  label: string;
}

interface FilterSelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  options: FilterOption[];
}

export function FilterSelect({ options, className = '', ...rest }: FilterSelectProps) {
  return (
    <select
      className={`rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:border-brand-800 focus:outline-none focus:ring-2 focus:ring-brand-800/20 ${className}`}
      {...rest}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}
