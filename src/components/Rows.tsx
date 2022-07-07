import exp from "constants";
import { ExpandOptions, RowSettings, Sorter, TableColumn } from "../types";
import { Checkbox } from "./Checkbox";

export const Rows = ({
  onRowSelectionChange,
  dataSource,
  columns,
  getColumnSorter,
  onRow,
  isRowSelected,
  toggleRowSelected,
  expandableOpts,
}: {
  onRowSelectionChange?: (selectedRowItems: any[]) => void;
  dataSource: any[];
  columns: TableColumn[];
  getColumnSorter: (columnId: string) => Sorter | undefined;
  onRow: (item: any) => RowSettings;
  isRowSelected: (row: any) => boolean;
  toggleRowSelected: (row: any) => void;
  expandableOpts?: ExpandOptions;
}) => {
  return (
    <>
      {dataSource.map((row: any) => {
        const { style, onDoubleClick } = onRow(row);

        return (
          <tr key={`tr-${row.id}`} style={style} onDoubleClick={onDoubleClick}>
            {onRowSelectionChange && (
              <td key={`react_formiga_table_selection-${row.id}`}>
                <div
                  style={{
                    width: 50,
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  {isRowSelected(row) ? (
                    <Checkbox
                      value={true}
                      onChange={() => {
                        toggleRowSelected(row);
                      }}
                    />
                  ) : (
                    <Checkbox
                      value={false}
                      onChange={() => {
                        toggleRowSelected(row);
                      }}
                    />
                  )}
                </div>
              </td>
            )}
            {expandableOpts !== undefined &&
              (() => {
                const ExpandableComponent = expandableOpts.expandIcon;
                return (
                  <td key={`react_formiga_table_expandable-${row.id}`}>
                    <ExpandableComponent />
                  </td>
                );
              })()}
            {columns.map((column: any, columnIdx: number) => {
              return (
                <td
                  key={`${column.key}-${row.id}`}
                  style={
                    getColumnSorter(column.key) !== undefined
                      ? {
                          backgroundColor: "#fafafa",
                        }
                      : {}
                  }
                >
                  {column.render
                    ? column.render(row[column.key])
                    : row[column.key]}
                </td>
              );
            })}
          </tr>
        );
      })}
    </>
  );
};
