import { RatingData } from './bot.repository';

// ========= GLICKO =============

export function glicko(
  matchScore: number[],
  rating1: RatingData,
  rating2: RatingData,
): [RatingData, RatingData] {
  const r1 = structuredClone(rating1);
  const r2 = structuredClone(rating2);
  const s = (matchScore[0] + 1) / 2;
  r1.value =
    rating1.value +
    (q * g(rating2.RD) * (s - exp(rating1.value, rating2.value, rating2.RD))) /
      (1 / (rating1.RD * rating1.RD) +
        1 / d2(rating1.value, rating2.value, rating2.RD));
  r2.value =
    rating2.value +
    (q *
      g(rating1.RD) *
      (1 - s - exp(rating2.value, rating1.value, rating1.RD))) /
      (1 / (rating2.RD * rating2.RD) +
        1 / d2(rating2.value, rating1.value, rating1.RD));
  r1.RD = Math.max(
    Math.sqrt(
      1 /
        (1 / (rating1.RD * rating1.RD) +
          1 / d2(rating1.value, rating2.value, rating2.RD)),
    ),
    30,
  );
  r2.RD = Math.max(
    Math.sqrt(
      1 /
        (1 / (rating2.RD * rating2.RD) +
          1 / d2(rating2.value, rating1.value, rating1.RD)),
    ),
    30,
  );
  return [r1, r2];
}

const q = Math.log(10) / 400;

function g(rd: number): number {
  return 1 / Math.sqrt(1 + (3 * q * q * rd * rd) / (Math.PI * Math.PI));
}

function exp(r: number, rj: number, rdj: number): number {
  return 1 / (1 + Math.pow(10, (g(rdj) * (rj - r)) / 400));
}

function d2(r: number, rj: number, rdj: number): number {
  const gj = g(rdj);
  const ej = exp(r, rj, rdj);
  return 1 / (q * q * gj * gj * ej * (1 - ej));
}

// ===============================
