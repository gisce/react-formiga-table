import React from "react";
import styled from "styled-components";
import { useTable } from "react-table";

export type TableColumn = {
  key: string;
  dataIndex?: string;
  title: string;
  render?: (item: any) => React.ReactNode;
  sorter?: (a: any, b: any) => number;
};

export type RowSettings = {
  style: any;
  onDoubleClick: () => void;
};

type ContainerProps = {
  height?: number;
};

export type TableProps = {
  dataSource: any[];
  columns: TableColumn[];
  rowKey: (item: any) => string;
  onRow: (item: any) => RowSettings;
  rowSelection: {
    selectedRowKeys: string[] | number[];
  };
  onChange: (a: any, b: any, sorter: any, d: any) => void;

  // Display settings
  loading: boolean;
  loadingComponent: any;
  height?: number;
};

const Container = styled.div`
  overflow-x: auto;
  height: ${(props: ContainerProps) => `${props.height}px` || "auto"};
  border-bottom: 1px solid #f0f0f0;

  table {
    white-space: nowrap;
    border-spacing: 0;
    width: 100%;

    tr {
      cursor: pointer;
      user-select: none;

      &:hover {
        background-color: #fafafa;
      }

      td  {
        border-bottom: 1px solid #f0f0f0;
      }

      :last-child td {
        border-bottom: 0;
      }
    }

    th {
      position: sticky;
      top: 0;
      background-color: #fafafa;
      border-bottom: 1px solid #f0f0f0;
    }

    th,
    td {
      margin: 0;
      padding: 0.5rem;

      :last-child {
        border-right: 0;
      }
    }
  }
`;

function TableComp({
  columns,
  data,
  onRow,
}: {
  columns: any;
  data: any;
  onRow: (item: any) => RowSettings;
}) {
  // Use the state and functions returned from useTable to build your UI
  const { getTableProps, getTableBodyProps, headerGroups, rows, prepareRow } =
    useTable({
      columns,
      data,
    });

  // Render the UI for your table
  return (
    <table {...getTableProps()}>
      <thead>
        {headerGroups.map((headerGroup) => (
          <tr {...headerGroup.getHeaderGroupProps()}>
            {headerGroup.headers.map((column) => (
              <th {...column.getHeaderProps()}>{column.render("Header")}</th>
            ))}
          </tr>
        ))}
      </thead>
      <tbody {...getTableBodyProps()}>
        {rows.map((row, i) => {
          prepareRow(row);
          const { style, onDoubleClick } = onRow(row.original);

          return (
            <tr
              style={style}
              {...row.getRowProps()}
              onDoubleClick={onDoubleClick}
            >
              {row.cells.map((cell) => {
                return <td {...cell.getCellProps()}>{cell.render("Cell")}</td>;
              })}
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

export const Table = (props: TableProps) => {
  const { dataSource, columns, height, onRow, loading, loadingComponent } =
    props;

  if (loading) {
    return loadingComponent;
  }

  const columnsForTable = React.useMemo(
    () =>
      columns.map((it) => ({
        Header: it.title,
        accessor: it.key,
        Cell: ({ value }: { value: any }) => {
          if (it.render) {
            return it.render(value);
          }
          return value || null;
        },
      })),
    [columns]
  );

  const data = React.useMemo(() => dataSource, [dataSource]);

  return (
    <Container height={height}>
      <TableComp columns={columnsForTable} data={data} onRow={onRow} />
    </Container>
  );
};
