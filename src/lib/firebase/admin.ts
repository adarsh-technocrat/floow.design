import { initializeApp, getApps, cert, type App } from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";

let app: App | undefined;

function getAdminApp(): App {
  if (app) return app;
  if (getApps().length > 0) {
    app = getApps()[0];
    return app;
  }

  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

  // If a service account key is provided, use it; otherwise fall back to
  // Application Default Credentials (works on GCP / Cloud Run / etc.).
  if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
    app = initializeApp({ credential: cert(serviceAccount) });
  } else {
    app = initializeApp({ projectId: projectId || undefined });
  }

  return app;
}

export function getAdminAuth(): Auth {
  return getAuth(getAdminApp());
}
