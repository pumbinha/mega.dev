// The problems #4471 really holds. causes.ts sorts a report by its tenant, and the desk counts it
// there. A report the desk read as a one-day move (desk-notes.json) is no day/month swap at all, so
// it is its own problem too: counted under its tenant's cause, as the desk files it, and again here.
import notes from '#lib/data/desk-notes.json';
import { causeOf, uniqueById, type Cause, type Report, type Tenant } from '#lib/kb/causes';

export type Problem = Cause | 'shift';

// Each problem has its own ticket in the split repo.
export const PROBLEMS: Record<Problem, { issue: number; title: string }> = {
  parser: { issue: 1, title: 'parser reads day-first dates month first' },
  hint: { issue: 2, title: 'booking-v3 form hint says MM/DD in day-first tenants' },
  shift: { issue: 3, title: 'dates move by one day: time-zone shift' },
};

export const isShift = (r: Pick<Report, 'id'>): boolean => notes.oneDayMove.includes(r.id);

export type ProblemGroup = {
  problem: Problem | 'unplaced';
  reports: Report[];
  tenants: number;
  firstSeen: string;
  lastSeen: string;
};

function group(problem: ProblemGroup['problem'], rs: Report[]): ProblemGroup {
  const days = rs.map((r) => r.receivedAt.slice(0, 10)).sort();
  return {
    problem,
    reports: rs,
    tenants: new Set(rs.map((r) => r.tenant)).size,
    firstSeen: days[0],
    lastSeen: days[days.length - 1],
  };
}

export function groupByProblem(reports: Report[], tenantOf: (r: Report) => Tenant | undefined): ProblemGroup[] {
  const byCause = new Map<ProblemGroup['problem'], Report[]>();
  const unique = uniqueById(reports);
  for (const r of unique) {
    const c = causeOf(r, tenantOf(r)) ?? 'unplaced';
    byCause.set(c, [...(byCause.get(c) ?? []), r]);
  }
  const shift = unique.filter(isShift);
  return [
    ...[...byCause.entries()].map(([c, rs]) => group(c, rs)).sort((a, b) => b.reports.length - a.reports.length),
    ...(shift.length ? [group('shift', shift)] : []),
  ];
}
