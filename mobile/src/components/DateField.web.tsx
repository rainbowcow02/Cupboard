import { fonts } from '@shared/theme';
import { createElement, type CSSProperties } from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import { fieldInputStyle } from './FormField';

interface DateFieldProps {
  value: Date;
  onChange: (date: Date) => void;
  style?: StyleProp<ViewStyle>;
}

function toISODate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function DateField({ value, onChange }: DateFieldProps) {
  const inputStyle: CSSProperties = {
    ...fieldInputStyle,
    width: '100%',
    boxSizing: 'border-box',
    fontFamily: fonts.sans,
  };

  return createElement('input', {
    type: 'date',
    value: toISODate(value),
    onChange: (event: React.ChangeEvent<HTMLInputElement>) => {
      const next = event.target.value;
      if (next) onChange(new Date(`${next}T12:00:00`));
    },
    style: inputStyle,
    'aria-label': 'Date',
  });
}
