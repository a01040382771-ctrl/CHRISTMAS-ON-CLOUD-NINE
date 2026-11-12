/** Dev-only object on window used by the automated browser checks (never populated in production builds). */
export function devHandle(): Record<string, unknown> {
  const w = window as unknown as { __skyVillage?: Record<string, unknown> };
  return (w.__skyVillage ??= {});
}
