import {
  forwardRef,
  memo,
  ReactNode,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  CSSProperties,
} from "react";
import { AgGridReact } from "ag-grid-react";
import "ag-grid-community/styles/ag-grid.css";
import "../../styles/ag-theme-quartz.css";
import {
  ColDef,
  ColumnState,
  GridReadyEvent,
  RowDoubleClickedEvent,
  RowSelectedEvent,
} from "ag-grid-community";
import type { TableColumn } from "@/types";
import { useDeepArrayMemo } from "@/hooks/useDeepArrayMemo";
import { useColumnState } from "../InfiniteTable/useColumnState";
import {
  CHECKBOX_COLUMN,
  STATUS_COLUMN,
} from "../InfiniteTable/columnStateHelper";
import { ITOptsButton } from "../InfiniteTable/ITOptsButton";
import { useWhyDidYouRender } from "@/hooks/useWhyDidYouRender";
import {
  CheckboxState,
  PaginatedHeaderCheckbox,
} from "./PaginatedHeaderCheckbox";

const DEFAULT_COL_DEF = {
  autoHeight: true,
  wrapText: true,
  sortable: false,
  comparator: () => 0,
  resizable: true,
  maxWidth: 400, // Maximum column width
  minWidth: 100, // Minimum column width to ensure readability
};

export type PaginatedTableProps = {
  dataSource: Array<Record<string, any>>;
  columns: TableColumn[];
  loading: boolean;
  showPointerCursorInRows?: boolean;

  // selectedRowKeys: number[];
  onRowSelectionChange?: (changedRow: {
    id: number;
    selected: boolean;
  }) => void;

  strings?: Record<string, string>;
  height?: number;
  footer?: ReactNode;
  footerHeight?: number;

  hasStatusColumn?: boolean;
  onRowStatus?: (item: any) => any;
  statusComponent?: (status: any) => ReactNode;

  initialColumnState?: ColumnState[];
  onColumnChanged?: (columnsState: ColumnState[]) => void;
  onGetColumnsState?: () => ColumnState[] | undefined;

  onGetFirstVisibleRowIndex?: () => number | undefined;
  onChangeFirstVisibleRowIndex?: (index: number) => void;

  onRowStyle?: (item: Record<string, any>) => CSSProperties;
  onRowDoubleClick?: (item: any) => void;

  headerCheckboxState: CheckboxState;
  onHeaderCheckboxClick: () => void;
  isRowSelected: (id: number) => boolean;
};

export type PaginatedTableRef = {
  setSelectedRows: (keys: number[]) => void;
  selectAll: () => void;
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
      onRowSelectionChange: onRowSelectionChangeProps,
      height: heightProps = 600,
      onRowStyle,
      onColumnChanged: onColumnsChangedProps,
      onGetColumnsState,
      initialColumnState,
      // selectedRowKeys,
      footer,
      footerHeight = 30,
      onRowStatus,
      statusComponent,
      hasStatusColumn = false,
      strings = {},
      showPointerCursorInRows = true,
      loading,
      onHeaderCheckboxClick,
      headerCheckboxState,
      isRowSelected,
    } = props;

    useWhyDidYouRender("PaginatedTable", props);

    const gridRef = useRef<AgGridReact>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const totalHeight = footer ? heightProps + footerHeight : heightProps;
    const tableHeight = footer ? heightProps - footerHeight : heightProps;
    const notifyColumnChanges = useRef(false);
    const previousLoadingRef = useRef(loading);

    // const updateSelectedRowKeys = useCallback(() => {
    //   gridRef.current?.api?.forEachNode((node) => {
    //     if (node?.data?.id && selectedRowKeys.includes(node.data.id)) {
    //       node.setSelected(true);
    //     }
    //   });
    // }, [selectedRowKeys]);

    // useDeepCompareEffect(() => {
    //   updateSelectedRowKeys();
    // }, [selectedRowKeys]);

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
      selectAll: () => {
        gridRef.current?.api?.selectAll();
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

    const MemoizedStatusComponent = useMemo(() => {
      if (!statusComponent) return undefined;
      // eslint-disable-next-line react/display-name
      return memo((props: { status: any }) => statusComponent(props.status));
    }, [statusComponent]);

    const colDefs = useMemo((): ColDef[] => {
      const checkboxColumn = {
        ...DEFAULT_COL_DEF,
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
          <PaginatedHeaderCheckbox
            state={headerCheckboxState}
            onClick={onHeaderCheckboxClick}
          />
        ),
      } as ColDef;

      const restOfColumns: ColDef[] = columns.map((column) => {
        return {
          ...DEFAULT_COL_DEF,
          field: column.key,
          sortable: column.isSortable,
          headerName: column.title,
          comparator: column.comparator,
          cellRenderer: column.render
            ? (cell: any) => column.render(cell.value)
            : undefined,
        };
      });

      const statusColumn = {
        ...DEFAULT_COL_DEF,
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
              gridRef.current?.api.resetColumnState();
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
      columns,
      MemoizedStatusComponent,
      headerCheckboxState,
      onHeaderCheckboxClick,
      strings,
      onColumnsChangedProps,
    ]);

    useEffect(() => {
      if (loading) {
        gridRef.current?.api?.showLoadingOverlay();
      }

      if (previousLoadingRef.current === true && loading === false) {
        console.log("Loading state changed from true to false");
        gridRef.current?.api?.forEachNode((node) => {
          if (node.data.id) {
            node.setSelected(isRowSelected(node.data.id));
          }
        });
      }

      previousLoadingRef.current = loading;
    }, [loading]);

    const onGridReady = useCallback(
      (params: GridReadyEvent) => {
        if (loading) {
          params.api.showLoadingOverlay();
        }
        // } else {
        //   params.api.hideOverlay();
        // }

        // gridRef.current?.api?.forEachNode((node) => {
        //   if (
        //     node?.data?.id &&
        //     internalSelectionRowKeys.includes(node.data.id)
        //   ) {
        //     node.setSelected(true);
        //   }
        // });
      },
      [loading],
    );

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

    const onRowSelectionChange = useCallback(
      (event: RowSelectedEvent) => {
        if (event.source === "checkboxSelected" && event.node.data.id) {
          const changedRow = {
            id: event.node.data.id,
            selected: event.node.isSelected() || false,
          };
          console.log("Row selection changed:", changedRow);
          onRowSelectionChangeProps?.(changedRow);
        }
      },
      [onRowSelectionChangeProps],
    );

    const rowStyle = useMemo(() => {
      return {
        cursor: showPointerCursorInRows ? "pointer" : "default",
      };
    }, [showPointerCursorInRows]);

    const memoizedDataSource = useMemo(() => {
      if (!hasStatusColumn || !onRowStatus) {
        return dataSource;
      }
      return dataSource.map((item) => ({
        ...item,
        $status: onRowStatus(item),
      }));
    }, [dataSource, hasStatusColumn, onRowStatus]);

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
            rowData={memoizedDataSource}
            onRowDoubleClicked={memoizedOnRowDoubleClick}
            suppressCellFocus={true}
            suppressRowClickSelection={true}
            rowBuffer={5}
            rowSelection={"multiple"}
            onRowSelected={onRowSelectionChange}
            suppressDragLeaveHidesColumns={true}
            onGridReady={onGridReady}
            // onSortChanged={(event) => {
            //   const columnState = event.api.getColumnState();
            //   const sortedColumns = columnState.filter((col) => col.sort);
            //   if (sortedColumns.length > 0) {
            //     const { colId, sort } = sortedColumns[0];
            //     const newSorter = {
            //       id: colId,
            //       desc: sort === "desc",
            //     };
            //     console.log("Sorted column:", colId, "Direction:", sort);
            //     onChangeSort?.(newSorter);
            //   } else {
            //     console.log("No column is currently sorted");
            //     onChangeSort?.(undefined);
            //   }
            // }}
            suppressMultiSort={true}
            getRowHeight={undefined}
            getRowId={(params) => String(params.data.id)}
            onFirstDataRendered={(event) => {
              gridRef.current?.api?.hideOverlay();
              console.log("onFirstDataRendered");

              // event.api.forEachNode((node) => {
              //   if (node.data.id) {
              //     node.setSelected(isRowSelected(node.data.id));
              //   }
              // });

              applyAutoFitState();
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

export const PaginatedTable: React.FC<
  PaginatedTableProps & { ref?: React.Ref<PaginatedTableRef> }
> = memo(PaginatedTableComp);
