// CLU-111. Hypotheses are required on every spec pack. The emit hook writes
// ledger-record.yaml beside index.html. Copying that file into the user's
// private store happens only when learning_ledger.enabled is on.
//
// Name, icon, price, keywords, and providers are read from blocks that already
// exist. Onboarding archetype, screen count, quiz length, paywall placement,
// closing offer, and purchase model are read from onboarding when that block
// exists. Mascot and funnel channels are read the same way. A field stays on
// ledger, marked moves_to, only while its block is absent. paywall.type in the
// onboarding block is the purchase model, so soft or hard stays on ledger.
// This file does not rename analytics events.
import YAML from "yaml";

export const id = "ledger";
export const describe = "Three or four hypotheses, each with a metric, and the Gate 1 learning-ledger record.";

const MOTIVES = new Set(["money", "mate", "escape"]);
const ONBOARDING_TYPES = new Set(["utility-quick-start", "result-reveal", "quiz-led-problem"]);
const PAYWALL_PLACEMENTS = new Set(["end_of_onboarding", "after_first_core_action", "later"]);
const PAYWALL_TYPES = new Set(["soft", "hard"]);
const PURCHASE_KINDS = new Set(["trial", "one-time"]);
const CHECKPOINTS = ["gate_2", "day_7", "day_30", "monthly"];
const SOURCES = ["posthog", "revenuecat", "app_store_connect", "appkittie"];
const NUMBER_METRICS = [
  "installs_per_month",
  "revenue_per_month",
  "revenue_per_install",
  "trial_to_paid_rate",
  "retention_d1",
  "retention_d7",
  "retention_d30",
  "invite_rate",
  "refunds",
  "onboarding_completed_rate",
  "time_to_first_core_action",
  "paywall_view_to_trial_or_purchase",
  "discount_take_rate",
  "day_0_cancel_rate",
];
const STEP_METRICS = ["onboarding_step_completion", "onboarding_drop_off_per_step"];
const MOVED_FIELDS = [
  ["onboarding_type", "onboarding"],
  ["onboarding_screen_count", "onboarding"],
  ["quiz_length", "onboarding"],
  ["paywall_placement", "onboarding"],
  ["paywall_type", "onboarding"],
  ["closing_discount", "onboarding"],
  ["mascot", "mascot"],
  ["acquisition_channels", "funnel"],
];

function isRecord(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function firstDefined(values) {
  for (const value of values) {
    if (value !== undefined && value !== null) return value;
  }
  return undefined;
}

function yesNo(value) {
  if (value === true || value === "yes") return true;
  if (value === false || value === "no") return false;
  return undefined;
}

function mapPlacement(value) {
  if (typeof value !== "string") return undefined;
  const text = value.trim().toLowerCase().replaceAll("-", "_");
  if (text === "after_first_value" || text === "after_first_core_action") return "after_first_core_action";
  if (text === "end_of_onboarding") return "end_of_onboarding";
  if (text === "later") return "later";
  return undefined;
}

function mapPaywallType(value) {
  return value === "soft" || value === "hard" ? value : undefined;
}

function mapPurchase(value) {
  if (value === "trial" || value === "one-time") return value;
  return undefined;
}

function readOnboarding(block) {
  if (!isRecord(block)) return {};
  const paywall = isRecord(block.paywall) ? block.paywall : {};
  const quiz = isRecord(block.quiz) ? block.quiz : {};
  const steps = Array.isArray(block.steps) ? block.steps : undefined;
  const quizFromSteps = steps ? steps.filter((step) => step?.kind === "quiz" || step?.id === "quiz").length : undefined;
  return {
    onboarding_type: firstDefined([block.archetype, block.onboarding_type, block.type]),
    onboarding_screen_count: typeof block.screen_count === "number" ? block.screen_count : undefined,
    quiz_length: firstDefined([
      typeof block.quiz_length === "number" ? block.quiz_length : undefined,
      typeof quiz.length === "number" ? quiz.length : undefined,
      quizFromSteps,
    ]),
    paywall_placement: firstDefined([mapPlacement(block.paywall_placement), mapPlacement(paywall.placement)]),
    paywall_type: firstDefined([mapPaywallType(block.paywall_type), mapPaywallType(paywall.type)]),
    closing_discount: firstDefined([
      typeof block.closing_discount === "boolean" ? block.closing_discount : undefined,
      typeof paywall.closing_discount === "boolean" ? paywall.closing_discount : undefined,
      yesNo(paywall.closing_offer),
    ]),
    purchase_kind: firstDefined([mapPurchase(block.purchase_kind), mapPurchase(paywall.purchase_kind), mapPurchase(paywall.type)]),
    step_count: steps ? steps.length : undefined,
  };
}

function channelName(item) {
  if (typeof item === "string") return item.trim();
  if (!isRecord(item)) return "";
  if (typeof item.id === "string") return item.id.trim();
  if (typeof item.name === "string") return item.name.trim();
  return "";
}

function readChannels(block) {
  if (!isRecord(block)) return undefined;
  const list = Array.isArray(block.channels) ? block.channels : Array.isArray(block.acquisition_channels) ? block.acquisition_channels : undefined;
  if (!list) return undefined;
  const names = list.map(channelName).filter((name) => name.length > 0);
  return names.length > 0 ? names : undefined;
}

function readMascot(block) {
  if (typeof block === "boolean") return block;
  const named = yesNo(block);
  if (named !== undefined) return named;
  if (typeof block === "string") {
    const text = block.trim().toLowerCase();
    if (!text || text === "none") return undefined;
    return true;
  }
  if (!isRecord(block)) return undefined;
  const use = yesNo(block.use);
  if (use !== undefined) return use;
  if (typeof block.present === "boolean") return block.present;
  if (typeof block.enabled === "boolean") return block.enabled;
  if (typeof block.mascot === "boolean") return block.mascot;
  return undefined;
}

function take(spec, field, blockValue) {
  if (blockValue !== undefined) return { value: blockValue, moved: undefined };
  const raw = spec.ledger?.[field];
  if (isRecord(raw) && Object.prototype.hasOwnProperty.call(raw, "value")) {
    return { value: raw.value, moved: typeof raw.moves_to === "string" ? raw.moves_to : undefined };
  }
  return { value: raw, moved: undefined };
}

function purchaseKind(spec, onboardingKind) {
  if (onboardingKind === "trial" || onboardingKind === "one-time") return onboardingKind;
  const model = String(spec.store?.pricing?.model ?? "").toLowerCase();
  if (model.includes("trial") || model.includes("subscription")) return "trial";
  if (model.length > 0) return "one-time";
  return undefined;
}

function providersOf(spec) {
  const names = [];
  const add = (value) => {
    const name = String(value ?? "").trim().toLowerCase();
    if (!name || names.includes(name)) return;
    names.push(name);
  };
  add(spec.analytics?.provider);
  if (spec.store?.pricing?.revenuecat) add("revenuecat");
  const extra = spec.ledger?.providers_extra;
  if (Array.isArray(extra)) {
    for (const item of extra) add(item);
  }
  return names;
}

function emptyMetrics() {
  const metrics = {};
  for (const key of NUMBER_METRICS) metrics[key] = null;
  for (const key of STEP_METRICS) metrics[key] = null;
  return metrics;
}

function hypothesesOf(spec) {
  if (!Array.isArray(spec.hypotheses)) return [];
  return spec.hypotheses.map((item) => ({
    statement: typeof item?.statement === "string" ? item.statement.trim() : "",
    metric: typeof item?.metric === "string" ? item.metric.trim() : "",
  }));
}

function onboardingScreenCount(spec, onboarding) {
  if (typeof onboarding.onboarding_screen_count === "number") return onboarding.onboarding_screen_count;
  if (spec.onboarding != null && Array.isArray(spec.screens)) {
    const counted = spec.screens.filter((screen) => screen?.flow === "onboarding").length;
    if (counted > 0) return counted;
  }
  if (typeof onboarding.step_count === "number") return onboarding.step_count;
  return undefined;
}

export function buildRecord(spec) {
  const onboarding = spec.onboarding != null ? readOnboarding(spec.onboarding) : {};
  const channelBlock = readChannels(spec.funnel);
  const mascotBlock = spec.mascot !== undefined ? readMascot(spec.mascot) : undefined;
  const picked = {
    onboarding_type: take(spec, "onboarding_type", onboarding.onboarding_type),
    onboarding_screen_count: take(spec, "onboarding_screen_count", onboardingScreenCount(spec, onboarding)),
    quiz_length: take(spec, "quiz_length", onboarding.quiz_length),
    paywall_placement: take(spec, "paywall_placement", onboarding.paywall_placement),
    paywall_type: take(spec, "paywall_type", onboarding.paywall_type),
    closing_discount: take(spec, "closing_discount", onboarding.closing_discount),
    mascot: take(spec, "mascot", mascotBlock),
    acquisition_channels: take(spec, "acquisition_channels", channelBlock),
  };
  const moves = {};
  for (const [field, pickedValue] of Object.entries(picked)) {
    if (pickedValue.moved) moves[field] = pickedValue.moved;
  }
  const price = spec.store?.pricing?.price;
  const record = {
    schema_version: 1,
    record_version: 1,
    app: {
      slug: typeof spec.meta?.slug === "string" ? spec.meta.slug : "",
      name: typeof spec.meta?.name === "string" ? spec.meta.name : "",
    },
    choices: {
      audience: typeof spec.meta?.audience === "string" ? spec.meta.audience : "",
      problem_recurrence: textChoice(spec, "problem_recurrence"),
      download_motive: textChoice(spec, "download_motive"),
      name: typeof spec.meta?.name === "string" ? spec.meta.name : "",
      icon: String(spec.design?.icon ?? spec.design?.app_icon ?? spec.design?.icons ?? ""),
      price_model: typeof spec.store?.pricing?.model === "string" ? spec.store.pricing.model : "",
      price: price == null ? "" : String(price),
      product_type: textChoice(spec, "product_type"),
      onboarding_type: picked.onboarding_type.value,
      onboarding_screen_count: picked.onboarding_screen_count.value,
      quiz_length: picked.quiz_length.value,
      time_to_value: textChoice(spec, "time_to_value"),
      paywall_placement: picked.paywall_placement.value,
      paywall_type: picked.paywall_type.value,
      purchase_kind: purchaseKind(spec, onboarding.purchase_kind),
      closing_discount: picked.closing_discount.value,
      mascot: picked.mascot.value,
      invite_mechanic: textChoice(spec, "invite_mechanic"),
      acquisition_channels: picked.acquisition_channels.value,
      screenshot_style: textChoice(spec, "screenshot_style"),
      aso_keywords: Array.isArray(spec.store?.keywords) ? spec.store.keywords : [],
      providers: providersOf(spec),
    },
    hypotheses: hypothesesOf(spec),
    schedule: {
      checkpoints: [...CHECKPOINTS],
      sources: [...SOURCES],
      live_calls: false,
    },
    outcomes: CHECKPOINTS.map((checkpoint) => ({
      checkpoint,
      metrics: emptyMetrics(),
      why: null,
    })),
    compliance: [
      {
        variant: "default",
        status: "unrecorded",
        apple_review_prompt: "unrecorded",
        honest_calculating: "unrecorded",
        trial_timeline_and_billing: "unrecorded",
        honest_one_time_discount: "unrecorded",
      },
    ],
    boundary: {
      owner: "user",
      store: "private",
      returns_to_brigade: false,
      pooled_dataset: false,
    },
  };
  if (Object.keys(moves).length > 0) record.moves_to = moves;
  return record;
}

function textChoice(spec, field) {
  const raw = spec.ledger?.[field];
  return typeof raw === "string" ? raw.trim() : "";
}

function hypothesisErrors(spec) {
  const errors = [];
  if (!Array.isArray(spec.hypotheses) || spec.hypotheses.length < 3 || spec.hypotheses.length > 4) {
    errors.push("hypotheses: need 3 or 4 must-be-true statements");
    return errors;
  }
  spec.hypotheses.forEach((item, index) => {
    if (typeof item?.statement !== "string" || item.statement.trim().length === 0) {
      errors.push(`hypotheses[${index}]: missing statement`);
    }
    if (typeof item?.metric !== "string" || item.metric.trim().length === 0) {
      errors.push(`hypotheses[${index}]: missing metric`);
    }
  });
  return errors;
}

function missing(field) {
  return `ledger record: ${field} is missing`;
}

function choiceErrors(spec) {
  const errors = [];
  if (spec.ledger != null && !isRecord(spec.ledger)) {
    errors.push("ledger: must be a map of choices that are not already in another block");
    return errors;
  }
  for (const [field, blockName] of MOVED_FIELDS) {
    const blockPresent = blockName === "funnel" ? spec.funnel != null : spec[blockName] != null;
    if (blockPresent) continue;
    const raw = spec.ledger?.[field];
    const marked = isRecord(raw) && raw.moves_to === blockName;
    if (!marked) errors.push(`ledger: ${field} moves to ${blockName} when present`);
  }
  const record = buildRecord(spec);
  const choices = record.choices;
  const requiredText = [
    "audience",
    "problem_recurrence",
    "name",
    "icon",
    "price_model",
    "price",
    "product_type",
    "time_to_value",
    "invite_mechanic",
    "screenshot_style",
  ];
  for (const field of requiredText) {
    if (typeof choices[field] !== "string" || choices[field].trim().length === 0) errors.push(missing(field));
  }
  if (!MOTIVES.has(choices.download_motive)) errors.push("ledger record: download_motive must be money, mate, or escape");
  if (!ONBOARDING_TYPES.has(choices.onboarding_type)) {
    errors.push("ledger record: onboarding_type must be utility-quick-start, result-reveal, or quiz-led-problem");
  }
  if (!Number.isInteger(choices.onboarding_screen_count) || choices.onboarding_screen_count < 0) {
    errors.push(missing("onboarding_screen_count"));
  } else if (spec.onboarding == null) {
    const counted = (spec.screens ?? []).filter((screen) => screen.flow === "onboarding").length;
    if (choices.onboarding_screen_count !== counted) {
      errors.push(
        `ledger: onboarding_screen_count is ${choices.onboarding_screen_count} but ${counted} screens use flow onboarding`,
      );
    }
  }
  if (!Number.isInteger(choices.quiz_length) || choices.quiz_length < 0) errors.push(missing("quiz_length"));
  if (!PAYWALL_PLACEMENTS.has(choices.paywall_placement)) errors.push(missing("paywall_placement"));
  if (!PAYWALL_TYPES.has(choices.paywall_type)) errors.push(missing("paywall_type"));
  if (!PURCHASE_KINDS.has(choices.purchase_kind)) errors.push(missing("purchase_kind"));
  if (typeof choices.closing_discount !== "boolean") errors.push(missing("closing_discount"));
  if (typeof choices.mascot !== "boolean") errors.push(missing("mascot"));
  if (!Array.isArray(choices.acquisition_channels) || choices.acquisition_channels.length === 0) {
    errors.push(missing("acquisition_channels"));
  }
  if (!Array.isArray(choices.aso_keywords) || choices.aso_keywords.length === 0) errors.push(missing("aso_keywords"));
  if (!Array.isArray(choices.providers) || choices.providers.length === 0) errors.push(missing("providers"));
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(choices.product_type ?? "")) {
    errors.push("ledger record: product_type must be a lowercase slug");
  }
  return errors;
}

export function check(spec) {
  return [...hypothesisErrors(spec), ...choiceErrors(spec)];
}

export function emit(spec) {
  return {
    "ledger-record.yaml": YAML.stringify(buildRecord(spec), { lineWidth: 0 }),
  };
}
