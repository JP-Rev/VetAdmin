import React, { ReactNode } from 'react';
import { SearchableSelect } from './SearchableSelect';

interface FormFieldProps {
  label: string;
  name: string;
  type?: string;
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  error?: string;
  placeholder?: string;
  required?: boolean;
  as?: 'input' | 'textarea' | 'select' | 'searchable-select';
  options?: Array<{ value: string | number; label: string }>;
  disabled?: boolean;
  className?: string;
  rows?: number;
  min?: string | number;
  max?: string | number;
  step?: string | number;
  inputClassName?: string;
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  name,
  type = 'text',
  value,
  onChange,
  error,
  placeholder,
  required = false,
  as = 'input',
  options = [],
  disabled = false,
  className = '',
  rows = 3,
  min,
  max,
  step,
  inputClassName = '',
}) => {
  const commonInputClasses = `mt-1 block w-full px-3 py-2 border ${error ? 'border-error-500' : 'border-secondary-300'} rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm ${disabled ? 'bg-secondary-100 cursor-not-allowed' : 'bg-white'}`;

  // Convert options to the format expected by SearchableSelect
  const searchableOptions = options.map(option => ({
    value: String(option.value),
    label: option.label
  }));

  const allProps: any = {
    id: name,
    name,
    value: String(value),
    onChange,
    placeholder,
    required,
    disabled,
    className: `${commonInputClasses} ${inputClassName}`,
    min,
    max,
    step,
  };

  let inputElement: ReactNode;
  
  if (as === 'searchable-select') {
    return (
      <SearchableSelect
        label={label}
        name={name}
        value={String(value)}
        onChange={onChange}
        options={searchableOptions}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        error={error}
        className={className}
      />
    );
  } else if (as === 'textarea') {
    const { min: _min, max: _max, step: _step, ...textareaProps } = allProps;
    inputElement = <textarea {...textareaProps} rows={rows} />;
  } else if (as === 'select') {
    const { min: _min, max: _max, step: _step, ...selectProps } = allProps;
    inputElement = (
      <select {...selectProps}>
        {placeholder && <option value="">{placeholder}</option>}
        {options.map(option => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
    );
  } else {
    inputElement = <input type={type} {...allProps} />;
  }

  return (
    <div className={`mb-4 ${className}`}>
      <label htmlFor={name} className="block text-sm font-medium text-secondary-700">
        {label} {required && <span className="text-error-500">*</span>}
      </label>
      {inputElement}
      {error && <p className="mt-1 text-xs text-error-600">{error}</p>}
    </div>
  );
};