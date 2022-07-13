import exp from "constants";
import { Sorter, TableColumn } from "../types";
import { Checkbox } from "./Checkbox";

export const Headers = ({
  onRowSelectionChange,
  totalRows,
  columns,
  toggleAllRowsSelected,
  selectedRowKeys,
  handleColumnClick,
  getColumnSorter,
}: {
  onRowSelectionChange?: (selectedRowItems: any[]) => void;
  totalRows: number;
  toggleAllRowsSelected: () => void;
  selectedRowKeys: number[];
  columns: TableColumn[];
  handleColumnClick: (columnId: string) => void;
  getColumnSorter: (columnId: string) => Sorter | undefined;
}) => {
  return (
    <>
      {onRowSelectionChange && (
        <th style={{ width: 10 }} key={"react_formiga_table_selection"}>
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
                selectedRowKeys.length === totalRows
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
      {columns.map((column: any) => (
        <th
          key={column.key}
          onClick={() => {
            handleColumnClick(column.key);
          }}
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
