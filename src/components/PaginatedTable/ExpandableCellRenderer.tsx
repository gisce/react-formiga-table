import React, { memo } from "react";
import type { ExpandableRowIcon, TableColumn, ExpandOptions } from "@/types";

export interface ExpandableCellRendererProps {
  columnDef: TableColumn;
  expandableOpts: ExpandOptions;
  getExpandableStatusForRow: (record: any) => ExpandableRowIcon;
  getLevelForKey: (key: number) => number;
  onExpandableIconClicked: (record: any) => void;
  data: any;
  value: any;
}

const ExpandableCellRendererComponent: React.FC<ExpandableCellRendererProps> = (
  props,
) => {
  const {
    data,
    value,
    columnDef,
    expandableOpts,
    getExpandableStatusForRow,
    getLevelForKey,
    onExpandableIconClicked,
  } = props;

  if (!data) return null;

  const status = getExpandableStatusForRow(data);
  const level = getLevelForKey(data.id);

  let IconComponent: any = null;
  if (status === "expand") {
    IconComponent = expandableOpts.expandIcon;
  } else if (status === "collapse") {
    IconComponent = expandableOpts.collapseIcon;
  } else if (status === "loading") {
    IconComponent = expandableOpts.loadingIcon;
  }

  const originalContent = columnDef.render
    ? columnDef.render(value, data)
    : value;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        height: "100%",
        paddingLeft: `${level * 25}px`,
      }}
    >
      {status !== "none" && IconComponent ? (
        <IconComponent
          style={{ marginRight: 8, cursor: "pointer", flexShrink: 0 }}
          onClick={(e: React.MouseEvent) => {
            e.stopPropagation();
            onExpandableIconClicked(data);
          }}
        />
      ) : (
        (data?.[expandableOpts.childField || "child_id"]?.length > 0 ||
          expandableOpts?.onFetchChildrenForRecord !== undefined) && (
          <span
            style={{
              display: "inline-block",
              width: "1em",
              marginRight: 8,
              flexShrink: 0,
            }}
          ></span>
        )
      )}
      <span
        style={{
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {originalContent}
      </span>
    </div>
  );
};

export const ExpandableCellRenderer = memo(ExpandableCellRendererComponent);
