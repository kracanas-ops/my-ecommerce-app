const MIN_SECRET_LENGTH = 32;

const REQUIRED_VARIABLES = ['MONGO_URI', 'JWT_SECRET'];

const PLACEHOLDER_PATTERNS = [/replace[-_]?me/i, /^changeme$/i, /^secret$/i];

function isPlaceholder(value) {
  return PLACEHOLDER_PATTERNS.some((pattern) => pattern.test(value));
}

/**
 * Validates the environment before the server binds a port.
 *
 * Failing here produces a single readable message instead of a server that
 * boots "successfully" and then returns opaque 500s on every authenticated
 * request (which is what happens today when JWT_SECRET is missing, because the
 * secret is only resolved inside the auth middleware).
 */
function validateEnv(env = process.env) {
  const errors = [];
  const warnings = [];

  for (const name of REQUIRED_VARIABLES) {
    const value = env[name];
    if (typeof value !== 'string' || !value.trim()) {
      errors.push(`${name} is required.`);
      continue;
    }
    if (isPlaceholder(value.trim())) {
      errors.push(`${name} still holds the example placeholder value.`);
    }
  }

  if (typeof env.JWT_SECRET === 'string' && env.JWT_SECRET.trim().length < MIN_SECRET_LENGTH) {
    warnings.push(`JWT_SECRET is shorter than ${MIN_SECRET_LENGTH} characters; use a long random value.`);
  }

  if (env.PORT !== undefined && !/^\d+$/.test(String(env.PORT))) {
    errors.push('PORT must be a whole number.');
  }

  if (!env.STRIPE_SECRET_KEY) {
    warnings.push('STRIPE_SECRET_KEY is not set; checkout will return 503.');
  }
  if (!env.STRIPE_WEBHOOK_SECRET) {
    warnings.push('STRIPE_WEBHOOK_SECRET is not set; the Stripe webhook will return 503.');
  }

  if (!env.OPENROUTER_API_KEY) {
    warnings.push('OPENROUTER_API_KEY is not set; the AI shopping assistant will return 503.');
  }

  const stripeSecretPrefix = env.STRIPE_SECRET_KEY?.trim().slice(0, 8);
  if (stripeSecretPrefix && !/^sk_(test|live)_/.test(stripeSecretPrefix)) {
    warnings.push('STRIPE_SECRET_KEY does not look like a Stripe secret key.');
  }

  return { errors, warnings };
}

/**
 * Logs the validation result and aborts the process on a fatal misconfiguration.
 */
function assertValidEnv(env = process.env, logger = console) {
  const { errors, warnings } = validateEnv(env);

  for (const warning of warnings) {
    logger.warn(`[config] ${warning}`);
  }
  if (errors.length > 0) {
    for (const error of errors) {
      logger.error(`[config] ${error}`);
    }
    const failure = new Error(`Invalid environment configuration:\n- ${errors.join('\n- ')}`);
    failure.isConfigurationError = true;
    throw failure;
  }
}

module.exports = { validateEnv, assertValidEnv, MIN_SECRET_LENGTH };
