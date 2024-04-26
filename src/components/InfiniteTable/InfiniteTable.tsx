import {
  forwardRef,
  memo,
  useCallback,
  useImperativeHandle,
  useMemo,
  useRef,
} from "react";
import { AgGridReact } from "ag-grid-react";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-quartz.css";
import {
  BodyScrollEvent,
  ColDef,
  ColumnMovedEvent,
  ColumnResizedEvent,
  ColumnState,
  FirstDataRenderedEvent,
  GridReadyEvent,
  IDatasource,
  RowDoubleClickedEvent,
} from "ag-grid-community";
import { TableProps } from "@/types";
import { useDeepArrayMemo } from "@/hooks/useDeepArrayMemo";
import { useWhyDidYouRender } from "@/hooks/useWhyDidYouRender";
import debounce from "lodash/debounce";
import throttle from "lodash/throttle";

const DEBOUNCE_TIME = 500;

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
      height,
      onRowStyle,
      onColumnChanged: onColumnsChangedProps,
      onGetColumnsState,
      onChangeFirstVisibleRowIndex,
      onGetFirstVisibleRowIndex,
      onGetSelectedRowKeys,
    } = props;

    const gridRef = useRef<AgGridReact>(null);

    // eslint-disable-next-line react-hooks/exhaustive-deps
    const debouncedOnColumnChanged = useCallback(
      debounce((state) => {
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
        gridRef.current?.api?.deselectAll();
      },
      refresh: () => {
        gridRef.current?.api?.purgeInfiniteCache();
      },
    }));

    const columns = useDeepArrayMemo(columnsProps, "key");

    useWhyDidYouRender("InfiniteTableComp", props);

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
        },
        ...columns.map((column) => ({
          field: column.key,
          headerName: column.title,
          cellRenderer: column.render
            ? (cell: any) => column.render(cell.value)
            : undefined,
        })),
      ];
    }, [columns]);

    const selectedRowKeysPendingToRender = useRef<any[]>([]);
    const firstTimeOnBodyScroll = useRef(true);

    const createDatasource = useCallback(
      (): IDatasource => ({
        getRows: async (params) => {
          gridRef.current?.api.showLoadingOverlay();
          const { startRow, endRow } = params;
          const data = await onRequestData(startRow, endRow);
          let lastRow = -1;
          if (data.length < endRow - startRow) {
            lastRow = startRow + data.length;
          }
          params.successCallback(data, lastRow);

          const selectedRowKeys = onGetSelectedRowKeys?.();
          selectedRowKeysPendingToRender.current = selectedRowKeys || [];

          if (selectedRowKeys && selectedRowKeys.length > 0) {
            gridRef?.current?.api.forEachNode((node) => {
              if (node?.data?.id && selectedRowKeys.includes(node.data.id)) {
                node.setSelected(true);
                // remove from selectedRowKeysPendingToRender
                selectedRowKeysPendingToRender.current =
                  selectedRowKeysPendingToRender.current.filter(
                    (key) => node.data.id && key !== node.data.id,
                  );
              }
            });
          }
          gridRef.current?.api.hideOverlay();
        },
      }),
      [onGetSelectedRowKeys, onRequestData],
    );

    const onGridReady = useCallback(
      (params: GridReadyEvent) => {
        const savedState = onGetColumnsState?.();
        if (savedState) {
          params.api.applyColumnState({
            state: savedState,
            applyOrder: true,
          });
        }

        params.api.setGridOption("datasource", createDatasource());
      },
      [createDatasource, onGetColumnsState],
    );

    // eslint-disable-next-line react-hooks/exhaustive-deps
    const onSelectionChanged = useCallback(
      (event: { api: { getSelectedNodes: () => any } }) => {
        // if (!firstTimeSelectionSet) {
        //   return;
        // }
        // firstTimeSelectionSet.current = false;
        //
        console.log("onSelectionChanged");
        const allSelectedNodes = event.api.getSelectedNodes();
        console.log({ allSelectedNodes });
        let selectedKeys = allSelectedNodes.map(
          (node: { data: any }) => node.data.id,
        );
        // merge the pending selected rows
        selectedKeys = selectedKeys.concat(
          selectedRowKeysPendingToRender.current,
        );
        onRowSelectionChange?.(selectedKeys);
      },
      [onRowSelectionChange],
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
        className={`ag-grid-default-table ag-theme-quartz`}
        style={{ height: height || 600 }}
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
          onSelectionChanged={onSelectionChanged}
          cacheOverflowSize={2}
          maxConcurrentDatasourceRequests={1}
          infiniteInitialRowCount={50}
          maxBlocksInCache={10}
          onGridReady={onGridReady}
          onFirstDataRendered={onFirstDataRendered}
          onBodyScroll={onBodyScroll}
        />
      </div>
    );
  },
);

InfiniteTableComp.displayName = "InfiniteTable";

export const InfiniteTable = memo(InfiniteTableComp);
