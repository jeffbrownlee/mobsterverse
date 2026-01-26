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
