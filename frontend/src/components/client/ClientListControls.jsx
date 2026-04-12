import { theme } from '../../utils/theme';
import { withAlpha } from '../../utils/formatters';
import { componentStyles } from '../../utils/componentStyles';

export function ClientListControls({
  searchTerm,
  onSearchTermChange,
  showFilters,
  onToggleFilters,
  sortOptions,
  sortBy,
  onSortByChange,
  filters,
  onToggleFilter,
}) {
  return (
    <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
      <label className="relative block w-full max-w-md">
        <span className="sr-only">Search clients</span>
        <input
          type="search"
          value={searchTerm}
          onChange={(event) => onSearchTermChange(event.target.value)}
          placeholder="Search"
          className="w-full rounded-xl border bg-white py-2 pl-3 pr-10 text-sm outline-none transition focus:ring-2"
          style={{
            borderColor: componentStyles.border,
            color: theme.colors.secondary.charcoal,
          }}
        />
        <span
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2"
          style={{ color: withAlpha(theme.colors.secondary.charcoal, 0.55) }}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4" aria-hidden="true">
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
        </span>
      </label>

      <div className="relative">
        <button
          type="button"
          onClick={onToggleFilters}
          className="inline-flex items-center gap-2 rounded-xl border bg-white px-4 py-2 text-sm font-medium"
          style={{ borderColor: componentStyles.border, color: theme.colors.secondary.charcoal }}
        >
          Filter / Sort
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4" aria-hidden="true">
            <path d="m6 9 6 6 6-6" />
          </svg>
        </button>

        {showFilters && (
          <div
            className="absolute right-0 top-full z-20 mt-2 w-64 rounded-2xl border bg-white p-3 shadow-lg"
            style={{ borderColor: componentStyles.border }}
          >
            <p className="px-1 pb-1 text-xs font-semibold uppercase tracking-[0.08em]" style={{ color: withAlpha(theme.colors.secondary.charcoal, 0.52) }}>
              Sort
            </p>
            {sortOptions.map((option) => (
              <label key={option.value} className="flex items-center gap-2 px-1 py-1.5 text-sm" style={{ color: withAlpha(theme.colors.secondary.charcoal, 0.85) }}>
                <input
                  type="radio"
                  name="client-sort"
                  checked={sortBy === option.value}
                  onChange={() => onSortByChange(option.value)}
                  className="h-4 w-4 border"
                />
                {option.label}
              </label>
            ))}

            <div className="my-2 h-px" style={{ backgroundColor: withAlpha(theme.colors.secondary.beige, 0.8) }} />

            <p className="px-1 pb-1 text-xs font-semibold uppercase tracking-[0.08em]" style={{ color: withAlpha(theme.colors.secondary.charcoal, 0.52) }}>
              Filters
            </p>
            {[
              ['upcomingAppointment', 'Has upcoming appointment'],
              ['actionsNeeded', 'Actions needed'],
              ['active', 'Active'],
              ['inactive', 'Inactive'],
            ].map(([key, label]) => (
              <label key={key} className="flex items-center gap-2 px-1 py-1.5 text-sm" style={{ color: withAlpha(theme.colors.secondary.charcoal, 0.85) }}>
                <input
                  type="checkbox"
                  checked={filters[key]}
                  onChange={() => onToggleFilter(key)}
                  className="h-4 w-4 rounded border"
                />
                {label}
              </label>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
