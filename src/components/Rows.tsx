import {
  ExpandableRowIcon,
  ExpandOptions,
  OnCellRenderOpts,
  Sorter,
  TableColumn,
} from "../types";
import { Cell } from "./Cell";
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
  getLevelForKey,
  onCellRender,
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
  getLevelForKey: (key: number) => number;
  onCellRender?: (opts: OnCellRenderOpts) => React.ReactNode;
}) => {
  return (
    <>
      {dataSource
        .filter((entry) => {
          return getLevelForKey(entry.id) === 0;
        })
        .map((row: any) => {
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
  onCellRender,
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
  onCellRender?: (opts: OnCellRenderOpts) => React.ReactNode;
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
      {columns.map((column: any, columnIdx: number) => {
        return (
          <Cell
            key={`${column.key}-${row.id}`}
            column={column}
            columnIdx={columnIdx}
            row={row}
            getColumnSorter={getColumnSorter}
            expandableOpts={expandableOpts}
            getExpandableStatusForRow={getExpandableStatusForRow}
            onExpandableIconClicked={onExpandableIconClicked}
            level={level}
          />
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
          onCellRender,
        });
      })
    );
  }

  return components;
}
