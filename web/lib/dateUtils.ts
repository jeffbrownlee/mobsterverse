// Utility functions for date formatting with timezone support

/**
 * Get the user's timezone from localStorage or default to browser timezone
 */
export function getUserTimezone(): string {
  if (typeof window !== 'undefined') {
    const savedTimezone = localStorage.getItem('user_timezone');
    if (savedTimezone) {
      return savedTimezone;
    }
  }
  // Default to browser timezone
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

/**
 * Convert UTC date string to user's timezone and format as date
 */
export function formatDateNoTZ(dateString: string): string {
  const date = new Date(dateString); // Parse as UTC
  const timezone = getUserTimezone();
  return date.toLocaleDateString('en-US', { timeZone: timezone });
}

/**
 * Convert UTC date string to user's timezone and format as date and time
 */
export function formatDateTimeNoTZ(dateString: string): string {
  const date = new Date(dateString); // Parse as UTC
  const timezone = getUserTimezone();
  return date.toLocaleString('en-US', { timeZone: timezone });
}

/**
 * Convert UTC date string to datetime-local input format in user's timezone
 * Returns format: YYYY-MM-DDTHH:mm
 */
export function toDateTimeLocal(dateString: string): string {
  const date = new Date(dateString); // Parse as UTC
  const timezone = getUserTimezone();
  
  // Format the date in the user's timezone
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
  
  const parts = formatter.formatToParts(date);
  const partsMap: Record<string, string> = {};
  parts.forEach(part => {
    if (part.type !== 'literal') {
      partsMap[part.type] = part.value;
    }
  });
  
  const year = partsMap.year;
  const month = partsMap.month;
  const day = partsMap.day;
  const hour = partsMap.hour;
  const minute = partsMap.minute;
  
  return `${year}-${month}-${day}T${hour}:${minute}`;
}

/**
 * Convert datetime-local input value (in user's timezone) to UTC ISO string
 * Input format: YYYY-MM-DDTHH:mm (treated as user's timezone)
 * Output format: ISO 8601 UTC string
 */
export function localDateTimeToUTC(localDateTime: string): string {
  const timezone = getUserTimezone();
  
  // Parse the input
  const parts = localDateTime.match(/(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
  if (!parts) {
    throw new Error('Invalid datetime format');
  }
  
  const [, year, month, day, hour, minute] = parts;
  
  // Create the date string - we'll interpret this as being in the user's timezone
  // by creating a formatter that outputs in the user's timezone
  const dateStr = `${month}/${day}/${year}, ${hour}:${minute}:00`;
  
  // Create a date from this string - it will be interpreted in the browser's local time
  // But we need it to be interpreted in the user's configured timezone
  
  // The trick: format a known UTC time to see how it appears in the target timezone,
  // then work backwards to find what UTC time would appear as our desired local time
  
  // Use a reference date
  const referenceUTC = new Date(Date.UTC(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(hour), parseInt(minute), 0));
  
  // Format this UTC time to see what it looks like in the target timezone  
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
  
  const formattedInTz = formatter.format(referenceUTC);
  
  // Parse the formatted result to see what the UTC time looks like in the target timezone
  const tzParts = formattedInTz.match(/(\d{2})\/(\d{2})\/(\d{4}),?\s*(\d{2}):(\d{2}):(\d{2})/);
  if (!tzParts) {
    return referenceUTC.toISOString();
  }
  
  const [, tzMonth, tzDay, tzYear, tzHour, tzMinute] = tzParts;
  
  // Calculate the offset: how many milliseconds difference between 
  // the UTC time and how it displays in the timezone
  const utcMs = referenceUTC.getTime();
  const tzDisplayMs = Date.UTC(parseInt(tzYear), parseInt(tzMonth) - 1, parseInt(tzDay), parseInt(tzHour), parseInt(tzMinute), 0);
  const offsetMs = utcMs - tzDisplayMs;
  
  // Now apply this offset to get the correct UTC time
  // We want: "year-month-day hour:minute" in timezone
  // Which means: "year-month-day hour:minute" as UTC + offsetMs
  const desiredLocalMs = Date.UTC(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(hour), parseInt(minute), 0);
  const correctUtcMs = desiredLocalMs + offsetMs;
  
  return new Date(correctUtcMs).toISOString();
}

/**
 * Add days to a UTC date string and return formatted string in user's timezone
 */
export function addDaysToDate(dateString: string, days: number): string {
  const date = new Date(dateString); // Parse as UTC
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString();
}

/**
 * Calculate and format the time remaining between now and an end date
 * Returns a string with the two most significant time units
 * Examples: "8 days, 23 hours" or "23 hours, 30 minutes" or "1 minute, 57 seconds"
 */
export function getTimeRemaining(endDateString: string): string {
  const endDate = new Date(endDateString); // Parse as UTC
  const now = new Date();
  
  const diffMs = endDate.getTime() - now.getTime();
  
  // If time has passed, return "0 seconds"
  if (diffMs <= 0) {
    return "0 seconds";
  }
  
  // Calculate time units
  const seconds = Math.floor(diffMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  // Calculate remainders
  const remainingSeconds = seconds % 60;
  const remainingMinutes = minutes % 60;
  const remainingHours = hours % 24;
  
  // Helper function to format a time unit with proper singular/plural
  const formatUnit = (value: number, unit: string): string => {
    return `${value} ${unit}${value !== 1 ? 's' : ''}`;
  };
  
  // Build array of non-zero units
  const units: string[] = [];
  if (days > 0) units.push(formatUnit(days, 'day'));
  if (remainingHours > 0) units.push(formatUnit(remainingHours, 'hour'));
  if (remainingMinutes > 0) units.push(formatUnit(remainingMinutes, 'minute'));
  if (remainingSeconds > 0) units.push(formatUnit(remainingSeconds, 'second'));
  
  // Return the two most significant units
  return units.slice(0, 2).join(', ');
}

/**
 * Calculate and format relative time from a date to now
 * Returns a string like "started 3 days, 4 hours ago" or "starting in 2 days, 12 hours"
 */
export function getRelativeTime(dateString: string, context: 'started' | 'starting' | 'ended' | 'ending'): string {
  const date = new Date(dateString); // Parse as UTC
  const now = new Date();
  
  const diffMs = date.getTime() - now.getTime();
  const absDiffMs = Math.abs(diffMs);
  const isPast = diffMs < 0;
  
  // Calculate time units
  const seconds = Math.floor(absDiffMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  // Calculate remainders
  const remainingSeconds = seconds % 60;
  const remainingMinutes = minutes % 60;
  const remainingHours = hours % 24;
  
  // Helper function to format a time unit with proper singular/plural
  const formatUnit = (value: number, unit: string): string => {
    return `${value} ${unit}${value !== 1 ? 's' : ''}`;
  };
  
  // Build array of non-zero units
  const units: string[] = [];
  if (days > 0) units.push(formatUnit(days, 'day'));
  if (remainingHours > 0) units.push(formatUnit(remainingHours, 'hour'));
  if (remainingMinutes > 0) units.push(formatUnit(remainingMinutes, 'minute'));
  if (remainingSeconds > 0 && days === 0 && remainingHours === 0) units.push(formatUnit(remainingSeconds, 'second'));
  
  // Get the two most significant units
  const timeStr = units.slice(0, 2).join(', ') || '0 seconds';
  
  // Format based on context and whether it's past or future
  if (isPast) {
    return `${context.charAt(0).toUpperCase() + context.slice(1)} ${timeStr} ago`;
  } else {
    return `${context.charAt(0).toUpperCase() + context.slice(1)} in ${timeStr}`;
  }
}
