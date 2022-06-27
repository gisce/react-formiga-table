import React, { useEffect } from "react";
import styled from "styled-components";
import { useTable, useRowSelect } from "react-table";
import useDeepCompareEffect from "use-deep-compare-effect";

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
  onRow: (item: any) => RowSettings;
  onRowSelectionChange?: (selectedRowKeys: number[]) => void;
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
  onRowSelectionChange,
}: {
  columns: any;
  data: any;
  onRow: (item: any) => RowSettings;
  onRowSelectionChange?: (selectedRowKeys: number[]) => void;
}) {
  // Use the state and functions returned from useTable to build your UI
  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    rows,
    prepareRow,
    state: { selectedRowIds },
    selectedFlatRows,
  } = onRowSelectionChange
    ? (useTable(
        {
          columns,
          data,
        },
        useRowSelect,
        (hooks) => {
          hooks.visibleColumns.push((columns) => [
            // Let's make a column for selection
            {
              id: "selection",
              // The header can use the table's getToggleAllRowsSelectedProps method
              // to render a checkbox
              Header: (headerProps) => {
                const { getToggleAllRowsSelectedProps } = headerProps as any;
                return (
                  <div
                    style={{
                      width: 50,
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    <IndeterminateCheckbox
                      {...getToggleAllRowsSelectedProps()}
                    />
                  </div>
                );
              },
              // The cell can use the individual row's getToggleRowSelectedProps method
              // to the render a checkbox
              Cell: ({ row }) => (
                <div
                  style={{
                    width: 50,
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <IndeterminateCheckbox
                    {...(row as any).getToggleRowSelectedProps()}
                  />
                </div>
              ),
            },
            ...columns,
          ]);
        }
      ) as any)
    : useTable({ columns, data });

  useDeepCompareEffect(() => {
    onRowSelectionChange?.(selectedFlatRows.map((d: any) => d.original));
  }, [selectedRowIds]);

  // Render the UI for your table
  return (
    <>
      <table {...getTableProps()}>
        <thead>
          {headerGroups.map((headerGroup: any) => (
            <tr {...headerGroup.getHeaderGroupProps()}>
              {headerGroup.headers.map((column: any) => (
                <th {...column.getHeaderProps()}>{column.render("Header")}</th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody {...getTableBodyProps()}>
          {rows.map((row: any, i: number) => {
            prepareRow(row);
            const { style, onDoubleClick } = onRow(row.original);

            return (
              <tr
                style={style}
                {...row.getRowProps()}
                onDoubleClick={onDoubleClick}
              >
                {row.cells.map((cell: any) => {
                  return (
                    <td {...cell.getCellProps()}>{cell.render("Cell")}</td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </>
  );
}

const IndeterminateCheckbox = React.forwardRef((props, ref) => {
  const { indeterminate, ...rest } = props as any;

  const defaultRef = React.useRef();
  const resolvedRef = ref || defaultRef;

  useEffect(() => {
    (resolvedRef as any).current.indeterminate = indeterminate;
  }, [resolvedRef, indeterminate]);

  return <input type="checkbox" ref={resolvedRef as any} {...rest} />;
});

export const Table = (props: TableProps) => {
  const {
    dataSource,
    columns,
    height,
    onRow,
    loading,
    loadingComponent,
    onRowSelectionChange,
  } = props;

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
      <TableComp
        columns={columnsForTable}
        data={data}
        onRow={onRow}
        onRowSelectionChange={onRowSelectionChange}
      />
    </Container>
  );
};
