// Hotel je u Crnoj Gori (UTC+1/+2, DST); Railway radi u UTC. Sve "danas" i "sat"
// odluke moraju biti u hotelskoj zoni da push/izvještaji ne padnu u pogrešan dan.
export const HOTEL_TZ = 'Europe/Podgorica';

/** Datum (YYYY-MM-DD) i sat u hotelskoj vremenskoj zoni. */
export function hotelNowParts(d: Date = new Date()): { date: string; hour: number } {
  const date = new Intl.DateTimeFormat('en-CA', {
    timeZone: HOTEL_TZ, year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(d);
  const hour = parseInt(new Intl.DateTimeFormat('en-GB', {
    timeZone: HOTEL_TZ, hour: '2-digit', hour12: false,
  }).format(d), 10);
  return { date, hour };
}

/** UTC instant koji odgovara 00:00 hotelske zone datog datuma (YYYY-MM-DD). */
export function hotelMidnightUtc(dateStr: string): Date {
  const asIfUtc = new Date(`${dateStr}T00:00:00Z`);
  const tzWall = new Date(asIfUtc.toLocaleString('en-US', { timeZone: HOTEL_TZ }));
  const utcWall = new Date(asIfUtc.toLocaleString('en-US', { timeZone: 'UTC' }));
  const offset = utcWall.getTime() - tzWall.getTime();
  return new Date(asIfUtc.getTime() + offset);
}
