// Onboarding archetype, mascot choice, and Bier checks. CLU-112.
export const id = "onboarding";
export const describe = "Onboarding archetype, mascot choice, catalog events, and the first-screen value check.";

const ARCHETYPES = ["utility-quick-start", "result-reveal", "quiz-led-problem"];
const ARCHETYPE_SET = new Set(ARCHETYPES);
const BASE_EVENTS = ["onboarding_started", "onboarding_step_viewed", "onboarding_completed"];
const QUIZ_EVENTS = ["onboarding_started", "onboarding_step_viewed", "onboarding_answer_selected", "onboarding_completed"];
const CLOSING_EVENTS = ["closing_offer_viewed", "closing_offer_selected"];
const SIGN_UP = /\b(sign[\s-]?up|sign[\s-]?in|log[\s-]?in|login|create an account|create account)\b/i;
const RATING_TYPE = /^(rating|stars|custom-rating|review-stars)$/i;
const RATING_ID = /custom-rating|rate-us|rate_us|rating-ask/i;

function textOf(value) {
  return typeof value === "string" ? value.trim() : "";
}

function isYes(value) {
  return value === true || value === "yes";
}

function isNo(value) {
  return value === false || value === "no";
}

function blockBlob(block) {
  if (!block || typeof block !== "object") return "";
  return ["type", "text", "label", "title", "caption", "value"].map((key) => textOf(block[key])).join(" ");
}

function showsComparison(step) {
  return step?.comparison === true || step?.comparison === "yes" || step?.kind === "results-comparison";
}

function hasText(step, key) {
  return textOf(step?.[key]).length > 0;
}

function checkChoice(block, label, errors) {
  if (!block || typeof block !== "object" || Array.isArray(block)) {
    errors.push(`${label}: use is missing`);
    errors.push(`${label}: reason is missing`);
    return;
  }
  if (!isYes(block.use) && !isNo(block.use)) errors.push(`${label}: use must be yes or no`);
  if (!textOf(block.reason)) errors.push(`${label}: reason is missing`);
}

function requiredEvents(archetype, closingOffer) {
  const names = archetype === "quiz-led-problem" ? QUIZ_EVENTS : BASE_EVENTS;
  return closingOffer ? [...names, ...CLOSING_EVENTS] : names;
}

function checkFirstScreen(spec, errors) {
  const screen = spec.screens?.[0];
  if (!screen) return;
  const blocks = Array.isArray(screen.mock?.default) ? screen.mock.default : [];
  const signup = blocks.some((block) => SIGN_UP.test(blockBlob(block)));
  if (signup) errors.push(`onboarding: first screen "${screen.id}" default mock has a sign-up block`);
  const showsValue = blocks.some((block) => (block?.type === "title" || block?.type === "text") && textOf(block.text));
  if (!showsValue) errors.push(`onboarding: first screen "${screen.id}" default mock does not show core value`);
}

function checkCustomRating(spec, onboarding, errors) {
  const prompt = textOf(onboarding?.review_prompt?.type);
  if (prompt === "custom" || prompt === "custom-rating") errors.push('onboarding: custom rating screen "review_prompt"');
  for (const screen of spec.screens ?? []) {
    if (RATING_ID.test(String(screen?.id ?? ""))) {
      errors.push(`onboarding: custom rating screen "${screen.id}"`);
      continue;
    }
    for (const blocks of Object.values(screen?.mock ?? {})) {
      if (!Array.isArray(blocks)) continue;
      if (blocks.some((block) => RATING_TYPE.test(String(block?.type ?? "")))) {
        errors.push(`onboarding: custom rating screen "${screen.id}"`);
        break;
      }
    }
  }
  for (const step of onboarding?.steps ?? []) {
    if (step?.kind === "custom-rating" || step?.kind === "rating") errors.push(`onboarding: custom rating screen "${step.id ?? "step"}"`);
  }
}

function checkOnboarding(spec, ctx, errors) {
  const onboarding = spec.onboarding;
  if (!onboarding || typeof onboarding !== "object" || Array.isArray(onboarding)) {
    errors.push("onboarding: archetype is missing");
    errors.push("onboarding: reason is missing");
    return;
  }
  const archetype = textOf(onboarding.archetype);
  if (!archetype) errors.push("onboarding: archetype is missing");
  else if (!ARCHETYPE_SET.has(archetype)) {
    errors.push(`onboarding: archetype "${archetype}" is not ${ARCHETYPES.join(", ")}`);
  }
  if (!textOf(onboarding.reason)) errors.push("onboarding: reason is missing");
  if (typeof onboarding.first_value_target_s !== "number") errors.push("onboarding: first_value_target_s is missing");
  const steps = onboarding.steps;
  if (!Array.isArray(steps)) errors.push("onboarding: steps must be a list");
  const stepList = Array.isArray(steps) ? steps : [];
  if (!Array.isArray(onboarding.steps_not_used)) errors.push("onboarding: steps_not_used must be a list");
  else {
    for (const entry of onboarding.steps_not_used) {
      const id = textOf(entry?.id) || "entry";
      if (!textOf(entry?.reason)) errors.push(`onboarding: steps_not_used "${id}" is missing a reason`);
    }
  }
  const paywall = onboarding.paywall;
  if (!paywall || typeof paywall !== "object") {
    errors.push("onboarding: paywall type is missing");
    errors.push("onboarding: paywall placement is missing");
    errors.push("onboarding: paywall closing_offer must be yes or no");
  } else {
    if (!textOf(paywall.type)) errors.push("onboarding: paywall type is missing");
    if (!textOf(paywall.placement)) errors.push("onboarding: paywall placement is missing");
    const closing = paywall.closing_offer;
    if (!isYes(closing) && !isNo(closing)) errors.push("onboarding: paywall closing_offer must be yes or no");
    if (isYes(closing)) {
      if (!textOf(paywall.standard_price)) errors.push("onboarding: closing offer is missing standard_price");
      if (!textOf(paywall.renewal_price)) errors.push("onboarding: closing offer is missing renewal_price");
      if (paywall.eligibility !== "once") errors.push("onboarding: closing offer eligibility must be once");
    }
  }
  if (!onboarding.review_prompt || typeof onboarding.review_prompt !== "object") errors.push("onboarding: review_prompt is missing");

  if (archetype === "utility-quick-start") {
    const count = (spec.screens ?? []).filter((screen) => screen?.flow === "onboarding").length;
    if (count > 5) errors.push(`onboarding: utility-quick-start has ${count} onboarding screens; the maximum is 5`);
    const quizStep = stepList.some((step) => step?.kind === "quiz" || step?.id === "quiz");
    const quizScreen = (spec.screens ?? []).some((screen) => screen?.flow === "onboarding" && /\bquiz\b/i.test(`${screen.id ?? ""} ${screen.title ?? ""}`));
    if (quizStep || quizScreen) errors.push("onboarding: utility-quick-start includes a quiz");
  }

  if (archetype === "quiz-led-problem") {
    for (const step of stepList) {
      if (showsComparison(step) && !hasText(step, "baseline_source")) {
        errors.push(`onboarding: step "${textOf(step?.id) || "comparison"}" shows a comparison without baseline_source`);
      }
    }
    if (!stepList.some((step) => hasText(step, "computation"))) errors.push("onboarding: quiz-led-problem is missing a plan-loader computation");
    if (!stepList.some((step) => hasText(step, "reminder"))) errors.push("onboarding: quiz-led-problem is missing a timeline reminder");
  }

  if (ARCHETYPE_SET.has(archetype)) {
    const closingOffer = isYes(onboarding.paywall?.closing_offer);
    for (const name of requiredEvents(archetype, closingOffer)) {
      if (!ctx.eventNames.has(name)) errors.push(`onboarding: archetype ${archetype} is missing event "${name}"`);
    }
  }
  checkCustomRating(spec, onboarding, errors);
}

export function check(spec, ctx) {
  const errors = [];
  checkChoice(spec.mascot, "mascot", errors);
  checkFirstScreen(spec, errors);
  checkOnboarding(spec, ctx, errors);
  return errors;
}
