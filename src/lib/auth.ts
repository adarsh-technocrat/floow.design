import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth } from "@/lib/firebase/admin";

/**
 * Extracts and verifies the Firebase ID token from the Authorization header.
 * Returns the authenticated user's UID, or null if the token is missing/invalid.
 * Works with both NextRequest and standard Request.
 */
export async function getAuthenticatedUserId(
  req: NextRequest | Request,
): Promise<string | null> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;

  const token = authHeader.slice(7);
  if (!token) return null;

  try {
    const decoded = await getAdminAuth().verifyIdToken(token);
    return decoded.uid;
  } catch {
    return null;
  }
}

/**
 * Helper that returns the userId or a 401 response.
 * Use in API routes: const [userId, errorRes] = await requireAuth(req);
 */
export async function requireAuth(
  req: NextRequest,
): Promise<[string, null] | [null, NextResponse]> {
  const userId = await getAuthenticatedUserId(req);
  if (!userId) {
    return [
      null,
      NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    ];
  }
  return [userId, null];
}
