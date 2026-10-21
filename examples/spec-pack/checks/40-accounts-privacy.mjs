// CLU-105. Accounts, privacy inventory, security, and legal preflight.
export const id = "accounts-privacy";
export const describe =
  "Accounts, Sign in with Apple or an equivalent private login, privacy inventory, store-required prompt reachability, security, and legal preflight.";

const ACCOUNT_MODES = new Set(["none", "optional", "required"]);
const STATUSES = new Set(["pass", "fix", "n/a", "founder_fact_needed"]);
const LEGAL_ITEMS = ["coppa", "fonts", "session_replay", "can_spam", "auto_renew", "dmca"];
const HUMAN_STEP_ITEMS = new Set(["dmca", "can_spam"]);
const THIRD_PARTY = new Set(["facebook", "google", "x", "twitter", "linkedin", "amazon", "wechat"]);
const EQUIVALENT_FEATURES = ["limits_data_to_name_and_email", "private_email", "no_advertising_without_consent"];
const PROMPT_KINDS = new Set(["att", "permission"]);
const PROMPT_REACHABLE = new Set(["first_launch", "review_notes"]);
const INACTIVE_REMOTE_FLAG = new Set(["", "none", "no", "n/a", "na", "false", "off", "not used"]);

function text(value) {
  return typeof value === "string" && value.trim() ? value.trim() : "";
}

function remoteFlagText(value) {
  if (typeof value === "boolean") return value ? "true" : "none";
  return text(value);
}

function inactiveRemoteFlag(value) {
  return INACTIVE_REMOTE_FLAG.has(value.trim().toLowerCase());
}

function explicitReviewBuildOverride(value) {
  const trimmed = text(value);
  if (trimmed.length < 12 || inactiveRemoteFlag(trimmed)) return false;
  if (/\b(todo|tbd|pending|placeholder|unknown|missing|blocked)\b/i.test(trimmed)) return false;
  return /review build|review-build|submitted build/i.test(trimmed);
}

function exactReviewerPath(value) {
  return value.includes(">") || value.includes("→") || value.includes("->");
}

function providerId(provider) {
  if (typeof provider === "string") return provider.trim().toLowerCase();
  if (provider && typeof provider === "object" && typeof provider.id === "string") return provider.id.trim().toLowerCase();
  return "";
}

function isThirdParty(provider) {
  if (provider && typeof provider === "object" && provider.third_party === true) return true;
  return THIRD_PARTY.has(providerId(provider));
}

function equivalentQualifies(entry) {
  if (!entry || typeof entry !== "object") return false;
  return EQUIVALENT_FEATURES.every((key) => entry[key] === true);
}

function checkAccounts(spec, ctx) {
  const errors = [];
  const accounts = spec.accounts;
  if (!accounts || typeof accounts !== "object" || Array.isArray(accounts)) {
    errors.push("accounts: block is missing");
    return errors;
  }
  if (!ACCOUNT_MODES.has(accounts.mode)) {
    errors.push("accounts: mode must be none, optional, or required");
    return errors;
  }
  if (accounts.mode === "none") return errors;

  const providers = Array.isArray(accounts.providers) ? accounts.providers : [];
  const signInWithApple = accounts.sign_in_with_apple === true || providers.some((provider) => providerId(provider) === "apple");
  const thirdParty = providers.some(isThirdParty);
  if (thirdParty && !signInWithApple && !equivalentQualifies(accounts.equivalent_private_login)) {
    errors.push("accounts: third-party login requires Sign in with Apple or an equivalent private login (Guideline 4.8)");
  }
  const webIds = ctx.webIds ?? new Set((spec.web ?? []).map((page) => page.id));
  if (!webIds.has("delete")) errors.push('accounts: web surface "delete" is required when accounts is not none');
  const screenId = text(accounts.in_app_delete_screen);
  if (!screenId) errors.push("accounts: in_app_delete_screen is required when accounts is not none");
  else if (!(ctx.screenIds ?? new Set()).has(screenId)) {
    errors.push(`accounts: in_app_delete_screen "${screenId}" is not a screen`);
  }
  return errors;
}

function checkPrivacy(spec) {
  const errors = [];
  const privacy = spec.privacy;
  if (!privacy || typeof privacy !== "object" || Array.isArray(privacy)) {
    errors.push("privacy: block is missing");
    return errors;
  }
  if (typeof privacy.tracking !== "boolean") errors.push("privacy: tracking must be true or false");
  if (!Array.isArray(privacy.inventory)) {
    errors.push("privacy: inventory must be a list");
  } else {
    privacy.inventory.forEach((row, index) => {
      const label = `privacy.inventory[${index}]`;
      if (!row || typeof row !== "object") {
        errors.push(`${label}: must be a data row`);
        return;
      }
      if (!text(row.data)) errors.push(`${label}: data is required`);
      if (!text(row.app_privacy_label)) errors.push(`${label}: app_privacy_label is required`);
      if (!text(row.processor)) errors.push(`${label}: processor is required`);
    });
  }
  if (!Array.isArray(privacy.required_reason_apis)) errors.push("privacy: required_reason_apis must be a list");
  errors.push(...checkStoreRequiredPrompts(privacy));
  return errors;
}

function checkStoreRequiredPrompts(privacy) {
  const errors = [];
  const rows = privacy.store_required_prompts;
  if (!Array.isArray(rows)) {
    errors.push("privacy: store_required_prompts must be a list");
    return errors;
  }
  let att = false;
  rows.forEach((row, index) => {
    const label = `privacy.store_required_prompts[${index}]`;
    if (!row || typeof row !== "object" || Array.isArray(row)) {
      errors.push(`${label}: must be a prompt row`);
      return;
    }
    if (!text(row.id)) errors.push(`${label}: id is required`);
    const kind = text(row.kind);
    if (!PROMPT_KINDS.has(kind)) errors.push(`${label}: kind must be att or permission`);
    if (kind === "att") att = true;
    const reachable = text(row.reachable);
    if (!PROMPT_REACHABLE.has(reachable)) errors.push(`${label}: reachable must be first_launch or review_notes`);
    const reviewerPath = text(row.reviewer_path);
    if (!reviewerPath) errors.push(`${label}: reviewer_path is required`);
    else if (reachable === "first_launch" && !/first launch/i.test(reviewerPath)) {
      errors.push(`${label}: reviewer_path must say the prompt appears on first launch`);
    } else if (reachable === "review_notes" && !exactReviewerPath(reviewerPath)) {
      errors.push(`${label}: reviewer_path must be the exact navigation path`);
    }
    const remoteFlag = remoteFlagText(row.remote_flag);
    if (!inactiveRemoteFlag(remoteFlag) && !explicitReviewBuildOverride(row.review_build_override)) {
      errors.push(`${label}: remote flag "${remoteFlag}" needs an explicit review_build_override`);
    }
  });
  if (privacy.tracking === true && !att) {
    errors.push("privacy: tracking requires a store-required App Tracking Transparency prompt that is reachable on the review build");
  }
  return errors;
}

function checkSecurity(spec) {
  const errors = [];
  const security = spec.security;
  if (!security || typeof security !== "object" || Array.isArray(security)) {
    errors.push("security: block is missing");
    return errors;
  }
  if (!Array.isArray(security.entitlements)) errors.push("security: entitlements must be a list");
  if (!text(security.secrets)) errors.push("security: secrets location is required");
  if (!text(security.deep_links)) errors.push("security: deep_links validation is required");
  return errors;
}

function checkLegal(spec) {
  const errors = [];
  const items = spec.legal_preflight;
  if (!Array.isArray(items)) {
    errors.push("legal_preflight: block is missing");
    return errors;
  }
  const seen = new Set();
  for (const item of items) {
    const id = text(item?.id);
    if (!id) {
      errors.push("legal_preflight: an item is missing id");
      continue;
    }
    if (seen.has(id)) errors.push(`legal_preflight: "${id}" is duplicated`);
    seen.add(id);
    const status = text(item.status);
    if (!STATUSES.has(status)) {
      errors.push(`legal_preflight: "${id}" status "${status}" is not pass, fix, n/a, or founder_fact_needed`);
      continue;
    }
    if (!text(item.where)) errors.push(`legal_preflight: "${id}" needs where`);
    if (status === "n/a" && !text(item.reason)) errors.push(`legal_preflight: "${id}" status "n/a" needs a reason`);
    if (HUMAN_STEP_ITEMS.has(id) && status !== "n/a" && !text(item.human_steps)) {
      errors.push(`legal_preflight: "${id}" needs human_steps`);
    }
  }
  for (const id of LEGAL_ITEMS) {
    if (!seen.has(id)) errors.push(`legal_preflight: "${id}" is missing`);
  }
  return errors;
}

export function check(spec, ctx) {
  return [...checkAccounts(spec, ctx), ...checkPrivacy(spec), ...checkSecurity(spec), ...checkLegal(spec)];
}
