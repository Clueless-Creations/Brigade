/**
 * GitHub OAuth: authorize redirect, code-for-token exchange, and user/email verification.
 *
 * No SDK — Workers-native fetch, matching google.ts. Tests inject `fetchImpl` so no network call
 * reaches api.github.com. Subject is GitHub's stable numeric user `id` (decimal string), never
 * login or email (ADR-0020).
 */

import { z } from "zod";
import { SIGNIN_FAILURE_REASONS, type SigninFailureReason } from "../analytics/events.js";

const GITHUB_AUTHORIZE_ENDPOINT = "https://github.com/login/oauth/authorize";
const GITHUB_TOKEN_ENDPOINT = "https://github.com/login/oauth/access_token";
const GITHUB_USER_ENDPOINT = "https://api.github.com/user";
const GITHUB_EMAILS_ENDPOINT = "https://api.github.com/user/emails";

export class GitHubAuthError extends Error {
  constructor(readonly reason: SigninFailureReason) {
    super(reason);
  }
}

export interface GitHubIdentity {
  readonly subject: string;
  readonly email: string;
  readonly emailVerified: boolean;
  readonly name?: string;
  readonly login?: string;
}

export interface BuildGitHubAuthorizeUrlOptions {
  readonly clientId: string;
  readonly redirectUri: string;
  readonly state: string;
}

/** Builds the redirect target for GET /auth/github/start. Pure — no network call. */
export function buildGitHubAuthorizeUrl(opts: BuildGitHubAuthorizeUrlOptions): string {
  const url = new URL(GITHUB_AUTHORIZE_ENDPOINT);
  url.searchParams.set("client_id", opts.clientId);
  url.searchParams.set("redirect_uri", opts.redirectUri);
  url.searchParams.set("response_type", "code");
  // `user:email` is required when the primary email is private; `read:user` covers profile name.
  url.searchParams.set("scope", "read:user user:email");
  url.searchParams.set("state", opts.state);
  return url.toString();
}

export interface ExchangeGitHubCodeOptions {
  readonly code: string;
  readonly clientId: string;
  readonly clientSecret: string;
  readonly redirectUri: string;
  readonly fetchImpl?: typeof fetch;
}

const tokenResponse = z.object({ access_token: z.string().min(1), token_type: z.string().optional() });

/**
 * Exchanges an authorization code for an access token. GitHub answers a used/expired code with
 * 200 + `error=bad_verification_code` in the JSON body when Accept: application/json is set —
 * map that to `expired_code`. Network/5xx → `internal`.
 */
export async function exchangeGitHubCode(opts: ExchangeGitHubCodeOptions): Promise<{ accessToken: string }> {
  const fetchImpl = opts.fetchImpl ?? fetch;
  const body = new URLSearchParams({
    code: opts.code,
    client_id: opts.clientId,
    client_secret: opts.clientSecret,
    redirect_uri: opts.redirectUri,
  });
  let response: Response;
  try {
    response = await fetchImpl(GITHUB_TOKEN_ENDPOINT, {
      method: "POST",
      headers: { Accept: "application/json", "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });
  } catch {
    throw new GitHubAuthError("internal");
  }
  if (!response.ok) throw new GitHubAuthError(response.status === 400 ? "expired_code" : "internal");
  let json: unknown;
  try {
    json = await response.json();
  } catch {
    throw new GitHubAuthError("internal");
  }
  if (json && typeof json === "object" && "error" in json) {
    const err = (json as { error?: string }).error;
    throw new GitHubAuthError(err === "bad_verification_code" ? "expired_code" : "internal");
  }
  const parsed = tokenResponse.safeParse(json);
  if (!parsed.success) throw new GitHubAuthError("internal");
  return { accessToken: parsed.data.access_token };
}

const userResponse = z.object({
  id: z.number().int().positive(),
  login: z.string().min(1).max(200).optional(),
  name: z.string().min(1).max(200).nullable().optional(),
  email: z.string().email().nullable().optional(),
});

const emailRow = z.object({
  email: z.string().email(),
  primary: z.boolean(),
  verified: z.boolean(),
});

export interface FetchGitHubIdentityOptions {
  readonly accessToken: string;
  readonly fetchImpl?: typeof fetch;
}

/**
 * Loads the GitHub user and requires a primary verified email from `/user/emails`.
 * Subject is `String(id)` — never login/email. Missing/unverified primary email → `email_unverified`.
 */
export async function fetchGitHubIdentity(opts: FetchGitHubIdentityOptions): Promise<GitHubIdentity> {
  const fetchImpl = opts.fetchImpl ?? fetch;
  const headers = {
    Accept: "application/vnd.github+json",
    Authorization: `Bearer ${opts.accessToken}`,
    "User-Agent": "clueless-creations-builder-console",
    "X-GitHub-Api-Version": "2022-11-28",
  };

  let userRes: Response;
  try {
    userRes = await fetchImpl(GITHUB_USER_ENDPOINT, { headers });
  } catch {
    throw new GitHubAuthError("internal");
  }
  if (!userRes.ok) throw new GitHubAuthError(userRes.status >= 500 ? "internal" : "token_invalid");
  let userJson: unknown;
  try {
    userJson = await userRes.json();
  } catch {
    throw new GitHubAuthError("internal");
  }
  const user = userResponse.safeParse(userJson);
  if (!user.success) throw new GitHubAuthError("token_invalid");

  let emailsRes: Response;
  try {
    emailsRes = await fetchImpl(GITHUB_EMAILS_ENDPOINT, { headers });
  } catch {
    throw new GitHubAuthError("internal");
  }
  if (!emailsRes.ok) throw new GitHubAuthError(emailsRes.status >= 500 ? "internal" : "email_unverified");
  let emailsJson: unknown;
  try {
    emailsJson = await emailsRes.json();
  } catch {
    throw new GitHubAuthError("internal");
  }
  const emails = z.array(emailRow).safeParse(emailsJson);
  if (!emails.success) throw new GitHubAuthError("email_unverified");
  const primaryVerified = emails.data.find((row) => row.primary && row.verified);
  if (primaryVerified === undefined) throw new GitHubAuthError("email_unverified");

  return {
    subject: String(user.data.id),
    email: primaryVerified.email,
    emailVerified: true,
    name: user.data.name ?? undefined,
    login: user.data.login,
  };
}

export function isSigninFailureReason(value: unknown): value is SigninFailureReason {
  return typeof value === "string" && (SIGNIN_FAILURE_REASONS as readonly string[]).includes(value);
}
