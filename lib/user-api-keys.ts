/**
 * User API Key Service
 * Database-dependent operations for API keys
 */
import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/User";
import { decryptKey } from "@/lib/api-keys";

/**
 * Get decrypted API key for a provider
 */
export async function getUserApiKey(
  userEmail: string,
  provider: string
): Promise<string | null> {
  try {
    await connectToDatabase();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const user = await User.findOne({ email: userEmail }) as any;
    
    if (!user?.apiKeys?.[provider]) {
      return null;
    }
    
    return decryptKey(user.apiKeys[provider]);
  } catch {
    return null;
  }
}
