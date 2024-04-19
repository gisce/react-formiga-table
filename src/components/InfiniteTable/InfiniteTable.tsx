import { memo, useCallback, useMemo } from "react";
import { AgGridReact, CustomCellRendererProps } from "ag-grid-react";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-quartz.css";
import {
  ColDef,
  GridReadyEvent,
  IDatasource,
  RowDoubleClickedEvent,
  SelectionChangedEvent,
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

const InfiniteTableWrapper = (props: InfiniteTableProps) => {
  const { columns } = props;
  const columnsMemoized = useDeepArrayMemo(columns, "key");

  return (
    <InfiniteTableComp
      {...props}
      // dataSource={dataSourceMemoized}
      columns={columnsMemoized}
    />
  );
};

// Create new GridExample component
const InfiniteTableComp = (props: InfiniteTableProps) => {
  const {
    onRequestData,
    columns,
    onRowDoubleClick,
    onRowSelectionChange,
    height,
  } = props;

  useWhyDidYouRender("InfiniteTableComp", props);
  const defaultColDef = useMemo<ColDef>(() => {
    return {};
  }, []);

  const colDefs = useMemo((): ColDef[] => {
    return [
      {
        // headerCheckboxSelection: true,
        checkboxSelection: true,
        showDisabledCheckboxes: true,
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
          ? (cell: CustomCellRendererProps) => {
              return column.render?.(cell.value);
            }
          : undefined,
      })),
    ];
  }, [columns]);

  const onGridReady = useCallback(
    (params: GridReadyEvent) => {
      const dataSource: IDatasource = {
        rowCount: undefined,
        getRows: async (rowParams) => {
          params.api.showLoadingOverlay();
          const { startRow, endRow } = rowParams;
          let lastRow = -1;
          const data = await onRequestData(startRow, endRow);

          if (data.length < endRow - startRow) {
            lastRow = startRow + data.length;
          }
          rowParams.successCallback(data, lastRow);
          params.api.hideOverlay();
        },
      };
      params.api.setGridOption("datasource", dataSource);
    },
    [onRequestData],
  );

  const onRowDoubleClicked = useCallback(
    ({ data: item }: RowDoubleClickedEvent) => {
      onRowDoubleClick?.(item);
    },
    [onRowDoubleClick],
  );

  const onSelectionChanged = useCallback(
    (event: SelectionChangedEvent) => {
      const allSelectedNodes = event.api.getSelectedNodes();
      const selectedData = allSelectedNodes.map((node) => node.data);
      onRowSelectionChange?.(selectedData);
    },
    [onRowSelectionChange],
  );

  return (
    <div
      className={`ag-grid-default-table ag-theme-quartz`}
      style={{ height: height || 600 }}
    >
      <AgGridReact
        columnDefs={colDefs}
        defaultColDef={defaultColDef}
        onRowDoubleClicked={onRowDoubleClicked}
        rowStyle={{
          cursor: onRowDoubleClick ? "pointer" : "auto",
        }}
        suppressCellFocus={true}
        rowBuffer={0}
        rowSelection={"multiple"}
        rowModelType={"infinite"}
        cacheBlockSize={10}
        cacheOverflowSize={2}
        maxConcurrentDatasourceRequests={1}
        infiniteInitialRowCount={1000}
        maxBlocksInCache={10}
        onGridReady={onGridReady}
      />
    </div>
  );
};

export const InfiniteTable = memo(InfiniteTableWrapper);
