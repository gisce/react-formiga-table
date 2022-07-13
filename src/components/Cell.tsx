import { Sorter } from "../types";
import styled from "styled-components";

export const Separator = styled.div`
  width: ${({ level }: { level: number }) => `${level * 20}px`};
`;

export const Container = styled.div`
  display: flex;
`;

export const Cell = ({
  column,
  row,
  columnIdx,
  level,
  getColumnSorter,
  expandable,
}: {
  column: any;
  row: any;
  columnIdx: number;
  level: number;
  getColumnSorter: (columnId: string) => Sorter | undefined;
  expandable: boolean;
}) => {
  const tdStyle =
    getColumnSorter(column.key) !== undefined
      ? {
          backgroundColor: "#fafafa",
        }
      : {};

  return (
    <td key={`${column.key}-${row.id}`} style={tdStyle}>
      <Container>
        {expandable && <Separator level={level} />}
        {column.render ? column.render(row[column.key]) : row[column.key]}
      </Container>
    </td>
  );
};
