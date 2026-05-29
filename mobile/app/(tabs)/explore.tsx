import { SafeAreaView, Text, StyleSheet } from 'react-native';
import { colors, fonts } from '@shared/theme';

export default function ExploreScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.text}>Explore — coming in Weekend 3</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.pearl, alignItems: 'center', justifyContent: 'center' },
  text: { fontFamily: fonts.sans, color: colors.greyDark, fontSize: 16 },
});
