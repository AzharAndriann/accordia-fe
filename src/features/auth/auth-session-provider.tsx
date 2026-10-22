import type { PropsWithChildren } from 'react';
import { createContext, useContext, useEffect, useState, useSyncExternalStore } from 'react';

import {
  getSessionSnapshot,
  restoreSession,
  subscribeSession,
  type CurrentUser,
} from '@/lib/session';

type AuthSessionValue = {
  isReady: boolean;
  user: CurrentUser | null;
};

const AuthSessionContext = createContext<AuthSessionValue>({ isReady: false, user: null });

export function AuthSessionProvider({ children }: PropsWithChildren) {
  const [isReady, setIsReady] = useState(false);
  const session = useSyncExternalStore(subscribeSession, getSessionSnapshot, getSessionSnapshot);

  useEffect(() => {
    void restoreSession().finally(() => setIsReady(true));
  }, []);

  return (
    <AuthSessionContext.Provider value={{ isReady, user: session.user }}>
      {children}
    </AuthSessionContext.Provider>
  );
}

export function useAuthSession() {
  return useContext(AuthSessionContext);
}
