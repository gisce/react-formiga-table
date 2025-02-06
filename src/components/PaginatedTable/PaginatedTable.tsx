import {
  forwardRef,
  memo,
  ReactNode,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import { AgGridReact } from "ag-grid-react";
import "ag-grid-community/styles/ag-grid.css";
import "../../styles/ag-theme-quartz.css";
import {
  ColDef,
  ColumnResizedEvent,
  ColumnState,
  GridReadyEvent,
  RowDoubleClickedEvent,
  SortChangedEvent,
} from "ag-grid-community";
import type { TableProps, Sorter } from "@/types";
import { useDeepArrayMemo } from "@/hooks/useDeepArrayMemo";
import debounce from "lodash/debounce";
import { useDeepCompareEffect } from "use-deep-compare";
import {
  useColumnState,
  areStatesEqual,
} from "../InfiniteTable/useColumnState";
import {
  CHECKBOX_COLUMN,
  STATUS_COLUMN,
} from "../InfiniteTable/columnStateHelper";
import { ITOptsButton } from "../InfiniteTable/ITOptsButton";
import { HeaderCheckbox } from "../InfiniteTable/HeaderCheckbox";
import { useSortable } from "@/hooks/useSortable";
import { useWhyDidYouRender } from "@/hooks/useWhyDidYouRender";

const DEFAULT_COL_DEF = {
  autoHeight: true,
  wrapText: true,
  sortable: false,
  comparator: () => 0,
  resizable: true,
  maxWidth: 400, // Maximum column width
  minWidth: 100, // Minimum column width to ensure readability
};

export type PaginatedTableProps = Omit<TableProps, "height"> & {
  height?: number;
  footer?: ReactNode;
  footerHeight?: number;
  hasStatusColumn?: boolean;
  onRowStatus?: (item: any) => any;
  statusComponent?: (status: any) => ReactNode;
  strings?: Record<string, string>;
  showPointerCursorInRows?: boolean;
  initialSortState?: ColumnState[];
  sortEnabled?: boolean;
  readonly?: boolean;
  sorter?: Sorter | undefined;
  onChangeSort?: (sorter: Sorter | undefined) => void;
  selectionRowKeys?: number[];
  onColumnChanged?: (columnsState: ColumnState[]) => void;
  onGetColumnsState?: () => ColumnState[] | undefined;
};

export type PaginatedTableRef = {
  setSelectedRows: (keys: number[]) => void;
  unselectAll: () => void;
  refresh: () => void;
  updateRows: (updates: Array<Record<string, any>>) => void;
  getVisibleRowIds: () => string[];
};

const PaginatedTableComp = forwardRef<PaginatedTableRef, PaginatedTableProps>(
  (props, ref) => {
    const {
      dataSource,
      columns: columnsProps,
      onRowDoubleClick,
      onRowSelectionChange,
      height: heightProps = 600,
      onRowStyle,
      onColumnChanged: onColumnsChangedProps,
      onGetColumnsState,
      selectionRowKeys: initialSelectionRowKeys = [],
      footer,
      footerHeight = 30,
      onRowStatus,
      statusComponent,
      hasStatusColumn = false,
      strings = {},
      showPointerCursorInRows = true,
      initialSortState,
      loading,
      loadingComponent,
      onChangeSort,
      sorter,
      readonly,
    } = props;

    const [internalSelectionRowKeys, setInternalSelectionRowKeys] = useState<
      number[]
    >(initialSelectionRowKeys);

    useEffect(() => {
      setInternalSelectionRowKeys(initialSelectionRowKeys);
    }, [initialSelectionRowKeys]);

    useWhyDidYouRender("PaginatedTable", props);

    const gridRef = useRef<AgGridReact>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const totalHeight = footer ? heightProps + footerHeight : heightProps;
    const tableHeight = footer ? heightProps - footerHeight : heightProps;
    const notifyColumnChanges = useRef(false);

    const updateSelectedRowKeys = useCallback(() => {
      gridRef.current?.api?.forEachNode((node) => {
        if (node?.data?.id && internalSelectionRowKeys.includes(node.data.id)) {
          node.setSelected(true);
        } else {
          node.setSelected(false);
        }
      });
    }, [internalSelectionRowKeys]);

    useDeepCompareEffect(() => {
      updateSelectedRowKeys();
    }, [internalSelectionRowKeys]);

    useImperativeHandle(ref, () => ({
      setSelectedRows: (keys: number[]) => {
        gridRef.current?.api?.forEachNode((node) => {
          if (node?.data?.id && keys.includes(node.data.id)) {
            node.setSelected(true);
          } else {
            node.setSelected(false);
          }
        });
      },
      unselectAll: () => {
        gridRef.current?.api?.deselectAll();
      },
      refresh: () => {
        gridRef.current?.api?.deselectAll();
        gridRef.current?.api?.refreshCells();
      },
      updateRows: (updates: Array<Record<string, any>>) => {
        if (!gridRef.current?.api) return;

        updates.forEach((update) => {
          const node = gridRef.current?.api
            .getRenderedNodes()
            .find((node) => node.data.id === update.id);
          if (node) {
            node.setData({ ...node.data, ...update });
          }
        });
      },
      getVisibleRowIds: () => {
        if (!gridRef.current?.api) return [];
        const visibleNodes = gridRef.current.api.getRenderedNodes();
        return visibleNodes.map((node) => node?.data?.id);
      },
    }));

    const columns = useDeepArrayMemo(columnsProps, "key");

    const {
      loadPersistedColumnState,
      columnsPersistedStateRef,
      applyAndUpdateNewState,
      applyAutoFitState,
    } = useColumnState({
      gridRef,
      containerRef,
      columns,
      onGetColumnsState,
    });

    const MemoizedStatusComponent = useMemo(() => {
      if (!statusComponent) return undefined;
      // eslint-disable-next-line react/display-name
      return memo((props: { status: any }) => statusComponent(props.status));
    }, [statusComponent]);

    const handleHeaderCheckboxClick = useCallback(
      (event: React.ChangeEvent<HTMLInputElement>) => {
        const isChecked = event.target.checked;
        if (isChecked) {
          // Select all rows
          const allIds = dataSource.map((item) => item.id);
          setInternalSelectionRowKeys(allIds);
          onRowSelectionChange?.(allIds);
        } else {
          // Deselect all rows
          setInternalSelectionRowKeys([]);
          onRowSelectionChange?.([]);
        }
      },
      [dataSource, onRowSelectionChange],
    );

    const colDefs = useMemo((): ColDef[] => {
      const checkboxColumn = {
        ...DEFAULT_COL_DEF,
        checkboxSelection: true,
        suppressMovable: true,
        sortable: false,
        pinned: "left",
        lockPosition: "left",
        lockPinned: true,
        maxWidth: 50,
        resizable: false,
        field: CHECKBOX_COLUMN,
        headerComponent: () => (
          <HeaderCheckbox
            totalRows={dataSource.length}
            selectedRowKeysLength={internalSelectionRowKeys?.length || 0}
            onSelectionCheckboxClicked={handleHeaderCheckboxClick}
          />
        ),
      } as ColDef;

      const restOfColumns: ColDef[] = columns.map((column) => {
        return {
          ...DEFAULT_COL_DEF,
          field: column.key,
          sortable: column.isSortable,
          headerName: column.title,
          sort: sorter ? (sorter.desc ? "desc" : "asc") : undefined,
          cellRenderer: column.render
            ? (cell: any) => column.render(cell.value)
            : undefined,
          comparator: column.comparator,
        };
      });

      const statusColumn = {
        ...DEFAULT_COL_DEF,
        field: STATUS_COLUMN,
        suppressMovable: true,
        sortable: false,
        lockPosition: "left",
        lockPinned: true,
        maxWidth: 30,
        pinned: "left",
        resizable: false,
        headerComponent: () => (
          <ITOptsButton
            resetTableViewLabel={
              strings?.["resetTableViewLabel"] || "resetTableViewLabel"
            }
            onResetTableView={async () => {
              notifyColumnChanges.current = false;
              gridRef.current?.api.resetColumnState();
              onColumnsChangedProps?.([]);
            }}
          />
        ),
        cellRenderer: MemoizedStatusComponent
          ? (cell: any) => <MemoizedStatusComponent status={cell.value} />
          : undefined,
      } as ColDef;

      const finalColumns = [statusColumn, checkboxColumn, ...restOfColumns];

      return finalColumns;
    }, [
      columns,
      MemoizedStatusComponent,
      dataSource.length,
      internalSelectionRowKeys?.length,
      handleHeaderCheckboxClick,
      sorter,
      strings,
      onColumnsChangedProps,
    ]);

    const onGridReady = useCallback(
      (params: GridReadyEvent) => {
        if (loading) {
          params.api.showLoadingOverlay();
        } else {
          params.api.hideOverlay();
        }

        gridRef.current?.api?.forEachNode((node) => {
          if (
            node?.data?.id &&
            internalSelectionRowKeys.includes(node.data.id)
          ) {
            node.setSelected(true);
          }
        });
      },
      [loading, internalSelectionRowKeys],
    );

    const memoizedOnRowDoubleClick = useCallback(
      ({ data: item }: RowDoubleClickedEvent) => {
        onRowDoubleClick?.(item);
      },
      [onRowDoubleClick],
    );

    const getAllNodeKeys = useCallback(() => {
      const allNodes: number[] = [];
      gridRef.current?.api?.forEachNode((node) => {
        if (node?.data?.id) {
          allNodes.push(node.data.id);
        }
      });
      return allNodes;
    }, []);

    const onSelectionChanged = useCallback(() => {
      const allNodesInTable = getAllNodeKeys();
      const selectedNodes = gridRef.current?.api?.getSelectedNodes() || [];

      const rowKeysInSelectedRowKeysButNotInAllNodes =
        internalSelectionRowKeys.filter(
          (key: number) => !allNodesInTable.includes(key),
        );

      const selectedKeys = selectedNodes.map((node) => node.data.id);

      const finalSelectedKeys = Array.from(
        new Set([...selectedKeys, ...rowKeysInSelectedRowKeysButNotInAllNodes]),
      );

      const hasSelectionChanged =
        finalSelectedKeys.length !== internalSelectionRowKeys.length ||
        finalSelectedKeys.some(
          (key: number) => !internalSelectionRowKeys.includes(key),
        );

      if (hasSelectionChanged) {
        setInternalSelectionRowKeys(finalSelectedKeys);
        onRowSelectionChange?.(finalSelectedKeys);
      }
    }, [getAllNodeKeys, onRowSelectionChange, internalSelectionRowKeys]);

    const rowStyle = useMemo(() => {
      return {
        cursor: showPointerCursorInRows ? "pointer" : "default",
      };
    }, [showPointerCursorInRows]);

    const memoizedDataSource = useMemo(() => {
      if (!hasStatusColumn || !onRowStatus) {
        return dataSource;
      }
      return dataSource.map((item) => ({
        ...item,
        $status: onRowStatus(item),
      }));
    }, [dataSource, hasStatusColumn, onRowStatus]);

    if (loading && loadingComponent) {
      return loadingComponent;
    }

    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          height: totalHeight,
        }}
      >
        <div
          ref={containerRef}
          className={`ag-grid-default-table ag-theme-quartz`}
          style={{ height: tableHeight, width: "100%" }}
        >
          <AgGridReact
            ref={gridRef}
            columnDefs={colDefs}
            rowData={memoizedDataSource}
            onRowDoubleClicked={memoizedOnRowDoubleClick}
            suppressCellFocus={true}
            suppressRowClickSelection={true}
            rowBuffer={5}
            rowSelection={"multiple"}
            onSelectionChanged={onSelectionChanged}
            suppressDragLeaveHidesColumns={true}
            onGridReady={onGridReady}
            onSortChanged={(event) => {
              const columnState = event.api.getColumnState();
              const sortedColumns = columnState.filter((col) => col.sort);
              if (sortedColumns.length > 0) {
                const { colId, sort } = sortedColumns[0];
                const newSorter = {
                  id: colId,
                  desc: sort === "desc",
                };
                console.log("Sorted column:", colId, "Direction:", sort);
                onChangeSort?.(newSorter);
              } else {
                console.log("No column is currently sorted");
                onChangeSort?.(undefined);
              }
            }}
            suppressMultiSort={true}
            getRowHeight={undefined}
            getRowId={(params) => String(params.data.id)}
            onFirstDataRendered={() => {
              console.log("onFirstDataRendered");
              applyAutoFitState();
            }}
          />
        </div>
        {footer && (
          <div
            style={{
              height: footerHeight,
            }}
          >
            {footer}
          </div>
        )}
      </div>
    );
  },
);

PaginatedTableComp.displayName = "PaginatedTable";

export const PaginatedTable = memo(PaginatedTableComp);
