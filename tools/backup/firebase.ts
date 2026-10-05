import { deleteApp, initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { get, getDatabase, ref } from 'firebase/database';
import type { Config } from './config.ts';
import type { UserData } from './summary.ts';

export interface FetchedUser {
  uid: string;
  email: string;
  data: UserData | null;
}

export async function fetchUserData(config: Config): Promise<FetchedUser> {
  const app = initializeApp({ apiKey: config.apiKey, databaseURL: config.databaseUrl });
  try {
    const credential = await signInWithEmailAndPassword(
      getAuth(app),
      config.email,
      config.password,
    );
    const { uid } = credential.user;
    const snapshot = await get(ref(getDatabase(app), `users/${uid}`));
    return { uid, email: credential.user.email ?? config.email, data: snapshot.val() };
  } finally {
    await deleteApp(app);
  }
}
