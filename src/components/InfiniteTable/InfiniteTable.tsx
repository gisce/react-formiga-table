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
import { useColumnState } from "./useColumnState";
import { CHECKBOX_COLUMN, STATUS_COLUMN } from "./columnStateHelper";

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
      totalRows,
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
    const columnChangeListenerReady = useRef(false);
    const totalHeight = footer ? heightProps + footerHeight : heightProps;
    const tableHeight = footer ? heightProps - footerHeight : heightProps;

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
      (e: any) => {
        console.log({ e });
        const state = gridRef?.current?.api.getColumnState();
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

    const { applyColumnState } = useColumnState({
      gridRef,
      containerRef,
      hasStatusColumn,
      columns,
      onGetColumnsState,
    });

    const defaultColDef = useMemo<ColDef>(() => ({}), []);

    const colDefs = useMemo((): ColDef[] => {
      const checkboxColumn = {
        checkboxSelection: true,
        suppressMovable: true,
        sortable: false,
        lockPosition: true,
        pinned: "left",
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

      const restOfColumns = columns.map((column) => ({
        field: column.key,
        sortable: false,
        headerName: column.title,
        cellRenderer: column.render
          ? (cell: any) => column.render(cell.value)
          : undefined,
      }));

      const statusColumn = {
        field: STATUS_COLUMN,
        suppressMovable: true,
        sortable: false,
        lockPosition: true,
        maxWidth: 30,
        pinned: "left",
        resizable: false,
        headerComponent: () => null,
        cellRenderer: (cell: any) => statusComponent?.(cell.value),
      } as ColDef;

      return [
        checkboxColumn,
        ...(hasStatusColumn ? [statusColumn] : []),
        ...restOfColumns,
      ];
    }, [
      allRowSelectedMode,
      columns,
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
        const data = await onRequestData(startRow, endRow);
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
        applyColumnState();
      },
      [
        applyColumnState,
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
        params.api.setGridOption("datasource", {
          getRows,
        });
      },
      [getRows],
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
            // onDragStopped={onColumnChanged}
            // onColumnMoved={onColumnChanged}
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
        {footer && <div style={{ height: footerHeight }}>{footer}</div>}
      </div>
    );
  },
);

InfiniteTableComp.displayName = "InfiniteTable";

export const InfiniteTable = memo(InfiniteTableComp);
