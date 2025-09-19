import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table";
import React, { useCallback, useMemo, useState } from "react";
import type {
  ClassificationsRow,
  StringsRow,
  ValidationError,
} from "../types/csv";

interface EditableTableProps {
  data: StringsRow[] | ClassificationsRow[];
  type: "strings" | "classifications";
  validationErrors?: ValidationError[];
  onDataChange: (updatedData: StringsRow[] | ClassificationsRow[]) => void;
  readonly?: boolean;
}

const stringColumnHelper = createColumnHelper<StringsRow>();
const classificationColumnHelper = createColumnHelper<ClassificationsRow>();

type RowData = StringsRow | ClassificationsRow;

type EditableCellProps = {
  getValue: () => string;
  row: { index: number };
  column: { id: string | number };
  table: { options: { meta?: unknown } };
  validationErrors?: ValidationError[];
  readonly?: boolean;
};

const EditableCell: React.FC<EditableCellProps> = ({
  getValue,
  row,
  column,
  table,
  validationErrors,
  readonly,
}) => {
  const initialValue = getValue();
  const [value, setValue] = useState(initialValue);

  const onBlur = () => {
    const updater = (
      table.options.meta as
        | {
            updateData?: (
              rowIndex: number,
              columnId: string,
              value: string
            ) => void;
          }
        | undefined
    )?.updateData;
    updater?.(row.index, String(column.id), String(value));
  };

  const onChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setValue(e.target.value);
  };

  React.useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  const cellErrors =
    validationErrors?.filter(
      (error) =>
        error.row === row.index + 1 &&
        (error.field === (column.id as string) ||
          error.field.includes(column.id as string))
    ) || [];

  const hasError = cellErrors.length > 0;
  const isLongText =
    (column.id as string) === "Prompt" ||
    (column.id as string) === "Risks" ||
    (column.id as string) === "Keywords";

  if (readonly) {
    return (
      <div
        className={`min-h-[36px] rounded-md px-2 py-1 text-sm ${hasError ? "bg-rose-50 ring-1 ring-rose-300" : ""}`}
      >
        {value}
        {hasError && (
          <div className="mt-1 text-xs text-rose-700">
            {cellErrors.map((error, idx) => (
              <div key={idx}>{error.message}</div>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (isLongText) {
    return (
      <div className="space-y-1">
        <textarea
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          className={`block w-full rounded-md border-slate-300 bg-white px-2 py-1 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 ${hasError ? "border-rose-300 bg-rose-50" : ""}`}
          rows={2}
        />
        {hasError && (
          <div className="text-xs text-rose-700">
            {cellErrors.map((error, idx) => (
              <div key={idx}>{error.message}</div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <input
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        className={`block w-full rounded-md border-slate-300 bg-white px-2 py-1 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 ${hasError ? "border-rose-300 bg-rose-50" : ""}`}
      />
      {hasError && (
        <div className="text-xs text-rose-700">
          {cellErrors.map((error, idx) => (
            <div key={idx}>{error.message}</div>
          ))}
        </div>
      )}
    </div>
  );
};

const EditableTable: React.FC<EditableTableProps> = ({
  data,
  type,
  validationErrors,
  onDataChange,
  readonly = false,
}) => {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");

  const handleDeleteRow = useCallback(
    (rowIndex: number) => {
      const updated = (data as RowData[]).filter(
        (_, index) => index !== rowIndex
      );
      onDataChange(updated as StringsRow[] | ClassificationsRow[]);
    },
    [data, onDataChange]
  );

  const handleAddRow = useCallback(() => {
    const emptyRow: RowData =
      type === "strings"
        ? ({
            Tier: "",
            Industry: "",
            Topic: "",
            Subtopic: "",
            Prefix: "",
            "Fuzzing-Idx": "",
            Prompt: "",
            Risks: "",
            Keywords: "",
          } as StringsRow)
        : ({
            Topic: "",
            SubTopic: "",
            Industry: "",
            Classification: "",
          } as ClassificationsRow);

    onDataChange([emptyRow, ...(data as RowData[])] as
      | StringsRow[]
      | ClassificationsRow[]);
  }, [data, onDataChange, type]);

  const columns = useMemo<ColumnDef<RowData, unknown>[]>(() => {
    if (type === "strings") {
      return [
        stringColumnHelper.accessor("Tier", {
          header: "Tier",
          cell: (props) => (
            <EditableCell
              {...props}
              validationErrors={validationErrors}
              readonly={readonly}
            />
          ),
        }),
        stringColumnHelper.accessor("Industry", {
          header: "Industry",
          cell: (props) => (
            <EditableCell
              {...props}
              validationErrors={validationErrors}
              readonly={readonly}
            />
          ),
        }),
        stringColumnHelper.accessor("Topic", {
          header: "Topic",
          cell: (props) => (
            <EditableCell
              {...props}
              validationErrors={validationErrors}
              readonly={readonly}
            />
          ),
        }),
        stringColumnHelper.accessor("Subtopic", {
          header: "Subtopic",
          cell: (props) => (
            <EditableCell
              {...props}
              validationErrors={validationErrors}
              readonly={readonly}
            />
          ),
        }),
        stringColumnHelper.accessor("Prefix", {
          header: "Prefix",
          cell: (props) => (
            <EditableCell
              {...props}
              validationErrors={validationErrors}
              readonly={readonly}
            />
          ),
        }),
        stringColumnHelper.accessor("Fuzzing-Idx", {
          header: "Fuzzing-Idx",
          cell: (props) => (
            <EditableCell
              {...props}
              validationErrors={validationErrors}
              readonly={readonly}
            />
          ),
        }),
        stringColumnHelper.accessor("Prompt", {
          header: "Prompt",
          cell: (props) => (
            <EditableCell
              {...props}
              validationErrors={validationErrors}
              readonly={readonly}
            />
          ),
        }),
        stringColumnHelper.accessor("Risks", {
          header: "Risks",
          cell: (props) => (
            <EditableCell
              {...props}
              validationErrors={validationErrors}
              readonly={readonly}
            />
          ),
        }),
        stringColumnHelper.accessor("Keywords", {
          header: "Keywords",
          cell: (props) => (
            <EditableCell
              {...props}
              validationErrors={validationErrors}
              readonly={readonly}
            />
          ),
        }),
        stringColumnHelper.display({
          id: "actions",
          header: "",
          cell: (ctx) => (
            <button
              type="button"
              onClick={() => handleDeleteRow(ctx.row.index)}
              className="inline-flex items-center rounded-md border border-rose-200 bg-white px-2 py-1 text-xs font-medium text-rose-700 hover:bg-rose-50"
            >
              Delete
            </button>
          ),
        }),
      ] as unknown as ColumnDef<RowData, unknown>[];
    } else {
      return [
        classificationColumnHelper.accessor("Topic", {
          header: "Topic",
          cell: (props) => (
            <EditableCell
              {...props}
              validationErrors={validationErrors}
              readonly={readonly}
            />
          ),
        }),
        classificationColumnHelper.accessor("SubTopic", {
          header: "SubTopic",
          cell: (props) => (
            <EditableCell
              {...props}
              validationErrors={validationErrors}
              readonly={readonly}
            />
          ),
        }),
        classificationColumnHelper.accessor("Industry", {
          header: "Industry",
          cell: (props) => (
            <EditableCell
              {...props}
              validationErrors={validationErrors}
              readonly={readonly}
            />
          ),
        }),
        classificationColumnHelper.accessor("Classification", {
          header: "Classification",
          cell: (props) => (
            <EditableCell
              {...props}
              validationErrors={validationErrors}
              readonly={readonly}
            />
          ),
        }),
        classificationColumnHelper.display({
          id: "actions",
          header: "",
          cell: (ctx) => (
            <button
              type="button"
              onClick={() => handleDeleteRow(ctx.row.index)}
              className="inline-flex items-center rounded-md border border-rose-200 bg-white px-2 py-1 text-xs font-medium text-rose-700 hover:bg-rose-50"
            >
              Delete
            </button>
          ),
        }),
      ] as unknown as ColumnDef<RowData, unknown>[];
    }
  }, [type, validationErrors, readonly, handleDeleteRow]);

  const table = useReactTable<RowData>({
    data: data as RowData[],
    columns,
    state: {
      sorting,
      globalFilter,
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    meta: {
      updateData: (rowIndex: number, columnId: string, value: string) => {
        const updatedData = data.map((row, index) =>
          index === rowIndex ? ({ ...row, [columnId]: value } as RowData) : row
        );
        onDataChange(updatedData as StringsRow[] | ClassificationsRow[]);
      },
    },
  });

  const invalidRowNumbers = validationErrors
    ? [...new Set(validationErrors.map((error) => error.row - 1))]
    : [];

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-slate-800">
          {type === "strings" ? "Strings Data" : "Classifications Data"}
        </h3>
        <div className="flex items-center gap-3">
          <input
            value={globalFilter ?? ""}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="block w-64 rounded-md border-slate-300 bg-white px-2 py-1 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            placeholder="Search all columns..."
          />
          <button
            type="button"
            onClick={handleAddRow}
            className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-500"
          >
            Add row
          </button>
          <span className="text-xs text-slate-500">
            {table.getFilteredRowModel().rows.length} rows
          </span>
        </div>
      </div>

      <div className="mt-3 overflow-hidden rounded-lg border border-slate-200">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <th
                      key={header.id}
                      className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wide text-slate-600"
                    >
                      {header.isPlaceholder ? null : (
                        <div
                          className={
                            header.column.getCanSort()
                              ? "cursor-pointer select-none hover:text-slate-800"
                              : ""
                          }
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                          {{
                            asc: " 🔼",
                            desc: " 🔽",
                          }[header.column.getIsSorted() as string] ?? null}
                        </div>
                      )}
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {table.getRowModel().rows.map((row) => {
              const hasError = invalidRowNumbers.includes(row.index);
              return (
                <tr
                  key={row.id}
                  className={`${hasError ? "bg-rose-50/50" : ""}`}
                >
                  {row.getVisibleCells().map((cell) => {
                    return (
                      <td
                        key={cell.id}
                        className="px-3 py-2 align-top text-sm text-slate-800"
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {validationErrors && validationErrors.length > 0 && (
        <div className="mt-3 rounded-lg border border-rose-200 bg-rose-50 p-3">
          <h4 className="text-sm font-semibold text-rose-900">
            Validation Errors ({validationErrors.length})
          </h4>
          <div className="mt-2 space-y-1 text-xs text-rose-800">
            {validationErrors.slice(0, 10).map((error, index) => (
              <div key={index}>
                Row {error.row}, {error.field}: {error.message}
              </div>
            ))}
            {validationErrors.length > 10 && (
              <div>... and {validationErrors.length - 10} more errors</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default EditableTable;
