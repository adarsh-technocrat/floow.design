import axios from "axios";
import { getFirebaseAuth } from "@/lib/firebase/config";

const http = axios.create({
  headers: { "Content-Type": "application/json" },
});

// Attach Firebase ID token to every outgoing request
http.interceptors.request.use(async (config) => {
  const auth = getFirebaseAuth();
  const user = auth?.currentUser;
  if (user) {
    const token = await user.getIdToken();
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default http;
