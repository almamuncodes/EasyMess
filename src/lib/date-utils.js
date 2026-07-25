// Bangladesh Standard Time (Asia/Dhaka, UTC+6) Utilities
const BD_OFFSET_MS = 6 * 60 * 60 * 1000;

/**
 * Returns current date & time components in Bangladesh Standard Time (UTC+6)
 */
export function getBDNow() {
  const bdDate = new Date(Date.now() + BD_OFFSET_MS);
  const year = bdDate.getUTCFullYear();
  const month = bdDate.getUTCMonth() + 1;
  const day = bdDate.getUTCDate();
  const hours = bdDate.getUTCHours();
  const minutes = bdDate.getUTCMinutes();
  const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

  return {
    year,
    month,
    day,
    hours,
    minutes,
    dateStr,
    bdDateObj: bdDate,
  };
}

/**
 * Converts any Date object, timestamp, or string into YYYY-MM-DD format in BD Time
 */
export function getBDDateStr(inputDate = new Date()) {
  let dateObj;
  if (typeof inputDate === "string") {
    if (inputDate.length === 10 && inputDate.includes("-")) {
      return inputDate; // Already YYYY-MM-DD
    }
    dateObj = new Date(inputDate);
  } else if (typeof inputDate === "number") {
    dateObj = new Date(inputDate);
  } else {
    dateObj = inputDate;
  }

  if (isNaN(dateObj.getTime())) {
    return getBDNow().dateStr;
  }

  const bdDate = new Date(dateObj.getTime() + BD_OFFSET_MS);
  const year = bdDate.getUTCFullYear();
  const month = String(bdDate.getUTCMonth() + 1).padStart(2, "0");
  const day = String(bdDate.getUTCDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

/**
 * Returns { month, year } for a given date in Bangladesh Time
 */
export function getBDMonthYear(inputDate = new Date()) {
  let dateObj = typeof inputDate === "string" || typeof inputDate === "number"
    ? new Date(inputDate)
    : inputDate;

  if (isNaN(dateObj.getTime())) {
    const now = getBDNow();
    return { month: now.month, year: now.year };
  }

  const bdDate = new Date(dateObj.getTime() + BD_OFFSET_MS);
  return {
    month: bdDate.getUTCMonth() + 1,
    year: bdDate.getUTCFullYear(),
  };
}

/**
 * Converts YYYY-MM-DD string to a Date object representing UTC Midnight (for DB matching)
 */
export function parseBDDateToUTC(dateStr) {
  if (!dateStr) return new Date();
  const cleanStr = String(dateStr).split("T")[0];
  const [year, month, day] = cleanStr.split("-").map(Number);
  if (!year || !month || !day) return new Date();
  return new Date(Date.UTC(year, month - 1, day));
}

/**
 * Safely extracts day of month (1-31) from stored Mongo UTC Midnight date string/Date
 */
export function getUTCDayFromMongoDate(mongoDate) {
  if (!mongoDate) return null;
  const d = new Date(mongoDate);
  if (isNaN(d.getTime())) return null;
  return d.getUTCDate();
}
