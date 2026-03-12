import { useState } from 'react';
import { theme } from '../utils/theme';

export const FloatingLabel = ({ id, name, type = 'text', value, onChange, label, placeholder }) => {
  const [focused, setFocused] = useState(false);
  const active = focused || value;

  return (
    <div className="relative">
      <label
        htmlFor={id}
        className="absolute left-4 transition-all duration-200 pointer-events-none z-10"
        style={{
          top: active ? '6px' : '50%',
          transform: active ? 'translateY(0)' : 'translateY(-50%)',
          fontSize: active ? '10px' : '14px',
          color: focused ? theme.colors.primary.DEFAULT : theme.colors.gray[400],
          letterSpacing: active ? '0.05em' : '0',
          textTransform: active ? 'uppercase' : 'none',
          fontFamily: theme.fonts.serif,
        }}
      >
        {label}
      </label>
      <input
        id={id}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={active ? placeholder : ''}
        className="w-full rounded-xl border bg-white outline-none transition-all duration-200"
        style={{
          padding: active ? '22px 16px 8px' : '16px',
          borderColor: focused ? theme.colors.primary.DEFAULT : theme.colors.secondary.beige,
          boxShadow: focused ? '0 0 0 3px rgba(107, 126, 90, 0.1)' : 'none',
          fontSize: '14px',
          color: theme.colors.gray[700],
          fontFamily: theme.fonts.serif,
        }}
      />
    </div>
  );
};
