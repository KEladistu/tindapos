import type { Centavos } from '../../../engine/money';

export interface SplitLine {
  id: string;
  name: string;
  lineTotalCentavos: Centavos;
}

/**
 * Split a total evenly among N people. Handles centavo remainder by giving
 * the extra 1c to the first R people (where R = total mod N).
 * Returns an array of length N; sum equals total exactly.
 */
export function splitEvenly(totalC: Centavos, people: number): Centavos[] {
  if (people <= 0) throw new Error('people must be >= 1');
  const base = Math.floor(totalC / people);
  const remainder = totalC - base * people;
  const shares: Centavos[] = [];
  for (let i = 0; i < people; i++) {
    shares.push(base + (i < remainder ? 1 : 0));
  }
  return shares;
}

export interface ByItemAssignment {
  /** Map from line id -> person index (0..people-1). Unassigned lines go to person 0. */
  [lineId: string]: number;
}

export interface ByItemResult {
  perPerson: { personIndex: number; lines: SplitLine[]; totalC: Centavos }[];
}

/**
 * Split lines by assigning each line to one person. Line totals are integer
 * centavos and are NOT further divided (each line belongs entirely to one
 * person). Consumers wanting to split a single line should first duplicate it.
 */
export function splitByItem(
  lines: SplitLine[],
  people: number,
  assignment: ByItemAssignment
): ByItemResult {
  if (people <= 0) throw new Error('people must be >= 1');
  const buckets: { personIndex: number; lines: SplitLine[]; totalC: Centavos }[] = [];
  for (let i = 0; i < people; i++) buckets.push({ personIndex: i, lines: [], totalC: 0 });
  for (const line of lines) {
    const p = assignment[line.id];
    const target = p != null && p >= 0 && p < people ? p : 0;
    buckets[target].lines.push(line);
    buckets[target].totalC += line.lineTotalCentavos;
  }
  return { perPerson: buckets };
}
