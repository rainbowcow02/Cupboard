import DateTimePicker from '@react-native-community/datetimepicker';
import { StyleProp, ViewStyle } from 'react-native';

interface DateFieldProps {
  value: Date;
  onChange: (date: Date) => void;
  style?: StyleProp<ViewStyle>;
}

export function DateField({ value, onChange, style }: DateFieldProps) {
  return (
    <DateTimePicker
      value={value}
      mode="date"
      display="compact"
      onChange={(_, date) => date && onChange(date)}
      style={style}
      themeVariant="light"
    />
  );
}
