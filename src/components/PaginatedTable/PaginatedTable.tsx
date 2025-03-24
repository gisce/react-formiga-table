import {
  forwardRef,
  memo,
  ReactNode,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import { AgGridReact } from "ag-grid-react";
import "ag-grid-community/styles/ag-grid.css";
import "@/styles/ag-theme-quartz.css";
import {
  BodyScrollEvent,
  ColDef,
  ColumnResizedEvent,
  ColumnState,
  RowDoubleClickedEvent,
  RowSelectedEvent,
  SortChangedEvent,
} from "ag-grid-community";
import type { TableColumn, TableType } from "@/types";
import { useDeepArrayMemo } from "@/hooks/useDeepArrayMemo";
import {
  useColumnState,
  areStatesEqual,
} from "../InfiniteTable/useColumnState";
import {
  CHECKBOX_COLUMN,
  STATUS_COLUMN,
} from "../InfiniteTable/columnStateHelper";
import { ITOptsButton } from "../InfiniteTable/ITOptsButton";
import {
  CheckboxState,
  usePaginatedHeaderCheckbox,
} from "./PaginatedHeaderCheckbox";
import { useDeepCompareMemo } from "use-deep-compare";
import deepEqual from "deep-equal";

const DEFAULT_COL_DEF: ColDef = {
  autoHeight: true,
  wrapText: true,
  sortable: false,
  comparator: () => 0,
  resizable: true,
  minWidth: 100, // Minimum column width to ensure readability
  valueFormatter: () => {
    // To skip warnings, return an empty string, we'll handle ourself the value in the cellRenderer
    return "";
  },
};

export type PaginatedTableProps = {
  dataSource: Array<Record<string, any>>;
  columns: TableColumn[];
  isLoading: boolean;
  showPointerCursorInRows?: boolean;
  initialSortState?: ColumnState[];
  onSortChange?: (state: ColumnState[]) => void;

  onRowSelectionChange?: (changedRow: {
    id: number;
    selected: boolean;
  }) => void;

  strings?: {
    resetTableViewLabel?: string;
    changeToInfiniteLabel?: string;
    changeToPaginatedLabel?: string;
  };
  height?: number;
  footer?: ReactNode;
  footerHeight?: number;

  hasStatusColumn?: boolean;
  onRowStatus?: (item: any) => any;
  statusComponent?: (status: any) => ReactNode;

  onColumnChanged?: (columnsState: ColumnState[]) => void;
  onGetColumnsState?: () => ColumnState[] | undefined;

  onGetFirstVisibleRowIndex?: () => number | undefined;
  onChangeFirstVisibleRowIndex?: (index: number) => void;

  onGetFirstVisibleColumn?: () => string | undefined;
  onChangeFirstVisibleColumn?: (columnId: string) => void;

  onRowStyle?: (item: any) => any;
  onRowDoubleClick?: (item: any) => void;

  headerCheckboxState: CheckboxState;
  onHeaderCheckboxClick: () => void;
  onForceReload?: () => void;
  onChangeTableType?: (targetType: TableType) => void;
};

export type PaginatedTableRef = {
  setSelectedRows: (keys: number[]) => void;
  selectAll: () => void;
  unselectAll: () => void;
  refresh: () => void;
  updateRows: (updates: Array<Record<string, any>>) => void;
  getVisibleRowIds: () => string[];
  getVisibleRows: () => any[];
  refreshRowStyles: () => void;
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
      footer,
      footerHeight = 30,
      onRowStatus,
      statusComponent,
      hasStatusColumn = false,
      strings = {},
      showPointerCursorInRows = true,
      isLoading,
      onHeaderCheckboxClick,
      headerCheckboxState,
      onGetFirstVisibleRowIndex,
      onChangeFirstVisibleRowIndex,
      onGetFirstVisibleColumn,
      onChangeFirstVisibleColumn,
      onForceReload,
      initialSortState,
      onSortChange,
      onChangeTableType,
    } = props;

    const gridRef = useRef<AgGridReact>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const totalHeight = footer ? heightProps + footerHeight : heightProps;
    const tableHeight = footer ? heightProps - footerHeight : heightProps;
    const [dataRendered, setDataRendered] = useState(false);

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

        updates
          .filter((update) => update?.id)
          .forEach((update) => {
            const node = gridRef.current?.api
              .getRenderedNodes()
              .find((node) => node.data?.id === update?.id);
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
      getVisibleRows: () => {
        if (!gridRef.current?.api) return [];
        const visibleNodes = gridRef.current.api.getRenderedNodes();
        return visibleNodes.map((node) => node?.data);
      },
      refreshRowStyles: () => {
        if (!gridRef.current?.api) return;
        gridRef.current.api.redrawRows();
      },
    }));

    const columns = useDeepArrayMemo(columnsProps, "key");

    const { applyAndUpdateNewState, applyAutoFitState } = useColumnState({
      gridRef,
      containerRef,
      columns,
      type: "paginated",
    });

    // Function to restore scroll position (vertical)
    const scrollToRowIndex = useCallback((position: number) => {
      requestAnimationFrame(() => {
        if (gridRef.current?.api) {
          gridRef.current.api.ensureIndexVisible(position, "top");
        }
      });
    }, []);

    const scrollToColumn = useCallback((columnId: string) => {
      requestAnimationFrame(() => {
        if (gridRef.current?.api) {
          gridRef.current.api.ensureColumnVisible(columnId, "start");
        }
      });
    }, []);

    const onDataRendered = useCallback(() => {
      // Only trigger once per data update
      if (!dataRendered) {
        setDataRendered(true);

        const api = gridRef.current?.api;

        if (!isLoading && api && api.getDisplayedRowCount() > 0) {
          const persistedState = onGetColumnsState?.();
          if (persistedState && persistedState.length > 0) {
            gridRef?.current?.api?.applyColumnState({
              state: persistedState,
              applyOrder: true,
            });
          } else {
            applyAutoFitState();
          }

          // Restore vertical scroll
          if (onGetFirstVisibleRowIndex) {
            const firstVisibleRowIndex = onGetFirstVisibleRowIndex();
            if (firstVisibleRowIndex !== undefined) {
              scrollToRowIndex(firstVisibleRowIndex);
            }
          }

          // Restore horizontal scroll
          if (onGetFirstVisibleColumn) {
            const firstVisibleColumn = onGetFirstVisibleColumn();
            if (firstVisibleColumn !== undefined) {
              scrollToColumn(firstVisibleColumn);
            }
          }
        }
      }
    }, [
      dataRendered,
      isLoading,
      onGetColumnsState,
      onGetFirstVisibleRowIndex,
      onGetFirstVisibleColumn,
      applyAutoFitState,
      scrollToRowIndex,
      scrollToColumn,
    ]);

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

    const onBodyScrollEnd = useCallback(
      (params: BodyScrollEvent) => {
        // Ignore first event which is automatically triggered
        if (
          params.top === -1 &&
          params.direction === "horizontal" &&
          params.left === 0
        ) {
          return;
        }
        if (params.direction === "vertical") {
          const index = gridRef.current?.api?.getFirstDisplayedRowIndex();
          index !== undefined && onChangeFirstVisibleRowIndex?.(index);
        } else if (params.direction === "horizontal") {
          // Get all column states which include width information
          const columnStates = gridRef.current?.api?.getColumnState() || [];
          let accumulatedWidth = 0;
          let firstVisibleColumn: string | undefined;

          // Find the first visible column based on scroll position, skipping pinned columns
          for (const column of columnStates) {
            // Skip pinned columns
            if (column.pinned) {
              continue;
            }
            const columnWidth = column.width || 0;
            if (accumulatedWidth + columnWidth > params.left) {
              firstVisibleColumn = column.colId;
              break;
            }
            accumulatedWidth += columnWidth;
          }

          if (firstVisibleColumn) {
            onChangeFirstVisibleColumn?.(firstVisibleColumn);
          }
        }
      },
      [onChangeFirstVisibleRowIndex, onChangeFirstVisibleColumn],
    );

    const MemoizedStatusComponent = useMemo(() => {
      if (!statusComponent) return undefined;
      // eslint-disable-next-line react/display-name
      return memo((propsComp: { status: any }) =>
        statusComponent(propsComp.status),
      );
    }, [statusComponent]);

    const { HeaderComponent } = usePaginatedHeaderCheckbox(
      headerCheckboxState,
      onHeaderCheckboxClick,
    );

    const onResetTableView = useCallback(() => {
      onColumnsChangedProps?.([]);
      onSortChange?.([]);
      onForceReload?.();
    }, [onColumnsChangedProps, onForceReload, onSortChange]);

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
        headerComponent: HeaderComponent,
      } as ColDef;

      const restOfColumns: ColDef[] = columns.map((column) => {
        const initialSort = initialSortState?.find(
          (state) => state.colId === column.key,
        );

        return {
          ...DEFAULT_COL_DEF,
          field: column.key,
          sortable: column.isSortable,
          headerName: column.title,
          sort: initialSort?.sort,
          sortIndex: initialSort?.sortIndex,
          pinned: false,
          cellRenderer: column.render
            ? (cell: any) => column.render(cell.value, cell.data)
            : undefined,
        };
      });

      const storedState = onGetColumnsState?.();
      const storedStateKeys = storedState?.map((col: any) => col.colId);

      storedState &&
        storedStateKeys &&
        restOfColumns.sort((a, b) => {
          const aIndex = storedStateKeys.indexOf(a.field);
          const bIndex = storedStateKeys.indexOf(b.field);
          return aIndex - bIndex;
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
        cellStyle: {
          padding: 0,
          margin: 0,
        },
        headerComponent: () => (
          <ITOptsButton
            resetTableViewLabel={
              strings?.["resetTableViewLabel"] || "resetTableViewLabel"
            }
            currentTableType="paginated"
            onChangeTableType={onChangeTableType}
            changeToInfiniteLabel={
              strings?.["changeToInfiniteLabel"] || "Canviar a llistat infinit"
            }
            changeToPaginatedLabel={
              strings?.["changeToPaginatedLabel"] || "Canviar a llistat paginat"
            }
            onResetTableView={onResetTableView}
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

      const finalColumns = [statusColumn, checkboxColumn, ...restOfColumns];

      return finalColumns;
    }, [
      HeaderComponent,
      columns,
      onGetColumnsState,
      MemoizedStatusComponent,
      strings,
      onResetTableView,
      initialSortState,
      onChangeTableType,
    ]);

    const memoizedColDefs = useDeepCompareMemo(() => colDefs, [colDefs]);

    useEffect(() => {
      if (isLoading) {
        setDataRendered(false);
      }
    }, [isLoading]);

    const memoizedOnRowDoubleClick = useCallback(
      ({ data: item }: RowDoubleClickedEvent) => {
        onRowDoubleClick?.(item);
      },
      [onRowDoubleClick],
    );

    const onRowSelectionChange = useCallback(
      (event: RowSelectedEvent) => {
        if (event.source === "checkboxSelected" && event.node.data.id) {
          const changedRow = {
            id: event.node.data.id,
            selected: event.node.isSelected() || false,
          };
          requestAnimationFrame(() => {
            onRowSelectionChangeProps?.(changedRow);
          });
        }
      },
      [onRowSelectionChangeProps],
    );

    const rowStyle = useMemo(() => {
      return {
        cursor: showPointerCursorInRows ? "pointer" : "default",
      };
    }, [showPointerCursorInRows]);

    const onModelUpdated = useCallback(() => {
      isLoading === false &&
        requestAnimationFrame(() => {
          onDataRendered();
        });
    }, [isLoading, onDataRendered]);

    const memoizedDataSource = useMemo(() => {
      if (!hasStatusColumn || !onRowStatus) {
        return dataSource;
      }
      return dataSource.map((item) => ({
        ...item,
        $status: onRowStatus(item),
      }));
    }, [dataSource, hasStatusColumn, onRowStatus]);

    const NoRowsOverlayComponent = useMemo(() => {
      // eslint-disable-next-line react/display-name
      return () => (dataRendered ? <span>No rows to show</span> : null);
    }, [dataRendered]);

    const getRowId = useCallback((params: any) => {
      return String(params.data.id);
    }, []);

    const handleSortChanged = useCallback(
      (event: SortChangedEvent) => {
        if (event.source !== "uiColumnSorted") {
          return;
        }

        const sortState = event.api
          .getColumnState()
          .filter((col) => col.sort)
          .map((col) => ({
            colId: col.colId,
            sort: col.sort,
            sortIndex: col.sortIndex,
          }));

        if (!deepEqual(sortState, initialSortState)) {
          onSortChange?.(sortState);
        }
      },
      [initialSortState, onSortChange],
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
          style={{ height: tableHeight, width: "100%", position: "relative" }}
        >
          {!dataRendered && (
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: "rgba(255, 255, 255, 0.7)",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                zIndex: 999,
              }}
            >
              <div
                style={{
                  width: 40,
                  height: 40,
                  border: "4px solid #f3f3f3",
                  borderTop: "4px solid #3498db",
                  borderRadius: "50%",
                  animation: "spin 1s linear infinite",
                }}
              />
            </div>
          )}
          <style>
            {`
              @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
            `}
          </style>
          <AgGridReact
            ref={gridRef}
            rowBuffer={0}
            suppressLoadingOverlay={true}
            noRowsOverlayComponent={NoRowsOverlayComponent}
            columnDefs={memoizedColDefs}
            rowData={memoizedDataSource}
            onRowDoubleClicked={memoizedOnRowDoubleClick}
            suppressCellFocus={true}
            suppressRowClickSelection={true}
            rowSelection={"multiple"}
            onRowSelected={onRowSelectionChange}
            suppressDragLeaveHidesColumns={true}
            getRowHeight={undefined}
            getRowId={getRowId}
            rowStyle={rowStyle}
            getRowStyle={onRowStyle}
            onDragStopped={onColumnChanged}
            onColumnResized={onColumnResized}
            onBodyScrollEnd={onBodyScrollEnd}
            onModelUpdated={onModelUpdated}
            onSortChanged={handleSortChanged}
            reactiveCustomComponents={true}
            debounceVerticalScrollbar={true}
            // debug={true}
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
