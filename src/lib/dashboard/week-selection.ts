export interface DashboardWeekSelection {
  selectedWeekStartDate: string;
  currentWeekStartDate: string;
  previousWeekStartDate: string;
  nextWeekStartDate: string | null;
  isCurrentWeek: boolean;
}

type WeekParam = string | string[] | undefined;

const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function resolveDashboardWeekSelection(
  weekParam: WeekParam,
  now: Date = new Date(),
): DashboardWeekSelection {
  const currentWeekStartDate = getWeekStartDateOnly(now);
  const requestedWeekStartDate = getRequestedWeekStartDate(weekParam);
  const selectedWeekStartDate =
    requestedWeekStartDate && requestedWeekStartDate <= currentWeekStartDate
      ? requestedWeekStartDate
      : currentWeekStartDate;

  const previousWeekStartDate = addDaysDateOnly(selectedWeekStartDate, -7);
  const nextCandidate = addDaysDateOnly(selectedWeekStartDate, 7);
  const nextWeekStartDate =
    nextCandidate <= currentWeekStartDate ? nextCandidate : null;

  return {
    selectedWeekStartDate,
    currentWeekStartDate,
    previousWeekStartDate,
    nextWeekStartDate,
    isCurrentWeek: selectedWeekStartDate === currentWeekStartDate,
  };
}

export function dashboardWeekDateFromDateOnly(dateOnly: string): Date {
  return new Date(`${dateOnly}T12:00:00`);
}

export function getDashboardWeekHref(
  weekStartDate: string,
  currentWeekStartDate: string,
): string {
  return weekStartDate === currentWeekStartDate
    ? "/dashboard"
    : `/dashboard?week=${weekStartDate}`;
}

function getRequestedWeekStartDate(weekParam: WeekParam): string | null {
  const value = Array.isArray(weekParam) ? weekParam[0] : weekParam;

  if (!value || !DATE_ONLY_PATTERN.test(value)) {
    return null;
  }

  const date = dashboardWeekDateFromDateOnly(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return getWeekStartDateOnly(date);
}

function getWeekStartDateOnly(date: Date): string {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);

  const day = start.getDay();
  const daysFromMonday = (day + 6) % 7;
  start.setDate(start.getDate() - daysFromMonday);

  return getDateOnly(start);
}

function addDaysDateOnly(dateOnly: string, days: number): string {
  const date = dashboardWeekDateFromDateOnly(dateOnly);
  date.setDate(date.getDate() + days);
  return getDateOnly(date);
}

function getDateOnly(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}
