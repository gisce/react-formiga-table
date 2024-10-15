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
  SortDirection,
} from "ag-grid-community";
import { TableProps } from "@/types";
import { useDeepArrayMemo } from "@/hooks/useDeepArrayMemo";
import { HeaderCheckbox } from "./HeaderCheckbox";
import { areStatesEqual, useColumnState } from "./useColumnState";
import { CHECKBOX_COLUMN, STATUS_COLUMN } from "./columnStateHelper";
import debounce from "lodash/debounce";
import { useDeepCompareEffect } from "use-deep-compare";
import { ITOptsButton } from "./ITOptsButton";

const DEBOUNCE_TIME = 100;
const DEFAULT_TOTAL_ROWS_VALUE = Number.MAX_SAFE_INTEGER;

export type InfiniteTableProps = Omit<
  TableProps,
  "dataSource" & "loading" & "loadingComponent" & "height"
> & {
  onRequestData: ({
    startRow,
    endRow,
    sortFields,
  }: {
    startRow: number;
    endRow: number;
    sortFields?: Record<string, SortDirection>;
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
  strings?: Record<string, string>;
};

export type InfiniteTableRef = {
  setSelectedRows: (keys: number[]) => void;
  unselectAll: () => void;
  refresh: () => void;
};

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
    } = props;

    const gridRef = useRef<AgGridReact>(null);
    const firstTimeDataLoaded = useRef(true);
    const firstTimeOnBodyScroll = useRef(true);
    const dataIsLoading = useRef(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const totalHeight = footer ? heightProps + footerHeight : heightProps;
    const tableHeight = footer ? heightProps - footerHeight : heightProps;
    const datasourceRef = useRef<{
      getRows: (params: IGetRowsParams) => void;
    }>();
    const notifyColumnChanges = useRef(false);
    const firstTimeResized = useRef(false);

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

    const getSortedFields = useCallback(():
      | Record<string, SortDirection>
      | undefined => {
      const state = gridRef?.current?.api.getColumnState()!;

      const columnsWithSort = state.filter((col) => col.sort);
      if (columnsWithSort.length === 0) {
        return undefined;
      }
      const sortFields = columnsWithSort.reduce(
        (acc, col) => ({
          ...acc,
          [col.colId]: col.sort,
        }),
        {},
      );

      return sortFields;
    }, []);

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
        maxWidth: 50,
        resizable: false,
        field: CHECKBOX_COLUMN,
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

      const restOfColumns: ColDef[] = columns.map((column) => ({
        field: column.key,
        sortable: column.isSortable,
        headerName: column.title,
        cellRenderer: column.render
          ? (cell: any) => column.render(cell.value)
          : undefined,
      }));

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
      totalRows,
      selectedRowKeys?.length,
      onSelectionCheckboxClicked,
      strings,
      applyAndUpdateNewState,
      applyAutoFitState,
      onColumnsChangedProps,
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
          dataIsLoading.current = true;
          const { startRow, endRow } = params;
          if (startRow === 0) {
            gridRef.current?.api.showLoadingOverlay();
          }
          const data = await onRequestData({
            startRow,
            endRow,
            sortFields: getSortedFields(),
          });

          if (!data) {
            throw new Error("Data is undefined");
          }

          let lastRow = -1;
          if (data.length < endRow - startRow) {
            lastRow = startRow + data.length;
          }

          // We must call onRowStatus for each item of the data array and merge the result
          // with the data array
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
          gridRef.current?.api.hideOverlay();
          if (firstTimeDataLoaded.current) {
            firstTimeDataLoaded.current = false;
            scrollToSavedPosition();
          }
        } catch (error) {
          dataIsLoading.current = false;
          params.failCallback();
          gridRef.current?.api.hideOverlay();
        }
      },
      [
        onRequestData,
        getSortedFields,
        hasStatusColumn,
        selectedRowKeys,
        columnsPersistedStateRef,
        memoizedOnRowStatus,
        updateSelectedRowKeys,
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
        onRowSelectionChange?.([
          ...selectedKeys,
          ...rowKeysInSelectedRowKeysButNotInAllNodes,
        ]);
      },
      [getAllNodeKeys, onRowSelectionChange, selectedRowKeys],
    );

    const rowStyle = useMemo(() => {
      return {
        cursor: "pointer",
      };
    }, []);

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
            rowModelType={"infinite"}
            cacheBlockSize={30}
            onSelectionChanged={onSelectionChanged}
            cacheOverflowSize={2}
            maxConcurrentDatasourceRequests={1}
            infiniteInitialRowCount={totalRows}
            onGridReady={onGridReady}
            onBodyScroll={debouncedOnBodyScroll}
            blockLoadDebounceMillis={DEBOUNCE_TIME}
            suppressDragLeaveHidesColumns={true}
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
