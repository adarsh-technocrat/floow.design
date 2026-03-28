import {
  GoogleAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  isSignInWithEmailLink as firebaseIsSignInWithEmailLink,
  signInWithEmailLink as firebaseSignInWithEmailLink,
  type User,
  type Unsubscribe,
} from "firebase/auth";
import { getFirebaseAuth } from "./config";

let googleProvider: GoogleAuthProvider | null = null;

function getGoogleProvider() {
  if (!googleProvider) googleProvider = new GoogleAuthProvider();
  return googleProvider;
}

export async function signInWithGoogle(): Promise<User> {
  const auth = getFirebaseAuth();
  if (!auth) throw new Error("Firebase not configured");
  const result = await signInWithPopup(auth, getGoogleProvider());
  return result.user;
}

export async function signOut(): Promise<void> {
  const auth = getFirebaseAuth();
  if (!auth) return;
  await firebaseSignOut(auth);
}

export function onAuthChange(
  callback: (user: User | null) => void,
): Unsubscribe {
  const auth = getFirebaseAuth();
  if (!auth) {
    // No Firebase configured — treat as no user
    callback(null);
    return () => {};
  }
  return onAuthStateChanged(auth, callback);
}

export function isSignInWithEmailLink(url: string): boolean {
  const auth = getFirebaseAuth();
  if (!auth) return false;
  return firebaseIsSignInWithEmailLink(auth, url);
}

export async function completeEmailLinkSignIn(
  email: string,
  url: string,
): Promise<User> {
  const auth = getFirebaseAuth();
  if (!auth) throw new Error("Firebase not configured");
  const result = await firebaseSignInWithEmailLink(auth, email, url);
  return result.user;
}

export type { User };
