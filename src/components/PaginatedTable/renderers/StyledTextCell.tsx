import React from "react";

type StyledTextCellProps = {
  value: any;
  data: any; // Row data to get ID for level calculation
  columnRender?: (value: any, data: any) => React.ReactNode;
  getLevelForKey?: (key: any) => number | undefined;
  hasExpandableColumn: boolean;
};

export const StyledTextCell: React.FC<StyledTextCellProps> = ({
  value,
  data,
  columnRender,
  getLevelForKey,
  hasExpandableColumn,
}) => {
  const style: React.CSSProperties = {};
  if (hasExpandableColumn && getLevelForKey && data?.id) {
    const level = getLevelForKey(data.id) || 0;
    style.paddingLeft = `${(level + 1) * 20}px`;
  }

  return (
    <div style={style}>{columnRender ? columnRender(value, data) : value}</div>
  );
};
