import { Sorter, TableColumn } from "../types";
import { Checkbox } from "./Checkbox";

export const Headers = ({
  onRowSelectionChange,
  allRowsAreSelected,
  columns,
  toggleAllRowsSelected,
  selectedRowKeys,
  handleColumnClick,
  getColumnSorter,
  sortEnabled,
  readonly,
  status = false,
}: {
  onRowSelectionChange?: (selectedRowItems: any[]) => void;
  allRowsAreSelected: boolean;
  toggleAllRowsSelected: () => void;
  selectedRowKeys: number[];
  columns: TableColumn[];
  handleColumnClick: (columnId: string) => void;
  getColumnSorter: (columnId: string) => Sorter | undefined;
  sortEnabled: boolean;
  readonly?: boolean;
  status?: boolean;
}) => {
  return (
    <>
      {onRowSelectionChange && !readonly && (
        <th
          style={{
            width: 10,
            left: 0,
            position: "sticky",
            backgroundColor: "#f2f2f2",
          }}
          key={"react_formiga_table_selection"}
        >
          <div
            style={{
              width: 50,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Checkbox
              value={
                allRowsAreSelected
                  ? true
                  : selectedRowKeys.length === 0
                  ? false
                  : null
              }
              onChange={toggleAllRowsSelected}
            />
          </div>
        </th>
      )}
      {status &&
        <th key="th-status">
        </th>
      }
      {columns.map((column: any) => (
        <th
          key={column.key}
          onClick={
            sortEnabled
              ? () => {
                  handleColumnClick(column.key);
                }
              : undefined
          }
        >
          <div className="ctx">
            {column.title}
            <span
              key={column.key}
              className="arrow"
              style={{
                visibility:
                  getColumnSorter(column.key) !== undefined
                    ? undefined
                    : "hidden",
              }}
            >
              {getColumnSorter(column.key) !== undefined &&
              getColumnSorter(column.key)!.desc
                ? " ▼"
                : " ▲"}
            </span>
          </div>
        </th>
      ))}
    </>
  );
};
