import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '@shared/theme';
import { BackButton } from '../BackButton';

interface Props {
  title?: string;
  subtitle?: string;
  onBack?: () => void;
  actionLabel?: string;
  onAction?: () => void;
  actionDisabled?: boolean;
}

export function LogHeader({
  title,
  subtitle,
  onBack,
  actionLabel,
  onAction,
  actionDisabled,
}: Props) {
  return (
    <View style={styles.header}>
      <View style={styles.headerSide}>
        {onBack ? <BackButton onPress={onBack} /> : null}
      </View>
      <View style={styles.headerCenter}>
        {title ? <Text style={styles.title}>{title}</Text> : null}
        {subtitle ? <Text style={styles.subtitle} numberOfLines={2}>{subtitle}</Text> : null}
      </View>
      <View style={styles.headerSide}>
        {actionLabel && onAction ? (
          <Pressable
            onPress={onAction}
            disabled={actionDisabled}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={actionLabel}
          >
            <Text style={[styles.action, actionDisabled && styles.actionDisabled]}>{actionLabel}</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
    gap: 8,
  },
  headerSide: {
    width: 72,
    minHeight: 24,
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  title: {
    fontFamily: fonts.serif,
    fontSize: 28,
    color: colors.black,
    lineHeight: 32,
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: fonts.sans,
    fontWeight: '500',
    fontSize: 13,
    color: colors.greyDark,
    textAlign: 'center',
    lineHeight: 18,
  },
  action: {
    fontFamily: fonts.sans,
    fontWeight: '800',
    fontSize: 15,
    color: colors.burgundy,
    textAlign: 'right',
  },
  actionDisabled: { color: '#b9a99a' },
});
