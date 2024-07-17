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
  ColumnMovedEvent,
  ColumnResizedEvent,
  ColumnState,
  FirstDataRenderedEvent,
  GridReadyEvent,
  IGetRowsParams,
  RowDoubleClickedEvent,
} from "ag-grid-community";
import { TableProps } from "@/types";
import { useDeepArrayMemo } from "@/hooks/useDeepArrayMemo";
import debounce from "lodash/debounce";
import { HeaderCheckbox } from "./HeaderCheckbox";
import { useRowSelection } from "./useRowSelection";
import { useAutoFitColumns } from "./useAutoFitColumns";
import { getPersistedColumnState } from "./columnStateHelper";

const DEBOUNCE_TIME = 50;

export type InfiniteTableProps = Omit<
  TableProps,
  "dataSource" & "loading" & "loadingComponent" & "height"
> & {
  onRequestData: (startRow: number, endRow: number) => Promise<any[]>;
  height?: number;
  onColumnChanged?: (columnsState: ColumnState[]) => void;
  onGetColumnsState?: () => ColumnState[] | undefined;
  onGetFirstVisibleRowIndex?: () => number | undefined;
  onChangeFirstVisibleRowIndex?: (index: number) => void;
  onGetSelectedRowKeys?: () => any[] | undefined;
  totalRows: number;
  allRowSelectedMode?: boolean;
  onAllRowSelectedModeChange?: (allRowSelectedMode: boolean) => void;
  footer?: React.ReactNode;
  footerHeight?: number;
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
      totalRows,
      onAllRowSelectedModeChange,
      allRowSelectedMode: allRowSelectedModeProps,
      footer,
      footerHeight = 50,
    } = props;

    const gridRef = useRef<AgGridReact>(null);
    const firstTimeOnBodyScroll = useRef(true);
    const allRowSelectedModeRef = useRef<boolean>(false);
    const columnsPersistedStateRef = useRef<any>();
    const containerRef = useRef<HTMLDivElement>(null);
    const columnChangeListenerReady = useRef(false);
    const totalHeight = footer ? heightProps + footerHeight : heightProps;
    const tableHeight = footer ? heightProps - footerHeight : heightProps;

    const { autoSizeColumnsIfNecessary } = useAutoFitColumns({
      gridRef,
      containerRef,
      columnsPersistedStateRef,
    });

    // eslint-disable-next-line react-hooks/exhaustive-deps
    const debouncedOnColumnChanged = useCallback(
      debounce((state) => {
        if (!columnChangeListenerReady.current) {
          columnChangeListenerReady.current = true;
          return;
        }
        onColumnsChangedProps?.(state);
      }, DEBOUNCE_TIME),
      [onColumnsChangedProps],
    );

    const onColumnChanged = useCallback(
      (event: ColumnResizedEvent | ColumnMovedEvent) => {
        const state = event.api.getColumnState();
        debouncedOnColumnChanged(state);
      },
      [debouncedOnColumnChanged],
    );

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

    const defaultColDef = useMemo<ColDef>(() => ({}), []);

    const colDefs = useMemo((): ColDef[] => {
      return [
        {
          checkboxSelection: true,
          suppressMovable: true,
          sortable: false,
          lockPosition: true,
          pinned: "left",
          maxWidth: 50,
          resizable: false,
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
        },
        ...columns.map((column) => ({
          field: column.key,
          sortable: false,
          headerName: column.title,
          cellRenderer: column.render
            ? (cell: any) => column.render(cell.value)
            : undefined,
        })),
      ];
    }, [
      allRowSelectedMode,
      columns,
      internalSelectedRowKeys.length,
      onHeaderCheckboxChange,
      totalRows,
    ]);

    const getRows = useCallback(
      async (params: IGetRowsParams) => {
        gridRef.current?.api.showLoadingOverlay();
        const { startRow, endRow } = params;
        const data = await onRequestData(startRow, endRow);
        let lastRow = -1;
        if (data.length < endRow - startRow) {
          lastRow = startRow + data.length;
        }
        params.successCallback(data, lastRow);
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
        autoSizeColumnsIfNecessary();
      },
      [
        autoSizeColumnsIfNecessary,
        onGetSelectedRowKeys,
        onRequestData,
        selectedRowKeysPendingToRender,
        setSelectedRowKeysPendingToRender,
      ],
    );

    const onGridReady = useCallback(
      (params: GridReadyEvent) => {
        columnsPersistedStateRef.current = getPersistedColumnState({
          actualColumnKeys: columns.map((column) => column.key),
          persistedColumnState: onGetColumnsState?.(),
        });
        if (columnsPersistedStateRef.current) {
          params.api.applyColumnState({
            state: columnsPersistedStateRef.current,
            applyOrder: true,
          });
        }

        params.api.setGridOption("datasource", {
          getRows,
        });
      },
      [columns, getRows, onGetColumnsState],
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
            defaultColDef={defaultColDef}
            onRowDoubleClicked={onRowDoubleClicked}
            rowStyle={{
              cursor: onRowDoubleClick ? "pointer" : "auto",
            }}
            getRowStyle={onRowStyle}
            suppressCellFocus={true}
            suppressRowClickSelection={true}
            rowBuffer={0}
            rowSelection={"multiple"}
            onColumnMoved={onColumnChanged}
            onColumnResized={onColumnChanged}
            rowModelType={"infinite"}
            cacheBlockSize={20}
            onSelectionChanged={onSelectionChangedDebounced}
            cacheOverflowSize={2}
            maxConcurrentDatasourceRequests={1}
            infiniteInitialRowCount={50}
            maxBlocksInCache={10}
            onGridReady={onGridReady}
            onFirstDataRendered={onFirstDataRendered}
            onBodyScroll={onBodyScroll}
            blockLoadDebounceMillis={DEBOUNCE_TIME}
          />
        </div>
        {footer && (
          <div style={{ height: footerHeight, backgroundColor: "red" }}>
            {footer}
          </div>
        )}
      </div>
    );
  },
);

InfiniteTableComp.displayName = "InfiniteTable";

export const InfiniteTable = memo(InfiniteTableComp);
