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
  minHeight: number;
  scroll?:
    | {
        x?: string | number | true | undefined;
        y?: string | number | undefined;
      }
    | undefined;

  // Unused props - only to mantain interface structure with previous component
  size: any;
  pagination: any;
  rowClassName: any;
};

const Styles = styled.div`
  padding: 1rem;

  table {
    border-spacing: 0;
    border: 1px solid black;

    tr {
      :last-child {
        td {
          border-bottom: 0;
        }
      }
    }

    th,
    td {
      margin: 0;
      padding: 0.5rem;
      border-bottom: 1px solid black;
      border-right: 1px solid black;

      :last-child {
        border-right: 0;
      }
    }
  }
`;

function TableComp({ columns, data }: { columns: any; data: any }) {
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
          return (
            <tr {...row.getRowProps()}>
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
  const { dataSource, columns } = props;

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
    <Styles>
      <TableComp columns={columnsForTable} data={data} />
    </Styles>
  );
};
