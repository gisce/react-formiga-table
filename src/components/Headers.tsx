import { Sorter, TableColumn } from "../types";
import { Checkbox } from "./Checkbox";

export const Headers = ({
  onRowSelectionChange,
  dataSource,
  columns,
  toggleAllRowsSelected,
  selectedRowKeys,
  handleColumnClick,
  getColumnSorter,
}: {
  onRowSelectionChange?: (selectedRowItems: any[]) => void;
  dataSource: any[];
  toggleAllRowsSelected: () => void;
  selectedRowKeys: number[];
  columns: TableColumn[];
  handleColumnClick: (columnId: string) => void;
  getColumnSorter: (columnId: string) => Sorter | undefined;
}) => {
  return (
    <>
      {onRowSelectionChange && (
        <th key={"react_formiga_table_selection"}>
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
                selectedRowKeys.length === dataSource.length
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
            <p>{column.title}</p>
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
