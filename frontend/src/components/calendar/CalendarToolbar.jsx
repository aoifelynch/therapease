import { theme } from '../../utils/theme';
import { withAlpha } from '../../utils/formatters';

export function CalendarToolbar({
  datePickerInputRef,
  onDatePickerChange,
  onPreviousRange,
  onNextRange,
  onOpenDatePicker,
  viewRangeLabel,
  calendarView,
  isViewingCurrentWeek,
  onGoToCurrentWeek,
  onViewChange,
  appointmentFilter,
  onFilterChange,
}) {
  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <div
          className="inline-flex items-center rounded-xl border px-2 py-1.5"
          style={{
            borderColor: withAlpha(theme.colors.secondary.beige, 0.9),
            backgroundColor: withAlpha(theme.colors.gray[50], 0.85),
          }}
        >
          <input
            ref={datePickerInputRef}
            type="date"
            className="sr-only"
            onChange={onDatePickerChange}
            tabIndex={-1}
            aria-hidden="true"
          />
          <button
            type="button"
            aria-label="Previous date range"
            onClick={onPreviousRange}
            className="rounded-lg px-2 py-1 text-sm font-semibold leading-none"
            style={{ color: withAlpha(theme.colors.secondary.charcoal, 0.7) }}
          >
            ‹
          </button>
          <button
            type="button"
            onClick={onOpenDatePicker}
            className="rounded-lg px-2 py-1 text-sm font-semibold leading-none"
            style={{ color: theme.colors.secondary.charcoal }}
            aria-label="Choose a date"
          >
            {viewRangeLabel || 'Select range'}
          </button>
          <button
            type="button"
            aria-label="Next date range"
            onClick={onNextRange}
            className="rounded-lg px-2 py-1 text-sm font-semibold leading-none"
            style={{ color: withAlpha(theme.colors.secondary.charcoal, 0.7) }}
          >
            ›
          </button>
        </div>

        {calendarView === 'timeGridWeek' && !isViewingCurrentWeek && (
          <button
            type="button"
            onClick={onGoToCurrentWeek}
            className="rounded-xl border px-3 py-2 text-sm font-semibold"
            style={{
              borderColor: withAlpha(theme.colors.primary.DEFAULT, 0.35),
              color: theme.colors.primary.darker,
              backgroundColor: withAlpha(theme.colors.secondary.sage, 0.55),
            }}
          >
            This Week
          </button>
        )}

        <label className="sr-only" htmlFor="calendar-view">Change calendar view</label>
        <select
          id="calendar-view"
          value={calendarView}
          onChange={(event) => onViewChange(event.target.value)}
          className="rounded-xl border px-3 py-1.5 text-sm font-medium"
          style={{
            borderColor: withAlpha(theme.colors.secondary.beige, 0.92),
            color: theme.colors.secondary.charcoal,
            backgroundColor: withAlpha(theme.colors.gray[50], 0.9),
            appearance: 'none',
            WebkitAppearance: 'none',
            MozAppearance: 'none',
            paddingRight: '2.25rem',
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='none' stroke='%236b7e5a' stroke-width='1.8' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M5 7.5l5 5 5-5'/%3E%3C/svg%3E")`,
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'right 0.8rem center',
            backgroundSize: '0.9rem',
          }}
        >
          <option value="dayGridMonth">Change View: Month</option>
          <option value="timeGridWeek">Change View: Week</option>
          <option value="timeGridDay">Change View: Day</option>
        </select>

        <label className="sr-only" htmlFor="calendar-filter-sort">Filter appointments</label>
        <select
          id="calendar-filter-sort"
          value={appointmentFilter}
          onChange={(event) => {
            onFilterChange(event.target.value);
          }}
          className="rounded-xl border px-3 py-1.5 text-sm font-medium"
          style={{
            borderColor: withAlpha(theme.colors.secondary.beige, 0.92),
            color: theme.colors.secondary.charcoal,
            backgroundColor: withAlpha(theme.colors.gray[50], 0.9),
          }}
        >
          <option value="all">All</option>
          <option value="online">Online</option>
          <option value="in-person">In-Person</option>
        </select>
      </div>

      <div className="ml-auto flex flex-wrap items-center gap-2 rounded-xl px-3 py-1.5" style={{ backgroundColor: withAlpha(theme.colors.gray[50], 0.88), border: `1px solid ${withAlpha(theme.colors.secondary.beige, 0.9)}` }}>
        <span className="text-xs font-semibold uppercase tracking-[0.12em]" style={{ color: withAlpha(theme.colors.secondary.charcoal, 0.62) }}>
          Key
        </span>
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: '#4869e8' }} />
          <span className="text-xs font-medium" style={{ color: withAlpha(theme.colors.secondary.charcoal, 0.82) }}>
            Online
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: '#ef7f1a' }} />
          <span className="text-xs font-medium" style={{ color: withAlpha(theme.colors.secondary.charcoal, 0.82) }}>
            In-person
          </span>
        </div>
      </div>
    </div>
  );
}
