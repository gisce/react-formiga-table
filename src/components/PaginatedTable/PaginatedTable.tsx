import {
  forwardRef,
  memo,
  ReactNode,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
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

export type PaginatedTableProps = Omit<TableProps, "height"> & {
  height?: number;
  onColumnChanged?: (columnsState: ColumnState[]) => void;
  onGetColumnsState?: () => ColumnState[] | undefined;
  footer?: ReactNode;
  footerHeight?: number;
  hasStatusColumn?: boolean;
  onRowStatus?: (item: any) => any;
  statusComponent?: (status: any) => ReactNode;
  strings?: Record<string, string>;
  showPointerCursorInRows?: boolean;
  initialSortState?: ColumnState[];
  sortEnabled?: boolean;
  onChangeSort?: (sorter: Sorter | undefined) => void;
  sorter?: Sorter | undefined;
  readonly?: boolean;
  selectionRowKeys?: number[];
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
      selectionRowKeys = [],
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
      sortEnabled = true,
      onChangeSort,
      sorter,
      readonly,
    } = props;

    const { localSorter, getColumnSorter, handleColumnClick } =
      useSortable(sorter);

    useEffect(() => {
      onChangeSort?.(localSorter);
    }, [localSorter, onChangeSort]);

    const onSortChanged = useCallback(
      (event: SortChangedEvent) => {
        const columnState = event.api.getColumnState();
        const sortedColumns = columnState.filter((col) => col.sort);

        if (sortedColumns.length === 0) {
          if (localSorter) {
            handleColumnClick(localSorter.id);
          }
          return;
        }

        const { colId, sort } = sortedColumns[0];
        // Only trigger if the sort state actually changed
        if (
          localSorter?.id !== colId ||
          (localSorter?.desc && sort === "asc") ||
          (!localSorter?.desc && sort === "desc")
        ) {
          handleColumnClick(colId);
        }
      },
      [handleColumnClick, localSorter],
    );

    const gridRef = useRef<AgGridReact>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const totalHeight = footer ? heightProps + footerHeight : heightProps;
    const tableHeight = footer ? heightProps - footerHeight : heightProps;
    const notifyColumnChanges = useRef(false);

    const updateSelectedRowKeys = useCallback(() => {
      gridRef.current?.api?.forEachNode((node) => {
        if (node?.data?.id && selectionRowKeys.includes(node.data.id)) {
          node.setSelected(true);
        } else {
          node.setSelected(false);
        }
      });
    }, [selectionRowKeys]);

    useDeepCompareEffect(() => {
      updateSelectedRowKeys();
    }, [selectionRowKeys]);

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

    const debouncedOnColumnChanged = useMemo(
      () =>
        debounce(() => {
          const state = gridRef?.current?.api.getColumnState();
          if (!state) {
            return;
          }
          if (areStatesEqual(state, columnsPersistedStateRef.current)) {
            return;
          }
          if (!notifyColumnChanges.current) {
            notifyColumnChanges.current = true;
            return;
          }
          applyAndUpdateNewState(state);
          onColumnsChangedProps?.(state);
        }, 300),
      [applyAndUpdateNewState, columnsPersistedStateRef, onColumnsChangedProps],
    );

    const debouncedOnColumnResized = useMemo(
      () =>
        debounce((event: ColumnResizedEvent) => {
          if (!event.finished) {
            return;
          }
          debouncedOnColumnChanged();
        }, 300),
      [debouncedOnColumnChanged],
    );

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
          onRowSelectionChange?.(allIds);
        } else {
          // Deselect all rows
          onRowSelectionChange?.([]);
        }
      },
      [dataSource, onRowSelectionChange],
    );

    const colDefs = useMemo((): ColDef[] => {
      const checkboxColumn = {
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
            selectedRowKeysLength={selectionRowKeys?.length || 0}
            onSelectionCheckboxClicked={handleHeaderCheckboxClick}
          />
        ),
      } as ColDef;

      const storedState = columnsPersistedStateRef.current;
      const storedStateKeys = storedState?.map((col: any) => col.colId);

      const restOfColumns: ColDef[] = columns.map((column) => {
        const initialSort = initialSortState?.find(
          (state) => state.colId === column.key,
        );
        const columnSorter = getColumnSorter(column.key);

        return {
          field: column.key,
          sortable: column.isSortable && sortEnabled,
          headerName: column.title,
          sort: columnSorter ? (columnSorter.desc ? "desc" : "asc") : undefined,
          sortIndex: initialSort?.sortIndex,
          cellRenderer: column.render
            ? (cell: any) => column.render(cell.value)
            : undefined,
        };
      });

      storedState &&
        storedStateKeys &&
        restOfColumns.sort((a, b) => {
          const aIndex = storedStateKeys.indexOf(a.field);
          const bIndex = storedStateKeys.indexOf(b.field);
          return aIndex - bIndex;
        });

      const statusColumn = {
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
              applyAndUpdateNewState([]);
              gridRef.current?.api.resetColumnState();
              applyAutoFitState();
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
      columnsPersistedStateRef,
      columns,
      MemoizedStatusComponent,
      dataSource.length,
      selectionRowKeys?.length,
      handleHeaderCheckboxClick,
      initialSortState,
      strings,
      applyAndUpdateNewState,
      applyAutoFitState,
      onColumnsChangedProps,
      getColumnSorter,
      sortEnabled,
    ]);

    const onGridReady = useCallback(
      (params: GridReadyEvent) => {
        loadPersistedColumnState();
        if (loading) {
          params.api.showLoadingOverlay();
        } else {
          params.api.hideOverlay();
        }
      },
      [loadPersistedColumnState, loading],
    );

    useEffect(() => {
      if (loading) {
        gridRef.current?.api?.showLoadingOverlay();
      } else {
        gridRef.current?.api?.hideOverlay();
      }
    }, [loading]);

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

      const rowKeysInSelectedRowKeysButNotInAllNodes = selectionRowKeys.filter(
        (key: number) => !allNodesInTable.includes(key),
      );

      const selectedKeys = selectedNodes.map((node) => node.data.id);

      const finalSelectedKeys = Array.from(
        new Set([...selectedKeys, ...rowKeysInSelectedRowKeysButNotInAllNodes]),
      );

      const hasSelectionChanged =
        finalSelectedKeys.length !== selectionRowKeys.length ||
        finalSelectedKeys.some(
          (key: number) => !selectionRowKeys.includes(key),
        );

      if (hasSelectionChanged) {
        onRowSelectionChange?.(finalSelectedKeys);
      }
    }, [getAllNodeKeys, onRowSelectionChange, selectionRowKeys]);

    const rowStyle = useMemo(() => {
      return {
        cursor: showPointerCursorInRows ? "pointer" : "default",
      };
    }, [showPointerCursorInRows]);

    const memoizedDataSource = useMemo(() => {
      return dataSource.map((item) => {
        if (hasStatusColumn && onRowStatus) {
          return {
            ...item,
            $status: onRowStatus(item),
          };
        }
        return item;
      });
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
            onRowDoubleClicked={memoizedOnRowDoubleClick}
            rowStyle={rowStyle}
            getRowStyle={onRowStyle}
            suppressCellFocus={true}
            suppressRowClickSelection={true}
            rowBuffer={5}
            rowSelection={"multiple"}
            onDragStopped={debouncedOnColumnChanged}
            onColumnResized={debouncedOnColumnResized}
            rowData={memoizedDataSource}
            onSelectionChanged={onSelectionChanged}
            suppressDragLeaveHidesColumns={true}
            onGridReady={onGridReady}
            onSortChanged={onSortChanged}
            sortingOrder={sortEnabled ? ["asc", "desc", null] : undefined}
            suppressMultiSort={true}
            domLayout="autoHeight"
            defaultColDef={{
              autoHeight: true,
              wrapText: true,
              sortable: false, // Default to false, enable per column
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
