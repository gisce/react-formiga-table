import { ExpandableRowIcon, ExpandOptions, Sorter } from "../types";

export const Cell = ({
  column,
  row,
  columnIdx,
  level,
  getColumnSorter,
  expandableOpts,
  getExpandableStatusForRow,
  onExpandableIconClicked,
}: {
  column: any;
  row: any;
  columnIdx: number;
  level: number;
  getColumnSorter: (columnId: string) => Sorter | undefined;
  expandableOpts?: ExpandOptions;
  getExpandableStatusForRow: (item: any) => ExpandableRowIcon;
  onExpandableIconClicked: (item: any) => void;
}) => {
  const tdStyle =
    getColumnSorter(column.key) !== undefined
      ? {
          backgroundColor: "#fafafa",
        }
      : {};

  return (
    <td key={`${column.key}-${row.id}`} style={tdStyle}>
      <ExpandableComponent
        row={row}
        columnIdx={columnIdx}
        expandableOpts={expandableOpts}
        getExpandableStatusForRow={getExpandableStatusForRow}
        onExpandableIconClicked={onExpandableIconClicked}
        level={level}
      />
      <div style={{ display: "inline-block" }}>
        {column.render ? column.render(row[column.key]) : row[column.key]}
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
