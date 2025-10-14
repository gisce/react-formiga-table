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
import "@/styles/ag-theme-quartz.css";
import {
  BodyScrollEvent,
  ColDef,
  ColumnResizedEvent,
  ColumnState,
  GridReadyEvent,
  IGetRowsParams,
  RowDoubleClickedEvent,
} from "ag-grid-community";
import { Strings, TableProps, TableType } from "@/types";
import { useDeepArrayMemo } from "@/hooks/useDeepArrayMemo";
import { HeaderCheckbox } from "./HeaderCheckbox";
import { areStatesEqual, useColumnState } from "./useColumnState";
import { CHECKBOX_COLUMN, STATUS_COLUMN } from "./columnStateHelper";
import debounce from "lodash/debounce";
import { useDeepCompareEffect } from "use-deep-compare";
import { ITOptsButton } from "./ITOptsButton";
import { NoRowsOverlay } from "../NoRowsOverlay";

const DEBOUNCE_TIME = 500;
const DEFAULT_TOTAL_ROWS_VALUE = 1;

export type InfiniteTableProps = Omit<
  TableProps,
  "dataSource" & "loading" & "loadingComponent" & "height"
> & {
  onRequestData: ({
    startRow,
    endRow,
    state,
  }: {
    startRow: number;
    endRow: number;
    state?: ColumnState[];
  }) => Promise<any[] | undefined>;
  height?: number;
  onColumnChanged?: (columnsState: ColumnState[]) => void;
  onGetColumnsState?: () => ColumnState[] | undefined;
  onGetFirstVisibleRowIndex?: () => number | undefined;
  onChangeFirstVisibleRowIndex?: (index: number) => void;
  selectedRowKeys?: number[];
  totalRows?: number;
  allRowSelectedMode?: boolean;
  onSelectionCheckboxClicked?: () => void;
  footer?: ReactNode;
  footerHeight?: number;
  hasStatusColumn?: boolean;
  onRowStatus?: (item: any) => any;
  statusComponent?: (status: any) => ReactNode;
  strings?: Strings;
  showPointerCursorInRows?: boolean;
  initialSortState?: ColumnState[];
  cacheBlockSize?: number;
  onChangeTableType?: (targetType: TableType) => void;
  autoRefresh?: number;
  debug?: boolean;
};

export type InfiniteTableRef = {
  setSelectedRows: (keys: number[]) => void;
  unselectAll: () => void;
  refresh: () => void;
  updateRows: (updates: Array<Record<string, any>>) => void;
  getVisibleRowIds: () => string[];
  getVisibleRows: () => any[];
  refreshRowStyles: () => void;
  pauseAutoRefresh: () => void;
  resumeAutoRefresh: () => void;
  scrollToTop: () => void;
};

const DEFAULT_CACHE_BLOCK_SIZE = 30;

const InfiniteTableComp = forwardRef<InfiniteTableRef, InfiniteTableProps>(
  (props, ref) => {
    const {
      onRequestData,
      columns: columnsProps,
      onRowDoubleClick,
      onRowSelectionChange,
      height: heightProps = 600,
      onRowStyle,
      onColumnChanged: onColumnsChangedProps,
      onGetColumnsState,
      onChangeFirstVisibleRowIndex,
      onGetFirstVisibleRowIndex,
      selectedRowKeys = [],
      totalRows = DEFAULT_TOTAL_ROWS_VALUE,
      onSelectionCheckboxClicked,
      footer,
      footerHeight = 30,
      onRowStatus,
      statusComponent,
      hasStatusColumn = false,
      strings = {},
      showPointerCursorInRows = true,
      initialSortState,
      cacheBlockSize = 30,
      onChangeTableType,
      autoRefresh,
      debug = false,
    } = props;

    const gridRef = useRef<AgGridReact>(null);
    const firstTimeDataLoaded = useRef(true);
    const firstTimeOnBodyScroll = useRef(true);
    const dataIsLoading = useRef(false);
    const isAutoRefreshing = useRef(false);
    const activeAutoRefreshRequests = useRef(0);
    const containerRef = useRef<HTMLDivElement>(null);
    const autoRefreshPaused = useRef<boolean>(false);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const totalHeight = footer ? heightProps + footerHeight : heightProps;
    const tableHeight = footer ? heightProps - footerHeight : heightProps;
    const datasourceRef = useRef<{
      getRows: (params: IGetRowsParams) => void;
    }>();
    const firstTimeResized = useRef(false);

    // Store totalRows in a ref so getRows always uses the latest value
    const totalRowsRef = useRef(totalRows);
    totalRowsRef.current = totalRows;

    const updateSelectedRowKeys = useCallback(() => {
      gridRef.current?.api?.forEachNode((node) => {
        if (node?.data?.id && selectedRowKeys.includes(node.data.id)) {
          node.setSelected(true);
        } else {
          node.setSelected(false);
        }
      });
    }, [selectedRowKeys]);

    useDeepCompareEffect(() => {
      updateSelectedRowKeys();
    }, [selectedRowKeys]);

    useEffect(() => {
      if (!autoRefresh || autoRefresh <= 0) {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        return;
      }

      intervalRef.current = setInterval(() => {
        if (!gridRef.current?.api || autoRefreshPaused.current) return;

        isAutoRefreshing.current = true;
        activeAutoRefreshRequests.current = 0;

        gridRef.current.api.refreshInfiniteCache();
      }, autoRefresh);

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      };
    }, [autoRefresh]);

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
        gridRef.current?.api?.purgeInfiniteCache();
      },
      updateRows: (updates: Array<Record<string, any>>) => {
        if (!gridRef.current?.api) return;

        updates
          .filter((update) => update?.id)
          .forEach((update) => {
            const node = gridRef.current?.api
              .getRenderedNodes()
              .find((node) => node.data?.id === update?.id);
            if (node) {
              // Update specific fields without refreshing entire row
              node.setData({ ...node.data, ...update });
            }
          });
      },
      getVisibleRowIds: () => {
        if (!gridRef.current?.api) return [];
        const visibleNodes = gridRef.current.api.getRenderedNodes();
        return visibleNodes.map((node) => node?.data?.id);
      },
      getVisibleRows: () => {
        if (!gridRef.current?.api) return [];
        const visibleNodes = gridRef.current.api.getRenderedNodes();
        return visibleNodes.map((node) => node?.data);
      },
      refreshRowStyles: () => {
        if (!gridRef.current?.api) return;
        gridRef.current.api.redrawRows();
      },
      pauseAutoRefresh: () => {
        autoRefreshPaused.current = true;
      },
      resumeAutoRefresh: () => {
        autoRefreshPaused.current = false;
      },
      scrollToTop: () => {
        gridRef.current?.api?.ensureIndexVisible(0, "top");
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

    const onColumnChanged = useCallback(() => {
      const state = gridRef?.current?.api.getColumnState();
      if (!state) {
        return;
      }
      const persistedState = onGetColumnsState?.();
      if (areStatesEqual(state, persistedState)) {
        return;
      }
      applyAndUpdateNewState(state);
      onColumnsChangedProps?.(state);
    }, [applyAndUpdateNewState, onColumnsChangedProps, onGetColumnsState]);

    const onColumnResized = useCallback(
      (event: ColumnResizedEvent) => {
        if (!event.finished || event.source !== "uiColumnResized") {
          return;
        }
        onColumnChanged();
      },
      [onColumnChanged],
    );

    const MemoizedStatusComponent = useMemo(() => {
      if (!statusComponent) return undefined;
      // eslint-disable-next-line react/display-name
      return memo((props: { status: any }) => statusComponent(props.status));
    }, [statusComponent]);

    const colDefs = useMemo((): ColDef[] => {
      const checkboxColumn = {
        checkboxSelection: true,
        suppressMovable: true,
        sortable: false,
        pinned: "left",
        lockPosition: "left",
        lockPinned: true,
        width: 40,
        maxWidth: 40,
        minWidth: 40,
        resizable: false,
        field: CHECKBOX_COLUMN,
        headerClass: "ag-checkbox-header",
        cellClass: "ag-cell-checkbox-centered",
        cellStyle: {
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-start",
          paddingLeft: "10px",
          paddingRight: "5px",
        },
        headerComponent: () => (
          <HeaderCheckbox
            totalRows={totalRows}
            selectedRowKeysLength={selectedRowKeys?.length || 0}
            onSelectionCheckboxClicked={onSelectionCheckboxClicked}
          />
        ),
      } as ColDef;

      const storedState = columnsPersistedStateRef.current;
      const storedStateKeys = storedState?.map((col: any) => col.colId);

      const restOfColumns: ColDef[] = columns.map((column) => {
        const initialSort = initialSortState?.find(
          (state) => state.colId === column.key,
        );

        return {
          field: column.key,
          sortable: column.isSortable,
          headerName: column.title,
          sort: initialSort?.sort,
          sortIndex: initialSort?.sortIndex,
          cellRenderer: column.render
            ? (cell: { value: any; data: any }) =>
                column.render(cell.value, cell.data)
            : undefined,
        };
      });

      // restOfColumns should be sorted by the order of the storedState
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
        width: onRowSelectionChange ? 25 : 30,
        maxWidth: onRowSelectionChange ? 25 : 30,
        minWidth: onRowSelectionChange ? 25 : 30,
        pinned: "left",
        resizable: false,
        cellStyle: {
          padding: 0,
          margin: 0,
        },
        headerComponent: () => (
          <ITOptsButton
            resetTableViewLabel={
              strings?.["resetTableViewLabel"] || "resetTableViewLabel"
            }
            currentTableType="infinite"
            onChangeTableType={onChangeTableType}
            changeToInfiniteLabel={
              strings?.["changeToInfiniteLabel"] || "Canviar a llistat infinit"
            }
            changeToPaginatedLabel={
              strings?.["changeToPaginatedLabel"] || "Canviar a llistat paginat"
            }
            onResetTableView={async () => {
              applyAndUpdateNewState([]);
              gridRef.current?.api.resetColumnState();
              applyAutoFitState();
              onColumnsChangedProps?.([]);
            }}
          />
        ),
        cellRenderer: MemoizedStatusComponent
          ? (cell: any) => (
              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  alignItems: "center",
                  height: "100%",
                }}
              >
                <MemoizedStatusComponent status={cell.value} />
              </div>
            )
          : undefined,
      } as ColDef;

      const finalColumns = onRowSelectionChange
        ? [statusColumn, checkboxColumn, ...restOfColumns]
        : [statusColumn, ...restOfColumns];

      return finalColumns;
    }, [
      columnsPersistedStateRef,
      columns,
      MemoizedStatusComponent,
      totalRows,
      selectedRowKeys?.length,
      onSelectionCheckboxClicked,
      initialSortState,
      strings,
      applyAndUpdateNewState,
      applyAutoFitState,
      onColumnsChangedProps,
      onChangeTableType,
      onRowSelectionChange,
    ]);

    const scrollToSavedPosition = useCallback(() => {
      const firstVisibleRowIndex = onGetFirstVisibleRowIndex?.();
      if (firstVisibleRowIndex && gridRef.current?.api) {
        gridRef.current.api.ensureIndexVisible(firstVisibleRowIndex, "top");
      }
    }, [onGetFirstVisibleRowIndex]);

    const memoizedOnRowStatus = useCallback(
      (item: any) => {
        if (onRowStatus) {
          return onRowStatus(item);
        }
        return undefined;
      },
      [onRowStatus],
    );

    const getRows = useCallback(
      async (params: IGetRowsParams) => {
        try {
          if (dataIsLoading.current) {
            return;
          }
          const { startRow, endRow } = params;
          if (
            cacheBlockSize === totalRowsRef.current &&
            params.startRow !== 0
          ) {
            params.successCallback([], totalRowsRef.current);
            return;
          }
          dataIsLoading.current = true;

          if (isAutoRefreshing.current) {
            activeAutoRefreshRequests.current += 1;
          }

          if (startRow === 0 && !isAutoRefreshing.current) {
            gridRef.current?.api.showLoadingOverlay();
          }
          const data = await onRequestData({
            startRow,
            endRow,
            state: gridRef.current?.api.getColumnState(),
          });

          const currentTotalRows = totalRowsRef.current;

          if (!data) {
            throw new Error("Data is undefined");
          }

          if (startRow === 0 && data.length === 0) {
            gridRef.current?.api.showNoRowsOverlay();
            params.successCallback([], 0);
            dataIsLoading.current = false;
            return;
          }

          // If we get 0 rows for a request beyond the start, we're past the end
          if (data.length === 0 && startRow > 0) {
            // Use totalRows if available and valid, otherwise use startRow as a fallback
            const effectiveLastRow =
              currentTotalRows !== undefined &&
              currentTotalRows !== DEFAULT_TOTAL_ROWS_VALUE
                ? currentTotalRows
                : startRow;
            params.successCallback([], effectiveLastRow);
            dataIsLoading.current = false;
            return;
          }

          let lastRow = -1;

          // First check: did we get less data than requested? This means we've hit the end
          if (data.length < endRow - startRow) {
            lastRow = startRow + data.length;
          }
          // Second check: if we know totalRows, always use it (unless already set above)
          else if (
            currentTotalRows !== undefined &&
            currentTotalRows !== DEFAULT_TOTAL_ROWS_VALUE
          ) {
            lastRow = currentTotalRows;
          }
          // Special case for cacheBlockSize (fallback if we still don't know)
          else if (
            currentTotalRows >= cacheBlockSize &&
            cacheBlockSize !== DEFAULT_CACHE_BLOCK_SIZE
          ) {
            lastRow = cacheBlockSize;
          }

          const finalData = hasStatusColumn
            ? await Promise.all(
                data.map(async (item) => {
                  const status = memoizedOnRowStatus
                    ? await memoizedOnRowStatus(item)
                    : undefined;
                  return {
                    ...item,
                    $status: status,
                  };
                }),
              )
            : data;

          params.successCallback(finalData, lastRow);

          if (selectedRowKeys && selectedRowKeys.length > 0) {
            gridRef?.current?.api.forEachNode((node) => {
              if (node?.data?.id && selectedRowKeys.includes(node.data.id)) {
                node.setSelected(true);
              }
            });
          }

          if (!columnsPersistedStateRef.current && !firstTimeResized.current) {
            firstTimeResized.current = true;
            applyAutoFitState();
          }

          dataIsLoading.current = false;

          if (isAutoRefreshing.current) {
            activeAutoRefreshRequests.current -= 1;
            if (activeAutoRefreshRequests.current <= 0) {
              isAutoRefreshing.current = false;
              activeAutoRefreshRequests.current = 0;
            }
          }

          if (!isAutoRefreshing.current) {
            gridRef.current?.api.hideOverlay();
          }
          if (firstTimeDataLoaded.current) {
            firstTimeDataLoaded.current = false;
            scrollToSavedPosition();
          }
        } catch (error) {
          dataIsLoading.current = false;

          if (isAutoRefreshing.current) {
            activeAutoRefreshRequests.current -= 1;
            if (activeAutoRefreshRequests.current <= 0) {
              isAutoRefreshing.current = false;
              activeAutoRefreshRequests.current = 0;
            }
          }

          params.failCallback();
          if (!isAutoRefreshing.current) {
            gridRef.current?.api.hideOverlay();
          }
        }
      },
      [
        cacheBlockSize,
        onRequestData,
        hasStatusColumn,
        selectedRowKeys,
        columnsPersistedStateRef,
        memoizedOnRowStatus,
        applyAutoFitState,
        scrollToSavedPosition,
      ],
    );

    useEffect(() => {
      datasourceRef.current = { getRows };
    }, [getRows]);

    const onGridReady = useCallback(
      (params: GridReadyEvent) => {
        loadPersistedColumnState();
        params.api.setGridOption("datasource", {
          getRows: (params: IGetRowsParams) => {
            datasourceRef.current?.getRows(params);
          },
        });
      },
      [datasourceRef, loadPersistedColumnState],
    );

    const memoizedOnRowDoubleClick = useCallback(
      ({ data: item }: RowDoubleClickedEvent) => {
        onRowDoubleClick?.(item);
      },
      [onRowDoubleClick],
    );

    // eslint-disable-next-line react-hooks/exhaustive-deps
    const debouncedOnBodyScroll = useCallback(
      debounce((params: BodyScrollEvent) => {
        if (!firstTimeOnBodyScroll.current) {
          onChangeFirstVisibleRowIndex?.(
            params.api.getFirstDisplayedRowIndex(),
          );
        }
        firstTimeOnBodyScroll.current = false;
      }, DEBOUNCE_TIME),
      [onChangeFirstVisibleRowIndex],
    );

    // useWhyDidYouRender("InfiniteTable", props);

    const getAllNodeKeys = useCallback(() => {
      const allNodes: number[] = [];
      gridRef.current?.api?.forEachNode((node) => {
        if (node?.data?.id) {
          allNodes.push(node.data.id);
        }
      });
      return allNodes;
    }, []);

    const onSelectionChanged = useCallback(
      (event: { api: { getSelectedNodes: () => any } }) => {
        const allNodesInTable = getAllNodeKeys();
        const allSelectedNodes = event.api.getSelectedNodes() || [];

        // get the records that are not in allNodesInTable but they exist in selectedRowKeys
        const rowKeysInSelectedRowKeysButNotInAllNodes = selectedRowKeys.filter(
          (key) => !allNodesInTable.includes(key),
        );

        const selectedKeys = allSelectedNodes.map(
          (node: { data: any }) => node.data.id,
        );

        const finalSelectedKeys = Array.from(
          new Set([
            ...selectedKeys,
            ...rowKeysInSelectedRowKeysButNotInAllNodes,
          ]),
        );

        const hasSelectionChanged =
          finalSelectedKeys.length !== selectedRowKeys.length ||
          finalSelectedKeys.some((key) => !selectedRowKeys.includes(key));

        if (hasSelectionChanged) {
          onRowSelectionChange?.(finalSelectedKeys);
        }
      },
      [getAllNodeKeys, onRowSelectionChange, selectedRowKeys],
    );

    const rowStyle = useMemo(() => {
      return {
        cursor: showPointerCursorInRows ? "pointer" : "default",
      };
    }, [showPointerCursorInRows]);

    const NoRowsOverlayComponent = useMemo(() => {
      // eslint-disable-next-line react/display-name
      return () => <NoRowsOverlay message={strings?.["noResultsLabel"]} />;
    }, [strings]);

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
            enableCellTextSelection={true}
            rowStyle={rowStyle}
            getRowStyle={onRowStyle}
            suppressCellFocus={true}
            suppressRowClickSelection={true}
            rowBuffer={5}
            rowSelection={"multiple"}
            onDragStopped={onColumnChanged}
            onColumnResized={onColumnResized}
            rowModelType={"infinite"}
            cacheBlockSize={cacheBlockSize}
            onSelectionChanged={onSelectionChanged}
            cacheOverflowSize={2}
            maxConcurrentDatasourceRequests={1}
            infiniteInitialRowCount={totalRows}
            onGridReady={onGridReady}
            onBodyScroll={debouncedOnBodyScroll}
            blockLoadDebounceMillis={DEBOUNCE_TIME}
            suppressDragLeaveHidesColumns={true}
            noRowsOverlayComponent={NoRowsOverlayComponent}
            debug={debug}
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

InfiniteTableComp.displayName = "InfiniteTable";

export const InfiniteTable = memo(InfiniteTableComp);
