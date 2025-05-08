import React, { memo } from "react";

type StatusCellRendererProps = {
  value: any;
  StatusComponent?: React.ElementType; // The memoized component
};

const StatusCellRendererComponent: React.FC<StatusCellRendererProps> = ({
  value,
  StatusComponent,
}) => {
  if (!StatusComponent) return null;

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "flex-end",
        alignItems: "center",
        height: "100%",
      }}
    >
      <StatusComponent status={value} />
    </div>
  );
};

export const StatusCellRenderer = memo(StatusCellRendererComponent);
