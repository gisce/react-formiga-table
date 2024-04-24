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
  ColDef,
  GridReadyEvent,
  IDatasource,
  RowDoubleClickedEvent,
} from "ag-grid-community";
import { TableProps } from "@/types";
import { useDeepArrayMemo } from "@/hooks/useDeepArrayMemo";
import { useWhyDidYouRender } from "@/hooks/useWhyDidYouRender";

export type InfiniteTableProps = Omit<
  TableProps,
  "dataSource" & "loading" & "loadingComponent" & "height"
> & {
  onRequestData: (startRow: number, endRow: number) => Promise<any[]>;
  height?: number;
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
    } = props;

    const gridRef = useRef<AgGridReact>(null);

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
          gridRef.current?.api.hideOverlay();
        },
      }),
      [onRequestData],
    );

    const onGridReady = useCallback(
      (params: GridReadyEvent) => {
        params.api.setGridOption("datasource", createDatasource());
      },
      [createDatasource],
    );

    const onSelectionChanged = useCallback(
      (event: { api: { getSelectedNodes: () => any } }) => {
        const allSelectedNodes = event.api.getSelectedNodes();
        const selectedData = allSelectedNodes.map(
          (node: { data: any }) => node.data,
        );
        onRowSelectionChange?.(selectedData);
      },
      [onRowSelectionChange],
    );

    const onRowDoubleClicked = useCallback(
      ({ data: item }: RowDoubleClickedEvent) => {
        onRowDoubleClick?.(item);
      },
      [onRowDoubleClick],
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
          rowModelType={"infinite"}
          cacheBlockSize={20}
          onSelectionChanged={onSelectionChanged}
          cacheOverflowSize={2}
          maxConcurrentDatasourceRequests={1}
          infiniteInitialRowCount={50}
          maxBlocksInCache={10}
          onGridReady={onGridReady}
        />
      </div>
    );
  },
);

InfiniteTableComp.displayName = "InfiniteTable";

export const InfiniteTable = memo(InfiniteTableComp);
