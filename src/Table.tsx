import React, { useCallback, useEffect, useState } from "react";
import styled from "styled-components";

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

export type TableProps = {
  dataSource: any[];
  columns: TableColumn[];
  onRow: (item: any) => RowSettings;
  onRowSelectionChange?: (selectedRowItems: any[]) => void;
  onChangeSort?: (sorter: Sorter | undefined) => void;
  sorter: Sorter | undefined;

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

function TableComp({
  columns,
  data,
  onRow,
  onRowSelectionChange,
  onChangeSort,
  sorter,
}: {
  columns: any;
  data: any;
  onRow: (item: any) => RowSettings;
  onChangeSort?: (sorter: Sorter | undefined) => void;
  sorter?: Sorter | undefined;
  onRowSelectionChange?: (selectedRowKeys: number[]) => void;
}) {
  const [localSorter, setLocalSorter] = useState(sorter);
  const [selectedRowKeys, setSelectedRowKeys] = useState<any[]>([]);

  useEffect(() => {
    onRowSelectionChange?.(selectedRowKeys);
  }, [selectedRowKeys]);

  const toggleAllRowsSelected = useCallback(() => {
    if (selectedRowKeys.length === data.length || selectedRowKeys.length > 0) {
      setSelectedRowKeys([]);
      return;
    }

    setSelectedRowKeys(data.map((item: any) => item.id));
  }, [selectedRowKeys, setSelectedRowKeys]);

  const toggleRowSelected = useCallback(
    (row: any) => {
      const selectedFoundRow = selectedRowKeys.find(
        (id: number) => row.id === id
      );

      if (selectedFoundRow === undefined) {
        setSelectedRowKeys([...selectedRowKeys, row.id]);
        return;
      }

      setSelectedRowKeys([...selectedRowKeys.filter((id) => id !== row.id)]);
    },
    [selectedRowKeys, setSelectedRowKeys]
  );

  const isRowSelected = useCallback(
    (row: any) => {
      const selectedFoundRow = selectedRowKeys.find(
        (id: number) => row.id === id
      );

      return selectedFoundRow !== undefined;
    },
    [selectedRowKeys, setSelectedRowKeys]
  );

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

  useEffect(() => {
    onChangeSort?.(localSorter);
  }, [localSorter]);

  return (
    <table>
      <thead>
        <tr>
          {onRowSelectionChange && (
            <th key={"react_formiga_table_selection"}>
              <div
                style={{
                  width: 50,
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <Checkbox
                  value={
                    selectedRowKeys.length === data.length
                      ? true
                      : selectedRowKeys.length === 0
                      ? false
                      : null
                  }
                  onChange={toggleAllRowsSelected}
                />
              </div>
            </th>
          )}
          {columns.map((column: any) => (
            <th
              key={column.key}
              onClick={() => {
                handleColumnClick(column.key);
              }}
            >
              <div className="ctx">
                <p>{column.title}</p>
                <span
                  key={column.key}
                  className="arrow"
                  style={{
                    visibility:
                      getColumnSorter(column.key) !== undefined
                        ? undefined
                        : "hidden",
                  }}
                >
                  {getColumnSorter(column.key) !== undefined &&
                  getColumnSorter(column.key)!.desc
                    ? " ▼"
                    : " ▲"}
                </span>
              </div>
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.map((row: any) => {
          const { style, onDoubleClick } = onRow(row);

          return (
            <tr
              key={`tr-${row.id}`}
              style={style}
              onDoubleClick={onDoubleClick}
            >
              {onRowSelectionChange && (
                <td key={`react_formiga_table_selection-${row.id}`}>
                  <div
                    style={{
                      width: 50,
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    {isRowSelected(row) ? (
                      <Checkbox
                        value={true}
                        onChange={() => {
                          toggleRowSelected(row);
                        }}
                      />
                    ) : (
                      <Checkbox
                        value={false}
                        onChange={() => {
                          toggleRowSelected(row);
                        }}
                      />
                    )}
                  </div>
                </td>
              )}
              {columns.map((column: any) => {
                return (
                  <td
                    key={`${column.key}-${row.id}`}
                    style={
                      getColumnSorter(column.key) !== undefined
                        ? {
                            backgroundColor: "#fafafa",
                          }
                        : {}
                    }
                  >
                    {column.render
                      ? column.render(row[column.key])
                      : row[column.key]}
                  </td>
                );
              })}
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

const Checkbox = ({
  value,
  onChange,
}: {
  value: boolean | null;
  onChange: (value: boolean | null) => void;
}) => {
  const checkboxRef = React.useRef();

  React.useEffect(() => {
    const cbRef = checkboxRef.current as any;

    if (value === true) {
      cbRef.checked = true;
      cbRef.indeterminate = false;
    } else if (value === false) {
      cbRef.checked = false;
      cbRef.indeterminate = false;
    } else if (value === null) {
      cbRef.checked = false;
      cbRef.indeterminate = true;
    }
  }, [value]);

  return (
    <input
      ref={checkboxRef as any}
      type="checkbox"
      onChange={onChange as any}
    />
  );
};

export const Table = (props: TableProps) => {
  const {
    dataSource,
    columns,
    height,
    onRow,
    loading,
    loadingComponent,
    onRowSelectionChange,
    onChangeSort,
    sorter,
  } = props;

  if (loading) {
    return loadingComponent;
  }

  const data = React.useMemo(() => dataSource, [dataSource]);

  return (
    <Container height={height}>
      <TableComp
        columns={columns}
        data={data}
        onRow={onRow}
        onRowSelectionChange={onRowSelectionChange}
        onChangeSort={onChangeSort}
        sorter={sorter}
      />
    </Container>
  );
};
