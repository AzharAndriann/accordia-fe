import { Redirect } from 'expo-router';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { useAuthSession } from '@/features/auth';

export default function IndexScreen() {
  const { isReady, user } = useAuthSession();
  if (!isReady) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color="#176B5B" />
      </View>
    );
  }
  return <Redirect href={user ? '/(app)' : '/(auth)/login'} />;
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
