import { Sorter, TableColumn, RFTLabelStyle } from "../types";
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
  headerStyle,
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
  headerStyle?: RFTLabelStyle;
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
            ...headerStyle,
            cursor: "auto",
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
      {status && <th key="th-status" style={{ ...headerStyle }}></th>}
      {columns.map((column: any) => (
        <th
          style={{ ...headerStyle }}
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
            <div
              style={{
                flex: 1,
                display: "flex",
                justifyContent: "space-between",
                ...headerStyle?.rftLabel,
              }}
            >
              {column.title}
            </div>
            <div style={{ display: "flex", alignItems: "center" }}>
              <span
                key={column.key}
                className="arrow"
                style={{
                  visibility:
                    getColumnSorter(column.key) !== undefined
                      ? undefined
                      : "hidden",
                  marginLeft: "auto",
                }}
              >
                {getColumnSorter(column.key) !== undefined &&
                getColumnSorter(column.key)!.desc
                  ? " ▼"
                  : " ▲"}
              </span>
            </div>
          </div>
        </th>
      ))}
    </>
  );
};
