// Utility functions for date formatting

// Format a date string treating it as a naive/local datetime (no timezone conversion)
export function formatDateNoTZ(dateString: string): string {
  // Parse the ISO string as local time by removing any Z and treating as-is
  const cleanString = dateString.replace('Z', '').replace(/\.\d{3}$/, '');
  const date = new Date(cleanString);
  return date.toLocaleDateString();
}

export function formatDateTimeNoTZ(dateString: string): string {
  // Parse the ISO string as local time by removing any Z and treating as-is
  const cleanString = dateString.replace('Z', '').replace(/\.\d{3}$/, '');
  const date = new Date(cleanString);
  return date.toLocaleString();
}

// Convert a date string to datetime-local input format (YYYY-MM-DDTHH:mm)
// Strips the Z and any timezone info to display the raw date/time
export function toDateTimeLocal(dateString: string): string {
  // Remove the Z if present and just take the date/time part
  const cleanString = dateString.replace('Z', '').split('.')[0];
  return cleanString.slice(0, 16);
}

// Add days to a date string and return formatted string
export function addDaysToDate(dateString: string, days: number): string {
  const cleanString = dateString.replace('Z', '').replace(/\.\d{3}$/, '');
  const date = new Date(cleanString);
  date.setDate(date.getDate() + days);
  // Return in ISO format without Z (keep as naive datetime)
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
}

// Calculate and format the time remaining between now and an end date
// Returns a string with the two most significant time units
// Examples: "8 days, 23 hours" or "23 hours, 30 minutes" or "1 minute, 57 seconds"
export function getTimeRemaining(endDateString: string): string {
  const cleanString = endDateString.replace('Z', '').replace(/\.\d{3}$/, '');
  const endDate = new Date(cleanString);
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
