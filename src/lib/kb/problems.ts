// The problems #4471 really holds. causes.ts sorts a report by its tenant; a report the desk read
// as a one-day move (desk-notes.json) is no day/month swap at all, so it is its own problem.
import notes from '#lib/data/desk-notes.json';
import { causeOf, uniqueById, type Cause, type Report, type Tenant } from '#lib/kb/causes';

export type Problem = Cause | 'shift';

// Each problem has its own ticket in the split repo.
export const PROBLEMS: Record<Problem, { issue: number; title: string }> = {
  parser: { issue: 1, title: 'parser reads day-first dates month first' },
  hint: { issue: 2, title: 'booking-v3 form hint says MM/DD in day-first tenants' },
  shift: { issue: 3, title: 'dates move by one day: time-zone shift' },
};

export function problemOf(r: Report, t: Tenant | undefined): Problem | null {
  if (notes.oneDayMove.includes(r.id)) return 'shift';
  return causeOf(r, t);
}

export type ProblemGroup = {
  problem: Problem | 'unplaced';
  reports: Report[];
  tenants: number;
  firstSeen: string;
  lastSeen: string;
};

export function groupByProblem(reports: Report[], tenantOf: (r: Report) => Tenant | undefined): ProblemGroup[] {
  const byProblem = new Map<ProblemGroup['problem'], Report[]>();
  for (const r of uniqueById(reports)) {
    const p = problemOf(r, tenantOf(r)) ?? 'unplaced';
    byProblem.set(p, [...(byProblem.get(p) ?? []), r]);
  }
  return [...byProblem.entries()]
    .map(([problem, rs]) => {
      const days = rs.map((r) => r.receivedAt.slice(0, 10)).sort();
      return {
        problem,
        reports: rs,
        tenants: new Set(rs.map((r) => r.tenant)).size,
        firstSeen: days[0],
        lastSeen: days[days.length - 1],
      };
    })
    .sort((a, b) => b.reports.length - a.reports.length);
}
