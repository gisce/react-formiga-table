import {
  ExpandableRowIcon,
  ExpandOptions,
  Sorter,
  TableColumn,
} from "../types";
import { Checkbox } from "./Checkbox";

export const Rows = ({
  onRowSelectionChange,
  dataSource,
  columns,
  getColumnSorter,
  onRowStyle,
  onRowDoubleClick,
  isRowSelected,
  toggleRowSelected,
  expandableOpts,
  onExpandableIconClicked,
  getExpandableStatusForRow,
  keyIsOpened,
  getChildsForParent,
}: {
  onRowSelectionChange?: (selectedRowItems: any[]) => void;
  dataSource: any[];
  columns: TableColumn[];
  getColumnSorter: (columnId: string) => Sorter | undefined;
  onRowStyle: (item: any) => any;
  onRowDoubleClick?: (item: any) => void;
  isRowSelected: (row: any) => boolean;
  toggleRowSelected: (row: any) => void;
  expandableOpts?: ExpandOptions;
  onExpandableIconClicked: (item: any) => void;
  getExpandableStatusForRow: (item: any) => ExpandableRowIcon;
  keyIsOpened: (key: number) => boolean;
  getChildsForParent: (key: number) => any[] | undefined;
}) => {
  return (
    <>
      {dataSource.map((row: any) => {
        return getRowComponent({
          row,
          columns,
          onRowStyle,
          onRowDoubleClick,
          onRowSelectionChange,
          isRowSelected,
          toggleRowSelected,
          expandableOpts,
          getExpandableStatusForRow,
          onExpandableIconClicked,
          getColumnSorter,
          keyIsOpened,
          getChildsForParent,
        });
      })}
    </>
  );
};

function getRowComponent({
  row,
  columns,
  onRowDoubleClick,
  onRowSelectionChange,
  isRowSelected,
  toggleRowSelected,
  expandableOpts,
  getExpandableStatusForRow,
  onExpandableIconClicked,
  getColumnSorter,
  keyIsOpened,
  getChildsForParent,
  onRowStyle,
  level = 0,
}: {
  row: any;
  columns: TableColumn[];
  onRowDoubleClick?: (item: any) => void;
  onRowSelectionChange?: (selectedRowItems: any[]) => void;
  isRowSelected: (row: any) => boolean;
  getColumnSorter: (columnId: string) => Sorter | undefined;
  toggleRowSelected: (row: any) => void;
  expandableOpts?: ExpandOptions;
  onExpandableIconClicked: (item: any) => void;
  getExpandableStatusForRow: (item: any) => ExpandableRowIcon;
  keyIsOpened: (key: number) => boolean;
  getChildsForParent: (key: number) => any[] | undefined;
  onRowStyle: (item: any) => any;
  level?: number;
}): React.ReactNode {
  const style = onRowStyle(row);
  let components: React.ReactNode[] = [
    <tr
      key={`tr-${row.id}`}
      style={style}
      onDoubleClick={() => {
        onRowDoubleClick?.(row);
      }}
    >
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
          const status = getExpandableStatusForRow(row);

          let ExpandableComponent;

          if (status === "expand") {
            ExpandableComponent = expandableOpts.expandIcon;
          } else if (status === "collapse") {
            ExpandableComponent = expandableOpts.collapseIcon;
          } else {
            ExpandableComponent = expandableOpts.loadingIcon;
          }

          return (
            <td key={`react_formiga_table_expandable-${row.id}`}>
              {status === "none" ? null : (
                <ExpandableComponent
                  onClick={() => {
                    onExpandableIconClicked(row);
                  }}
                />
              )}
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
            <div
              style={{
                display: "flex",
              }}
            >
              {level > 0 ? (
                <div
                  style={{
                    width: level * 20,
                    // height: 10,
                    // backgroundColor: "red",
                  }}
                />
              ) : null}
              {column.render ? column.render(row[column.key]) : row[column.key]}
            </div>
          </td>
        );
      })}
    </tr>,
  ];

  if (expandableOpts !== undefined && keyIsOpened(row.id)) {
    components = components.concat(
      getChildsForParent(row.id)?.map((item: any) => {
        return getRowComponent({
          row: item.data,
          columns,
          onRowStyle,
          onRowDoubleClick,
          onRowSelectionChange,
          isRowSelected,
          toggleRowSelected,
          expandableOpts,
          getExpandableStatusForRow,
          onExpandableIconClicked,
          getColumnSorter,
          keyIsOpened,
          getChildsForParent,
          level: item.level,
        });
      })
    );
  }

  return components;
}
