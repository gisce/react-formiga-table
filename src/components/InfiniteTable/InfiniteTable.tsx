import {
  forwardRef,
  memo,
  useCallback,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
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
import { HeaderCheckbox } from "./HeaderCheckbox";
import { useDeepCompareMemo } from "use-deep-compare";

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
      totalRows,
    } = props;

    const gridRef = useRef<AgGridReact>(null);
    const [internalSelectedRowKeys, setInternalSelectedRowKeys] = useState<
      any[]
    >([]);
    const [allRowSelected, setAllRowSelected] = useState<boolean>(false);
    const allRowSelectedRef = useRef<boolean>(allRowSelected);
    const selectedRowKeysPendingToRender = useRef<any[]>([]);
    const firstTimeOnBodyScroll = useRef(true);

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
        selectedRowKeysPendingToRender.current = [];
        gridRef.current?.api?.deselectAll();
      },
      refresh: () => {
        gridRef.current?.api?.purgeInfiniteCache();
      },
    }));

    const columns = useDeepArrayMemo(columnsProps, "key");

    useWhyDidYouRender("InfiniteTableComp", props);

    const defaultColDef = useMemo<ColDef>(() => ({}), []);

    const onHeaderCheckboxChange = useCallback(() => {
      // Check if all rows are currently selected or if the selection count matches total rows
      const allRowsSelected =
        allRowSelectedRef.current ||
        totalRows === internalSelectedRowKeys.length;

      // Determine the new selection state based on current conditions
      let newAllSelectedState = false;
      if (!allRowsSelected && internalSelectedRowKeys.length === 0) {
        newAllSelectedState = true; // No rows are selected and selection should be toggled to all
      } else if (
        allRowsSelected ||
        (internalSelectedRowKeys.length > 0 && !allRowSelectedRef.current)
      ) {
        newAllSelectedState = false; // Either all are selected or some are selected but not all
      }

      // Apply the determined state to all nodes
      gridRef?.current?.api.forEachNode((node) => {
        node.setSelected(newAllSelectedState);
      });

      // Update state references to reflect the new state
      allRowSelectedRef.current = newAllSelectedState;
      setAllRowSelected(newAllSelectedState);
    }, [internalSelectedRowKeys.length, totalRows]);

    const colDefs = useDeepCompareMemo((): ColDef[] => {
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
              allRowSelected={allRowSelected}
              onHeaderCheckboxChange={onHeaderCheckboxChange}
            />
          ),
        },
        ...columns.map((column) => ({
          field: column.key,
          headerName: column.title,
          cellRenderer: column.render
            ? (cell: any) => column.render(cell.value)
            : undefined,
        })),
      ];
    }, [
      allRowSelected,
      columns,
      internalSelectedRowKeys.length,
      onHeaderCheckboxChange,
      totalRows,
    ]);

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
              if (allRowSelectedRef.current) {
                node.setSelected(true);
                return;
              }
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

    const onSelectionChanged = useCallback(
      (event: { api: { getSelectedNodes: () => any } }) => {
        const allSelectedNodes = event.api.getSelectedNodes();
        let selectedKeys = allSelectedNodes.map(
          (node: { data: any }) => node.data.id,
        );
        // merge the pending selected rows
        selectedKeys = selectedKeys.concat(
          selectedRowKeysPendingToRender.current,
        );
        onRowSelectionChange?.(selectedKeys);
        setInternalSelectedRowKeys(selectedKeys);
      },
      [onRowSelectionChange],
    );

    // eslint-disable-next-line react-hooks/exhaustive-deps
    const onSelectionChangedDebounced = useCallback(
      debounce((event: { api: { getSelectedNodes: () => any } }) => {
        onSelectionChanged?.(event);
      }, DEBOUNCE_TIME),
      [onSelectionChanged],
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
    );
  },
);

InfiniteTableComp.displayName = "InfiniteTable";

export const InfiniteTable = memo(InfiniteTableComp);
