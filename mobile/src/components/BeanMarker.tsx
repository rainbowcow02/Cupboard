import { StyleSheet, Text, View } from 'react-native';
import { fonts } from '@shared/theme';

interface Props {
  count: number;
  selected: boolean;
  dimmed: boolean;
}

export function BeanMarker({ count, selected, dimmed }: Props) {
  return (
    <View style={[styles.pill, selected ? styles.pillSelected : styles.pillDefault, dimmed && styles.pillDimmed]}>
      <Text style={styles.bean}>☕</Text>
      <Text style={[styles.count, selected ? styles.countSelected : styles.countDefault]}>
        {count}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 100,
  },
  pillDefault: {
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 4,
  },
  pillSelected: {
    backgroundColor: '#fc999b',
    shadowColor: '#660808',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  pillDimmed: {
    opacity: 0.45,
  },
  bean: {
    fontSize: 13,
    lineHeight: 17,
  },
  count: {
    fontFamily: fonts.sans,
    fontWeight: '500',
    fontSize: 15,
    lineHeight: 17,
  },
  countDefault: {
    color: '#5d0505',
  },
  countSelected: {
    color: '#ffffff',
  },
});
