'use client';

interface EditableFieldProps {
  isEditing: boolean;
  value: string | number | null | undefined;
  onChange: (value: string) => void;
  label: string;
  type?: 'text' | 'email' | 'tel' | 'number' | 'date' | 'textarea' | 'url';
  placeholder?: string;
  min?: number;
  max?: number;
  rows?: number;
  displayValue?: string; // Override pour l'affichage en mode lecture
  linkPrefix?: string; // Pour créer un lien (mailto:, tel:, etc.)
  emptyText?: string; // Texte si vide
  className?: string;
}

export default function EditableField({
  isEditing,
  value,
  onChange,
  label,
  type = 'text',
  placeholder,
  min,
  max,
  rows = 2,
  displayValue,
  linkPrefix,
  emptyText = 'Non défini',
  className = '',
}: EditableFieldProps) {
  const stringValue = value?.toString() || '';
  const displayText = displayValue || stringValue || emptyText;

  if (!isEditing) {
    // Mode lecture
    if (linkPrefix && stringValue) {
      return (
        <a
          href={`${linkPrefix}${stringValue}`}
          className="text-violet-600 hover:underline"
          target={linkPrefix.startsWith('http') ? '_blank' : undefined}
          rel={linkPrefix.startsWith('http') ? 'noopener noreferrer' : undefined}
        >
          {displayText}
        </a>
      );
    }
    return (
      <span className={`text-gray-700 ${!stringValue ? 'text-gray-400 italic' : ''} ${className}`}>
        {displayText}
      </span>
    );
  }

  // Mode édition
  const baseClasses = 'w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 text-sm';

  if (type === 'textarea') {
    return (
      <textarea
        value={stringValue}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder || label}
        rows={rows}
        className={`${baseClasses} resize-none ${className}`}
      />
    );
  }

  return (
    <input
      type={type}
      value={type === 'date' && stringValue ? stringValue.split('T')[0] : stringValue}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder || label}
      min={min}
      max={max}
      className={`${baseClasses} ${className}`}
    />
  );
}

// Composant Select réutilisable
interface SelectFieldProps {
  isEditing: boolean;
  value: string | null | undefined;
  onChange: (value: string) => void;
  label: string;
  options: { value: string; label: string }[];
  displayValue?: string;
  emptyText?: string;
  className?: string;
}

export function SelectField({
  isEditing,
  value,
  onChange,
  label: _label,
  options,
  displayValue,
  emptyText = 'Non défini',
  className = '',
}: SelectFieldProps) {
  const stringValue = value || '';
  const selectedOption = options.find((o) => o.value === stringValue);
  const displayText = displayValue || selectedOption?.label || emptyText;

  if (!isEditing) {
    return (
      <span className={`text-gray-700 ${!stringValue ? 'text-gray-400 italic' : ''} ${className}`}>
        {displayText}
      </span>
    );
  }

  return (
    <select
      value={stringValue}
      onChange={(e) => onChange(e.target.value)}
      className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 text-sm ${className}`}
    >
      <option value="">Sélectionner...</option>
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

// Composant pour afficher un champ avec label
interface FieldRowProps {
  label: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function FieldRow({ label, icon, children, className = '' }: FieldRowProps) {
  return (
    <div className={className}>
      <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
      <div className="flex items-center gap-3">
        {icon && <span className="text-gray-400">{icon}</span>}
        {children}
      </div>
    </div>
  );
}
