import { memo } from "react";
import {
  ExpandableRowIcon,
  ExpandOptions,
  OnCellRenderOpts,
  Sorter,
  RFTLabelStyle,
} from "../types";

export const Cell = ({
  column,
  row,
  columnIdx,
  level,
  getColumnSorter,
  expandableOpts,
  getExpandableStatusForRow,
  onExpandableIconClicked,
  onCellRender,
  rowIsSelected,
  cellStyle,
}: {
  column: any;
  row: any;
  columnIdx: number;
  level: number;
  getColumnSorter: (columnId: string) => Sorter | undefined;
  expandableOpts?: ExpandOptions;
  getExpandableStatusForRow: (item: any) => ExpandableRowIcon;
  onExpandableIconClicked: (item: any) => void;
  onCellRender?: (opts: OnCellRenderOpts) => React.ReactNode;
  rowIsSelected?: boolean;
  cellStyle?: RFTLabelStyle;
}) => {
  const tdStyle =
    getColumnSorter(column.key) !== undefined
      ? {
          backgroundColor: rowIsSelected ? "#E6F7FF" : "#fafafa",
        }
      : rowIsSelected
      ? {
          backgroundColor: rowIsSelected ? "#E6F7FF" : undefined,
        }
      : {};

  let renderedContent;

  if (onCellRender) {
    renderedContent = onCellRender({
      column,
      columnIdx,
      rowKey: row.id,
      value: row[column.key],
    });
  } else if (column.render) {
    renderedContent = memo(column.render(row[column.key]));
  } else {
    renderedContent = row[column.key];
  }

  return (
    <td style={tdStyle}>
      <ExpandableComponent
        row={row}
        columnIdx={columnIdx}
        expandableOpts={expandableOpts}
        getExpandableStatusForRow={getExpandableStatusForRow}
        onExpandableIconClicked={onExpandableIconClicked}
        level={level}
      />
      <div style={{ display: "inline-block", width: "100%", ...cellStyle }}>
        <div
          className="rft-label"
          style={{ display: "none", ...cellStyle?.rftLabel }}
        >
          {column.title}
        </div>
        {renderedContent}
      </div>
    </td>
  );
};

function ExpandableComponent({
  row,
  columnIdx,
  expandableOpts,
  getExpandableStatusForRow,
  onExpandableIconClicked,
  level,
}: {
  row: any;
  columnIdx: number;
  expandableOpts?: ExpandOptions;
  getExpandableStatusForRow: (item: any) => ExpandableRowIcon;
  onExpandableIconClicked: (item: any) => void;
  level: number;
}) {
  if (!expandableOpts) {
    return null;
  }

  const status = getExpandableStatusForRow(row);

  if (status === "none" || columnIdx !== 0) {
    return <div style={{ display: "inline-block", width: 19 + level * 25 }} />;
  }

  let Icon;
  if (status === "expand") {
    Icon = expandableOpts.expandIcon;
  } else if (status === "collapse") {
    Icon = expandableOpts.collapseIcon;
  } else if (status === "loading") {
    Icon = expandableOpts.loadingIcon;
  }

  return (
    <div style={{ display: "inline-block" }}>
      <Icon
        style={{ marginRight: 5, marginLeft: level * 25 }}
        onClick={() => {
          onExpandableIconClicked(row);
        }}
      />
    </div>
  );
}
