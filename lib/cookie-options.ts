// Cookie options for iframe compatibility using CHIPS (Cookies Having Independent Partitioned State)
export interface IframeCookieOptions {
  expires?: Date;
  maxAge?: number;
  sameSite?: "strict" | "lax" | "none";
  secure?: boolean;
  partitioned?: boolean;
  domain?: string;
  path?: string;
}

/**
 * Get cookie options optimized for iframe usage
 * Uses CHIPS (Cookies Having Independent Partitioned State) for cross-site cookie support
 */
export function getIframeCookieOptions(
  customOptions: Partial<IframeCookieOptions> = {}
): IframeCookieOptions {
  return {
    sameSite: "none",
    secure: true,
    partitioned: true,
    path: "/",
    ...customOptions,
  };
}

/**
 * Get cookie options for the auth token specifically
 */
export function getAuthCookieOptions(expiresIn?: number): IframeCookieOptions {
  return getIframeCookieOptions({
    expires: expiresIn 
      ? new Date(Date.now() + expiresIn * 1000)
      : undefined,
  });
}

/**
 * Get cookie options for removing iframe-compatible cookies
 * Sets the cookie to expire immediately while maintaining the same attributes
 */
export function getRemoveCookieOptions(): IframeCookieOptions {
  return getIframeCookieOptions({
    expires: new Date(0), // Set to epoch time (expired)
  });
}
