import {
  forwardRef,
  memo,
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
  FirstDataRenderedEvent,
  GridReadyEvent,
  IGetRowsParams,
  RowDoubleClickedEvent,
  SortDirection,
} from "ag-grid-community";
import { TableProps } from "@/types";
import { useDeepArrayMemo } from "@/hooks/useDeepArrayMemo";
import { HeaderCheckbox } from "./HeaderCheckbox";
import { useRowSelection } from "./useRowSelection";
import { areStatesEqual, useColumnState } from "./useColumnState";
import { CHECKBOX_COLUMN, STATUS_COLUMN } from "./columnStateHelper";

const DEBOUNCE_TIME = 50;
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
  onGetSelectedRowKeys?: () => any[] | undefined;
  totalRows?: number;
  allRowSelectedMode?: boolean;
  onAllRowSelectedModeChange?: (allRowSelectedMode: boolean) => void;
  footer?: React.ReactNode;
  footerHeight?: number;
  hasStatusColumn?: boolean;
  onRowStatus?: (item: any) => any;
  statusComponent?: (status: any) => React.ReactNode;
};

export type InfiniteTableRef = {
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
      onGetSelectedRowKeys,
      totalRows = DEFAULT_TOTAL_ROWS_VALUE,
      onAllRowSelectedModeChange,
      allRowSelectedMode: allRowSelectedModeProps,
      footer,
      footerHeight = 50,
      onRowStatus,
      statusComponent,
      hasStatusColumn = false,
    } = props;

    const gridRef = useRef<AgGridReact>(null);
    const firstTimeOnBodyScroll = useRef(true);
    const allRowSelectedModeRef = useRef<boolean>(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const totalHeight = footer ? heightProps + footerHeight : heightProps;
    const tableHeight = footer ? heightProps - footerHeight : heightProps;

    useImperativeHandle(ref, () => ({
      unselectAll: () => {
        setSelectedRowKeysPendingToRender([]);
        gridRef.current?.api?.deselectAll();
      },
      refresh: () => {
        gridRef.current?.api?.purgeInfiniteCache();
      },
    }));

    const {
      onHeaderCheckboxChange,
      onSelectionChangedDebounced,
      selectedRowKeysPendingToRender,
      allRowSelectedMode,
      internalSelectedRowKeys,
      setSelectedRowKeysPendingToRender,
    } = useRowSelection({
      gridRef,
      onRowSelectionChange,
      onAllRowSelectedModeChange,
      totalRows,
      allRowSelectedModeProps,
    });

    useEffect(() => {
      allRowSelectedModeRef.current = allRowSelectedMode;
    }, [allRowSelectedMode]);

    const columns = useDeepArrayMemo(columnsProps, "key");

    const {
      loadPersistedColumnState,
      columnsPersistedStateRef,
      applyAndUpdateNewState,
    } = useColumnState({
      gridRef,
      containerRef,
      hasStatusColumn,
      columns,
      onGetColumnsState,
    });

    const onColumnChanged = useCallback(() => {
      const state = gridRef?.current?.api.getColumnState();
      if (!state) {
        return;
      }
      if (areStatesEqual(state, columnsPersistedStateRef.current)) {
        return;
      }
      applyAndUpdateNewState(state);
      onColumnsChangedProps?.(state);
    }, [
      applyAndUpdateNewState,
      columnsPersistedStateRef,
      onColumnsChangedProps,
    ]);

    const onColumnMoved = useCallback(() => {
      onColumnChanged();
    }, [onColumnChanged]);

    const onColumnResized = useCallback(
      (event: ColumnResizedEvent) => {
        if (!event.finished) {
          return;
        }
        onColumnChanged();
      },
      [onColumnChanged],
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
            selectedRowKeysLength={internalSelectedRowKeys.length}
            allRowSelected={
              totalRows === internalSelectedRowKeys.length && totalRows > 0
            }
            allRowSelectedMode={allRowSelectedMode}
            onHeaderCheckboxChange={onHeaderCheckboxChange}
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
        headerComponent: () => null,
        cellRenderer: (cell: any) => statusComponent?.(cell.value),
      } as ColDef;

      const finalColumns = [
        checkboxColumn,
        ...(hasStatusColumn ? [statusColumn] : []),
        ...restOfColumns,
      ];

      return finalColumns;
    }, [
      allRowSelectedMode,
      columns,
      columnsPersistedStateRef,
      hasStatusColumn,
      internalSelectedRowKeys.length,
      onHeaderCheckboxChange,
      statusComponent,
      totalRows,
    ]);

    const getRows = useCallback(
      async (params: IGetRowsParams) => {
        gridRef.current?.api.showLoadingOverlay();
        const { startRow, endRow } = params;
        const data = await onRequestData({
          startRow,
          endRow,
          sortFields: getSortedFields(),
        });
        if (!data) {
          params.failCallback();
          return;
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
                const status = await onRowStatus?.(item);
                return {
                  ...item,
                  $status: status,
                };
              }),
            )
          : data;

        params.successCallback(finalData, lastRow);
        if (allRowSelectedModeRef.current) {
          gridRef?.current?.api.forEachNode((node) => {
            node.setSelected(true);
          });
        } else {
          const selectedRowKeys = onGetSelectedRowKeys?.();
          setSelectedRowKeysPendingToRender(selectedRowKeys || []);

          if (selectedRowKeys && selectedRowKeys.length > 0) {
            gridRef?.current?.api.forEachNode((node) => {
              if (node?.data?.id && selectedRowKeys.includes(node.data.id)) {
                // remove from selectedRowKeysPendingToRender
                node.setSelected(true);
                setSelectedRowKeysPendingToRender(
                  selectedRowKeysPendingToRender.filter(
                    (key) => node.data.id && key !== node.data.id,
                  ),
                );
              }
            });
          }
        }
        gridRef.current?.api.hideOverlay();
      },
      [
        getSortedFields,
        hasStatusColumn,
        onGetSelectedRowKeys,
        onRequestData,
        onRowStatus,
        selectedRowKeysPendingToRender,
        setSelectedRowKeysPendingToRender,
      ],
    );

    const onGridReady = useCallback(
      (params: GridReadyEvent) => {
        loadPersistedColumnState();
        params.api.setGridOption("datasource", {
          getRows,
        });
      },
      [getRows, loadPersistedColumnState],
    );

    const onRowDoubleClicked = useCallback(
      ({ data: item }: RowDoubleClickedEvent) => {
        onRowDoubleClick?.(item);
      },
      [onRowDoubleClick],
    );

    const onFirstDataRendered = useCallback(
      (params: FirstDataRenderedEvent) => {
        const firstVisibleRowIndex = onGetFirstVisibleRowIndex?.();
        if (firstVisibleRowIndex) {
          params.api.ensureIndexVisible(firstVisibleRowIndex, "top");
        }
      },
      [onGetFirstVisibleRowIndex],
    );

    const onBodyScroll = useCallback(
      (params: BodyScrollEvent) => {
        if (!firstTimeOnBodyScroll.current) {
          onChangeFirstVisibleRowIndex?.(
            params.api.getFirstDisplayedRowIndex(),
          );
        }
        firstTimeOnBodyScroll.current = false;
      },
      [onChangeFirstVisibleRowIndex],
    );

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
            onRowDoubleClicked={onRowDoubleClicked}
            rowStyle={{
              cursor: onRowDoubleClick ? "pointer" : "auto",
            }}
            getRowStyle={onRowStyle}
            suppressCellFocus={true}
            suppressRowClickSelection={true}
            rowBuffer={0}
            rowSelection={"multiple"}
            onDragStopped={onColumnMoved}
            onColumnResized={onColumnResized}
            rowModelType={"infinite"}
            cacheBlockSize={200}
            onSelectionChanged={onSelectionChangedDebounced}
            cacheOverflowSize={2}
            maxConcurrentDatasourceRequests={1}
            infiniteInitialRowCount={50}
            maxBlocksInCache={10}
            onGridReady={onGridReady}
            onFirstDataRendered={onFirstDataRendered}
            onBodyScroll={onBodyScroll}
            blockLoadDebounceMillis={DEBOUNCE_TIME}
            suppressDragLeaveHidesColumns={true}
            onSortChanged={onColumnChanged}
          />
        </div>
        {footer && <div style={{ height: footerHeight }}>{footer}</div>}
      </div>
    );
  },
);

InfiniteTableComp.displayName = "InfiniteTable";

export const InfiniteTable = memo(InfiniteTableComp);
