import styled from "styled-components";
import {
  ExpandableRowIcon,
  ExpandOptions,
  OnCellRenderOpts,
  Sorter,
  TableColumn,
} from "../types";
import { Cell } from "./Cell";
import { Checkbox } from "./Checkbox";
import {useMediaQuery} from "react-responsive";

export const Rows = ({
  onRowSelectionChange,
  dataSource,
  columns,
  getColumnSorter,
  onRowStyle,
  onRowStatus,
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
  readonly,
}: {
  onRowSelectionChange?: (selectedRowItems: any[]) => void;
  dataSource: any[];
  columns: TableColumn[];
  getColumnSorter: (columnId: string) => Sorter | undefined;
  onRowStyle: (item: any) => any;
  onRowStatus?: (item: any) => any;
  onRowDoubleClick?: (item: any) => void;
  isRowSelected: (row: any) => boolean;
  toggleRowSelected: (row: any, event: any) => void;
  expandableOpts?: ExpandOptions;
  onExpandableIconClicked: (item: any) => void;
  getExpandableStatusForRow: (item: any) => ExpandableRowIcon;
  keyIsOpened: (key: number) => boolean;
  getChildsForParent: (key: number) => any[] | undefined;
  getLevelForKey: (key: number) => number;
  onCellRender?: (opts: OnCellRenderOpts) => React.ReactNode;
  readonly?: boolean;
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
            onRowStatus,
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
            readonly,
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
  onRowStatus,
  level = 0,
  onCellRender,
  readonly,
}: {
  row: any;
  columns: TableColumn[];
  onRowDoubleClick?: (item: any) => void;
  onRowSelectionChange?: (selectedRowItems: any[]) => void;
  isRowSelected: (row: any) => boolean;
  getColumnSorter: (columnId: string) => Sorter | undefined;
  toggleRowSelected: (row: any, event: any) => void;
  expandableOpts?: ExpandOptions;
  onExpandableIconClicked: (item: any) => void;
  getExpandableStatusForRow: (item: any) => ExpandableRowIcon;
  keyIsOpened: (key: number) => boolean;
  getChildsForParent: (key: number) => any[] | undefined;
  onRowStyle: (item: any) => any;
  onRowStatus?: (item: any) => any;
  level?: number;
  onCellRender?: (opts: OnCellRenderOpts) => React.ReactNode;
  readonly?: boolean;
}): React.ReactNode {
  const style = onRowStyle(row);
  const rowIsSelected = isRowSelected(row);
  const isMobile = useMediaQuery({query: '(max-width: 991px)'});
  const mobileStyle = isMobile ? {display: 'block', width: 'auto !important'} : {};
  let components: React.ReactNode[] = [
    <tr
      key={`tr-${row.id}`}
      style={style}
      onDoubleClick={() => {
        onRowDoubleClick?.(row);
      }}
    >
      {onRowSelectionChange && !readonly && (
        <td
          key={`react_formiga_table_selection-${row.id}`}
          style={{...{
            left: 0,
            position: "sticky",
            backgroundColor: rowIsSelected ? "#E6F7FF" : "#f2f2f2",
          }, ...(isMobile ? {width: '10px'} : {})}}
        >
          <div
            style={{...{
              width: 50,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }, ...(isMobile ? {width: '5px'} : {})}}
          >
            {!readonly &&
          <Checkbox
            value={rowIsSelected}
            onChange={(event) => {
              toggleRowSelected(row.id, event);
            }}
          />
            }
          </div>
        </td>
      )}
      {onRowStatus &&
        <>
        <Cell
          row={row}
          key={`status-${row.id}`}
          getColumnSorter={() => undefined}
          column="row-status"
          columnIdx={-1}
          onCellRender={() => onRowStatus(row)}
          expandableOpts={expandableOpts}
          getExpandableStatusForRow={getExpandableStatusForRow}
          onExpandableIconClicked={onExpandableIconClicked}
          level={level}
          rowIsSelected={rowIsSelected}
        />
        </>
      }
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
            rowIsSelected={rowIsSelected}
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
