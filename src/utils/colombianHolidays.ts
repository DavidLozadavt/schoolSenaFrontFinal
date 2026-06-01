import Holidays from 'date-holidays';

/** Formato YYYY-MM-DD en hora local (evita desfase por UTC). */
export const toLocalDateKey = (date: Date): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

/** Festivos de Colombia entre fromYear y toYear (inclusive). */
export const getColombianHolidayDateSet = (fromYear: number, toYear: number): Set<string> => {
  const hd = new Holidays('CO');
  const set = new Set<string>();
  for (let year = fromYear; year <= toYear; year++) {
    hd.getHolidays(year).forEach((holiday: { date: string }) => {
      set.add(holiday.date.split(' ')[0]);
    });
  }
  return set;
};

export const isColombianHoliday = (date: Date, holidays: Set<string>): boolean =>
  holidays.has(toLocalDateKey(date));

/** Mapa de festivos colombianos: 'YYYY-MM-DD' -> nombre del festivo */
export const getColombianHolidayMap = (fromYear: number, toYear: number): Map<string, string> => {
  const hd = new Holidays('CO');
  const map = new Map<string, string>();
  for (let year = fromYear; year <= toYear; year++) {
    hd.getHolidays(year).forEach((holiday: { date: string; name: string }) => {
      map.set(holiday.date.split(' ')[0], holiday.name);
    });
  }
  return map;
};