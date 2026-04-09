import { theme } from '../utils/theme';
import { withAlpha } from '../utils/formatters';
import { componentStyles } from '../utils/componentStyles';

export const AppDataTable = ({
  columns,
  rows,
  rowKey,
  renderRow,
  loading = false,
  loadingMessage = 'Loading...',
  emptyMessage = 'No records found.',
  minWidthClassName = 'min-w-[640px]',
  tableClassName = '',
  headerRowClassName = '',
  headerCellClassName = '',
  loadingCellClassName = 'px-4 py-8 text-sm',
  emptyCellClassName = 'px-4 py-8 text-sm',
  rowStyle,
}) => {
  const hasColWidths = columns.some((column) => column.widthClassName);

  return (
    <div className="overflow-x-auto">
      <table className={`w-full table-fixed text-sm ${minWidthClassName} ${tableClassName}`.trim()}>
        {hasColWidths && (
          <colgroup>
            {columns.map((column) => (
              <col key={column.key} className={column.widthClassName} />
            ))}
          </colgroup>
        )}

        <thead>
          <tr
            className={headerRowClassName}
            style={{
              borderBottom: `1px solid ${withAlpha(theme.colors.secondary.beige, 0.9)}`,
              color: withAlpha(theme.colors.secondary.charcoal, 0.58),
            }}
          >
            {columns.map((column) => (
              <th
                key={column.key}
                className={`px-3 py-3 text-left text-xs font-semibold uppercase tracking-[0.16em] align-middle ${headerCellClassName} ${column.headerClassName || ''}`.trim()}
              >
                {column.label}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {loading ? (
            <tr>
              <td colSpan={columns.length} className={loadingCellClassName} style={{ color: componentStyles.subtleText }}>
                {loadingMessage}
              </td>
            </tr>
          ) : rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className={emptyCellClassName} style={{ color: componentStyles.subtleText }}>
                {emptyMessage}
              </td>
            </tr>
          ) : (
            rows.map((row, index) => {
              const baseStyle = {
                borderBottom: `1px solid ${componentStyles.lightBorder}`,
                color: withAlpha(theme.colors.secondary.charcoal, 0.78),
                backgroundColor: componentStyles.getZebraRow(index),
              };

              return (
                <tr key={rowKey(row, index)} style={{ ...baseStyle, ...(rowStyle?.(row, index) || {}) }}>
                  {renderRow(row, index)}
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
};
