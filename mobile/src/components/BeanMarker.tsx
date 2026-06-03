import { StyleSheet, Text, View } from 'react-native';
import { fonts } from '@shared/theme';
import BeanIcon from '../../assets/icon-bean.svg';

interface Props {
  count: number;
  selected: boolean;
}

export function BeanMarker({ count, selected }: Props) {
  return (
    <View style={[styles.pill, selected ? styles.pillSelected : styles.pillDefault]}>
      <BeanIcon width={17} height={17} />
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
  count: {
    fontFamily: fonts.sans,
    fontWeight: '500',
    fontSize: 15,
  },
  countDefault: {
    color: '#5d0505',
  },
  countSelected: {
    color: '#ffffff',
  },
});
