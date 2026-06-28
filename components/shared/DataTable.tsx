"use client";

interface Column<T> {
  key: keyof T | string;
  label: string;
  render?: (row: T) => React.ReactNode;
  className?: string;
}

interface Props<T> {
  columns: Column<T>[];
  data: T[];
  keyField: keyof T;
  emptyMessage?: string;
  onRowClick?: (row: T) => void;
}

export function DataTable<T>({ columns, data, keyField, emptyMessage = "Tidak ada data", onRowClick }: Props<T>) {
  return (
    <div className="overflow-x-auto rounded border border-gray-200">
      <table className="min-w-full text-xs sm:text-sm">
        <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
          <tr>
            {columns.map((col) => (
              <th key={String(col.key)} className={`px-2 sm:px-3 py-2 text-left font-medium ${col.className ?? ""}`}>
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-3 py-8 text-center text-gray-400">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row) => (
              <tr key={String(row[keyField])} onClick={() => onRowClick?.(row)} className={`hover:bg-gray-50 ${onRowClick ? "cursor-pointer" : ""}`}>
                {columns.map((col) => (
                  <td key={String(col.key)} className={`px-2 sm:px-3 py-2 ${col.className ?? ""}`}>
                    {col.render ? col.render(row) : String((row as Record<string, unknown>)[String(col.key)] ?? "")}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
