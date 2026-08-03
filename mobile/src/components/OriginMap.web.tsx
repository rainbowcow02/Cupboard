import { StyleSheet, Text, View } from 'react-native';
import BeanIcon from '../../assets/icon-bean.svg';
import { colors, fonts } from '@shared/theme';

interface Props {
  country?: string | null;
  region?: string | null;
}

export function OriginMap({ country, region }: Props) {
  if (!country) return null;
  const label = region || country;

  return (
    <View
      style={styles.placeholder}
      accessibilityRole="image"
      accessibilityLabel={`Map preview of ${label}`}
    >
      <View style={styles.markerPill}>
        <BeanIcon width={17} height={17} />
      </View>
      <Text style={styles.countryLabel}>{label}</Text>
      <Text style={styles.previewNote}>Map preview unavailable on web</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  placeholder: {
    width: '100%',
    height: 120,
    borderRadius: 30,
    overflow: 'hidden',
    backgroundColor: colors.greyLight,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  markerPill: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 100,
    backgroundColor: colors.pearl,
  },
  countryLabel: {
    fontFamily: fonts.serif,
    fontSize: 18,
    color: colors.black,
    lineHeight: 24,
  },
  previewNote: {
    fontFamily: fonts.sans,
    fontWeight: '500',
    fontSize: 11,
    color: colors.greyDark,
  },
});
