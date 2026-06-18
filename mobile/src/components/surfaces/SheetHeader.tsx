import { Text, View } from 'react-native';
import { SheetClearButton } from './SheetClearButton';
import { floatingSurfaceStyles } from './floatingSurfaceStyles';

interface SheetHeaderProps {
  title: string;
  subtitle?: string;
  onClear?: () => void;
  clearAccessibilityLabel?: string;
  showClear?: boolean;
  animatedClear?: boolean;
  variant?: 'filter' | 'explore';
}

export function SheetHeader({
  title,
  subtitle,
  onClear,
  clearAccessibilityLabel,
  showClear = false,
  animatedClear = false,
  variant = 'filter',
}: SheetHeaderProps) {
  const headerStyle = variant === 'explore'
    ? floatingSurfaceStyles.headerExplore
    : floatingSurfaceStyles.header;

  return (
    <View style={headerStyle}>
      <View
        style={[
          floatingSurfaceStyles.headerTitleWrap,
          subtitle ? floatingSurfaceStyles.headerTitleWrapExplore : undefined,
        ]}
      >
        <Text style={floatingSurfaceStyles.title} numberOfLines={subtitle ? 1 : undefined}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={floatingSurfaceStyles.subtitle}>{subtitle}</Text>
        ) : null}
      </View>
      {onClear && clearAccessibilityLabel ? (
        <SheetClearButton
          onPress={onClear}
          accessibilityLabel={clearAccessibilityLabel}
          showClear={showClear}
          animated={animatedClear}
        />
      ) : null}
    </View>
  );
}
