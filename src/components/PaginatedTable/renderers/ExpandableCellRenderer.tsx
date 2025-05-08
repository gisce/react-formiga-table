import React from "react";

type ExpandableCellRendererProps = {
  data: any;
  expandableOpts: {
    expandIcon: React.ElementType;
    collapseIcon: React.ElementType;
    loadingIcon: React.ElementType;
  };
  getExpandableStatusForRow: (
    data: any,
  ) => "expand" | "collapse" | "loading" | "none";
  onExpandableIconClicked: (data: any) => void;
};

export const ExpandableCellRenderer: React.FC<ExpandableCellRendererProps> = ({
  data,
  expandableOpts,
  getExpandableStatusForRow,
  onExpandableIconClicked,
}) => {
  if (!data) return null;

  const status = getExpandableStatusForRow(data);
  let IconComponent: React.ElementType | null = null;

  if (status === "expand") {
    IconComponent = expandableOpts.expandIcon;
  } else if (status === "collapse") {
    IconComponent = expandableOpts.collapseIcon;
  } else if (status === "loading") {
    IconComponent = expandableOpts.loadingIcon;
  }

  if (!IconComponent) return null;

  return (
    <div
      style={{
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        height: "100%",
      }}
    >
      <IconComponent
        style={{ color: "#000" }}
        onClick={(e: React.MouseEvent) => {
          e.stopPropagation();
          onExpandableIconClicked(data);
        }}
      />
    </div>
  );
};
