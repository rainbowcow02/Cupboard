import { SafeAreaView, Text, StyleSheet } from 'react-native';
import { colors, fonts } from '@shared/theme';

export default function BeansScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.text}>Beans — coming soon</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.pearl, alignItems: 'center', justifyContent: 'center' },
  text: { fontFamily: fonts.sans, color: colors.greyDark, fontSize: 16 },
});
