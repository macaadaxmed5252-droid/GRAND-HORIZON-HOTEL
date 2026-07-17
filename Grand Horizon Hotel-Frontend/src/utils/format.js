const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
});

export function formatCurrency(value) {
  const amount = Number(value);
  if (Number.isNaN(amount)) return "—";
  return currencyFormatter.format(amount);
}

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

/** Formats an ISO `yyyy-MM-dd` (or full ISO datetime) string for display. */
export function formatDate(isoDate) {
  if (!isoDate) return "—";
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return isoDate;
  return dateFormatter.format(date);
}

/** Converts a Date to the `yyyy-MM-dd` string the backend's LocalDate fields expect. */
export function toIsoDateString(date) {
  if (!date) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function titleCase(value) {
  if (!value) return "";
  return value
    .toString()
    .toLowerCase()
    .split(/[_\s]+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
