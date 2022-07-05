import React, { useCallback, useEffect, useState } from "react";
import styled from "styled-components";
import { useTable, useRowSelect } from "react-table";
import useDeepCompareEffect from "use-deep-compare-effect";
import { useExpandable } from "./hooks/useExpandable";

export type TableColumn = {
  key: string;
  dataIndex?: string;
  title: string;
  render?: (item: any) => React.ReactNode;
  sorter?: (a: any, b: any, column: string, desc: boolean) => number;
};

export type RowSettings = {
  style: any;
  onDoubleClick: () => void;
};

type ContainerProps = {
  height?: number;
};

export type Sorter = {
  id: string;
  desc: boolean;
};

export type ExpandOptions = {
  expandable?: boolean;
  onRowExpand?: (item: any) => Promise<void>;
  expandIcon?: any;
  collapseIcon?: any;
};

export type TableBaseProps = {
  onRow: (item: any) => RowSettings;
  onRowSelectionChange?: (selectedRowKeys: number[]) => void;
  onChangeSort?: (sorter: Sorter | undefined) => void;
  sorter: Sorter | undefined;
  expandOptions?: ExpandOptions;
};

export type TableCompProps = TableBaseProps & {
  columns: any;
  data: any;
};

export type TableProps = TableBaseProps & {
  dataSource: any[];
  columns: TableColumn[];

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

      &:nth-child(odd) {
        background: #fff;
      }

      &:nth-child(even) {
        background: #fafafa;
      }

      &:hover {
        background-color: #f2f2f2;
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
      z-index: 5;
    }

    th:hover {
      background-color: #f2f2f2;
    }

    th .arrow {
      padding-left: 10px;
      font-size: 0.65em;
      color: #bdbdbd;
    }

    th .ctx {
      display: flex;
      justify-content: space-between;
      align-items: center;
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

function TableComp(props: TableCompProps) {
  const {
    columns,
    data,
    onRow,
    onRowSelectionChange,
    onChangeSort,
    sorter,
    expandOptions = {},
  } = props;

  const {
    expandable = false,
    expandIcon = <span>+</span>,
    collapseIcon = <span>-</span>,
  } = expandOptions;

  const [localSorter, setLocalSorter] = useState(sorter);

  const getColumnSorter = useCallback(
    (columnId: string) => {
      if (!localSorter) {
        return undefined;
      }

      if (columnId === localSorter.id) {
        return localSorter;
      }

      return undefined;
    },
    [localSorter]
  );

  const handleColumnClick = useCallback(
    (columnId: string) => {
      if (columnId.indexOf("react_formiga_table") !== -1) {
        return;
      }

      if (!localSorter) {
        setLocalSorter({
          id: columnId,
          desc: false,
        });
        return;
      }

      if (localSorter!.id !== columnId) {
        setLocalSorter({
          id: columnId,
          desc: false,
        });
        return;
      }

      if (localSorter!.desc === false) {
        setLocalSorter({
          id: columnId,
          desc: true,
        });
        return;
      }

      if (localSorter!.desc === true) {
        setLocalSorter(undefined);
      }
    },
    [localSorter]
  );

  const {
    openedKeys,
    setOpenedKeys,
    toggleOpenedKey,
    keyIsOpened,
    updateItem,
    items,
    setItems,
  } = useExpandable();

  const hooksFn = (hooks: any) => {
    hooks.visibleColumns.push((columns: any) => {
      const columnsHooks = [];

      if (onRowSelectionChange) {
        columnsHooks.push({
          id: "react_formiga_table_selection",
          Header: (headerProps: any) => {
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
                <IndeterminateCheckbox {...getToggleAllRowsSelectedProps()} />
              </div>
            );
          },
          Cell: ({ row }: { row: any }) => (
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
        });
      }

      if (expandable) {
        columnsHooks.push({
          id: "react_formiga_table_expandable",
          Cell: ({ row }: { row: any }) => (
            <div
              style={{
                width: 50,
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              {expandIcon}
            </div>
          ),
        });
      }
      columnsHooks.push(...columns);
      return columnsHooks;
    });
  };

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    rows,
    prepareRow,
    state,
    selectedFlatRows,
  } = onRowSelectionChange
    ? (useTable(
        {
          columns,
          data,
        },
        useRowSelect,
        hooksFn
      ) as any)
    : useTable({ columns, data }, hooksFn);

  useDeepCompareEffect(() => {
    onRowSelectionChange?.(selectedFlatRows.map((d: any) => d.original));
  }, [state.selectedRowIds]);

  useEffect(() => {
    onChangeSort?.(localSorter);
  }, [localSorter]);

  return (
    <>
      <table {...getTableProps()}>
        <thead>
          {headerGroups.map((headerGroup: any) => (
            <tr {...headerGroup.getHeaderGroupProps()}>
              {headerGroup.headers.map((column: any) => (
                <th
                  {...column.getHeaderProps()}
                  onClick={() => {
                    handleColumnClick(column.id);
                  }}
                >
                  <div className="ctx">
                    {column.render("Header")}
                    <span
                      key={column.id}
                      className="arrow"
                      style={{
                        visibility:
                          getColumnSorter(column.id) !== undefined
                            ? undefined
                            : "hidden",
                      }}
                    >
                      {getColumnSorter(column.id) !== undefined &&
                      getColumnSorter(column.id)!.desc
                        ? " ▼"
                        : " ▲"}
                    </span>
                  </div>
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody {...getTableBodyProps()}>
          {rows.map((row: any) => {
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
                    <td
                      {...cell.getCellProps()}
                      style={
                        getColumnSorter(cell.column.id) !== undefined
                          ? {
                              backgroundColor: "#fafafa",
                            }
                          : {}
                      }
                    >
                      {cell.render("Cell")}
                    </td>
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
  const { dataSource, columns, height, loading, loadingComponent, ...rest } =
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
        sortType: it.sorter,
      })),
    [columns]
  );

  const data = React.useMemo(() => dataSource, [dataSource]);

  return (
    <Container height={height}>
      <TableComp columns={columnsForTable} data={data} {...rest} />
    </Container>
  );
};
