/**
 * Feature flag API stub. No flags are defined here — this is a demo exercise.
 * Replace this implementation with your feature-flag provider (e.g. LaunchDarkly).
 *
 * - initFlags(): Stub; replace with your SDK's client.init().
 * - evaluateFlag(flagKey, defaultValue, context?): Returns defaultValue only.
 *   Replace with your SDK's variation(flagKey, defaultValue) using the same contract.
 */

let initLogs: string[] = []
let initDone = false

type LDClientLike = { variation: (key: string, defaultValue: unknown) => unknown }
let ldClient: LDClientLike | null = null

/**
 * Set the LaunchDarkly client so evaluateFlag uses it. Call from a component that has useLDClient().
 */
export function setFlagsLdClient(client: LDClientLike | null): void {
  ldClient = client
}

export function initFlags(): { initialized: boolean; logs: string[] } {
  if (initDone) {
    return { initialized: true, logs: initLogs }
  }
  initLogs = [
    `[${new Date().toISOString()}] Flags stub — no SDK. Add LaunchDarkly (or another provider) and init here.`,
  ]
  initDone = true
  return { initialized: true, logs: initLogs }
}

/**
 * Returns the default value only. Replace with your provider's variation/get method.
 * context: optional user/request context for targeting (e.g. userId, attributes).
 */
export function evaluateFlag<T>(
  flagKey: string,
  defaultValue: T,
  _context?: { userId?: string; [key: string]: unknown }
): T {
  if (ldClient) {
    return ldClient.variation(flagKey, defaultValue) as T
  }
  return defaultValue
}

export function getInitLogs(): string[] {
  return [...initLogs]
}

export function isInitDone(): boolean {
  return initDone
}
