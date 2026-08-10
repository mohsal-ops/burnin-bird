const CURRENCY_FORMATTER = new Intl.NumberFormat("en-US", {
  currency: "USD",
  style: "currency",
  minimumFractionDigits: 2,
});

export function formatCurrency(amount: number) {
  return CURRENCY_FORMATTER.format(amount);
}

const NUMBER_FORMATTER = new Intl.NumberFormat("en-US");

export function formatNumber(number: number) {
  return NUMBER_FORMATTER.format(number);
}

const DATE_TIME_FORMATTER = new Intl.DateTimeFormat("en", {
  dateStyle: "medium",
  timeStyle: "short",
});

export function formatDateTime(date: Date) {
  return DATE_TIME_FORMATTER.format(date);
}

const DATE_FORMATTER = new Intl.DateTimeFormat("en", {
  dateStyle: "medium",
});

export function formatDate(date: Date) {
  return DATE_FORMATTER.format(date);
}
