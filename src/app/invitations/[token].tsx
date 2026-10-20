import { useLocalSearchParams } from 'expo-router';

import { PlaceholderScreen } from '@/components/placeholder-screen';

export default function InvitationScreen() {
  const { token } = useLocalSearchParams<{ token: string }>();
  return <PlaceholderScreen title="Undangan proyek" description={token ? 'Token undangan diterima dan siap divalidasi setelah login.' : 'Token undangan tidak tersedia.'} />;
}
