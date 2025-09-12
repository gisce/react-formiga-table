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
  ColumnResizedEvent,
  ColumnState,
  RowDoubleClickedEvent,
  RowSelectedEvent,
  SortChangedEvent,
} from "ag-grid-community";
import type { ExpandOptions, Strings, TableColumn, TableType } from "@/types";
import { useDeepArrayMemo } from "@/hooks/useDeepArrayMemo";
import {
  useColumnState,
  areStatesEqual,
} from "../InfiniteTable/useColumnState";
import {
  CheckboxState,
  usePaginatedHeaderCheckbox,
} from "./PaginatedHeaderCheckbox";
import deepEqual from "deep-equal";
import { NoRowsOverlay } from "../NoRowsOverlay";
import { ExpandableItem, useExpandable } from "@/hooks/useExpandable";
import { usePaginatedTableColumns } from "./usePaginatedTableColumns.tsx";
import { useDeepCompareMemo } from "use-deep-compare";

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

  strings?: Strings;
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

  expandableOpts?: ExpandOptions;
  autoRefresh?: number;
  debug?: boolean;
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
      expandableOpts,
      autoRefresh,
      debug,
    } = props;

    const gridRef = useRef<AgGridReact>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const totalHeight = footer ? heightProps + footerHeight : heightProps;
    const tableHeight = footer ? heightProps - footerHeight : heightProps;
    const [dataRendered, setDataRendered] = useState(false);
    const [isAutoRefreshing, setIsAutoRefreshing] = useState(false);

    const effectiveIsLoading = isAutoRefreshing ? false : isLoading;

    const wrappedOnForceReload = useCallback(() => {
      if (onForceReload) {
        const columnState = gridRef.current?.api?.getColumnState();

        onForceReload();

        setTimeout(() => {
          if (columnState) {
            gridRef.current?.api?.applyColumnState({
              state: columnState,
              applyOrder: true,
            });
          }
          setTimeout(() => setIsAutoRefreshing(false), 100);
        }, 50);
      }
    }, [onForceReload]);

    useEffect(() => {
      if (!autoRefresh || autoRefresh <= 0) return;

      const intervalId = setInterval(() => {
        setIsAutoRefreshing(true);

        if (onForceReload) {
          wrappedOnForceReload();
        } else {
          gridRef.current?.api?.refreshCells({ force: true });
          setTimeout(() => setIsAutoRefreshing(false), 100);
        }
      }, autoRefresh * 1000);

      return () => clearInterval(intervalId);
    }, [autoRefresh, onForceReload, wrappedOnForceReload]);

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

    const {
      keyIsOpened,
      onExpandableIconClicked,
      getExpandableStatusForRow,
      getChildsForParent,
      getLevelForKey,
      items: expandableItems,
      openedKeys,
    } = useExpandable({
      dataSource,
      onFetchChildrenForRecord: expandableOpts?.onFetchChildrenForRecord,
      childField: expandableOpts?.childField,
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

        if (!effectiveIsLoading && api && api.getDisplayedRowCount() > 0) {
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
      effectiveIsLoading,
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

    const { HeaderComponent } = usePaginatedHeaderCheckbox(
      headerCheckboxState,
      onHeaderCheckboxClick,
    );

    const onResetTableView = useCallback(() => {
      onColumnsChangedProps?.([]);
      onSortChange?.([]);
      onForceReload?.();
    }, [onColumnsChangedProps, onForceReload, onSortChange]);

    const memoizedColDefs = usePaginatedTableColumns({
      columns,
      initialSortState,
      onGetColumnsState,
      HeaderComponent,
      statusComponent,
      strings,
      onChangeTableType,
      onResetTableView,
      expandableOpts,
      getExpandableStatusForRow: expandableOpts?.onFetchChildrenForRecord
        ? getExpandableStatusForRow
        : undefined,
      onExpandableIconClicked: expandableOpts?.onFetchChildrenForRecord
        ? onExpandableIconClicked
        : undefined,
      getLevelForKey: expandableOpts?.onFetchChildrenForRecord
        ? getLevelForKey
        : undefined,
      showCheckboxColumn: !!onRowSelectionChangeProps,
    });

    useEffect(() => {
      if (effectiveIsLoading) {
        setDataRendered(false);
      } else if (effectiveIsLoading === false && dataSource.length === 0) {
        setDataRendered(true);
      }
    }, [dataSource.length, effectiveIsLoading]);

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
      effectiveIsLoading === false &&
        requestAnimationFrame(() => {
          onDataRendered();
        });
    }, [effectiveIsLoading, onDataRendered]);

    const memoizedDataSource = useMemo(() => {
      if (!hasStatusColumn || !onRowStatus) {
        return dataSource;
      }
      return dataSource.map((item) => ({
        ...item,
        $status: onRowStatus(item),
      }));
    }, [dataSource, hasStatusColumn, onRowStatus]);

    const visibleData = useMemo(() => {
      if (!expandableOpts?.onFetchChildrenForRecord) {
        return memoizedDataSource;
      }

      const buildVisibleData = (
        currentLevelItems: any[],
        currentLevel: number,
      ): any[] => {
        let visible: any[] = [];
        currentLevelItems.forEach((item: any) => {
          if (!item) return;
          // Make sure to add status to the item if needed
          const itemWithStatus =
            hasStatusColumn && onRowStatus && !item.$status
              ? { ...item, $status: onRowStatus(item) }
              : item;
          visible.push(itemWithStatus);
          if (keyIsOpened(item.id)) {
            const children = getChildsForParent(item.id);
            if (children.length > 0) {
              visible = visible.concat(
                buildVisibleData(
                  children.map((c) => {
                    // Ensure each child has the status property
                    const childData = c.data;
                    if (hasStatusColumn && onRowStatus && !childData.$status) {
                      return { ...childData, $status: onRowStatus(childData) };
                    }
                    return childData;
                  }),
                  currentLevel + 1,
                ),
              );
            }
          }
        });
        return visible;
      };

      const rootItems = expandableItems
        .filter((item: ExpandableItem) => item.level === 0)
        .map((i: ExpandableItem) => i.data);
      return buildVisibleData(rootItems, 0);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
      expandableOpts,
      memoizedDataSource,
      expandableItems,
      keyIsOpened,
      getChildsForParent,
      hasStatusColumn,
      onRowStatus,
      openedKeys,
    ]);

    const safeVisibleData = useDeepCompareMemo(() => {
      return visibleData;
    }, [visibleData]);

    const NoRowsOverlayComponent = useMemo(() => {
      // eslint-disable-next-line react/display-name
      return () => <NoRowsOverlay message={strings?.["noResultsLabel"]} />;
    }, [strings]);

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

    // Callback to apply persisted column state or auto-fit
    const applyCurrentColumnState = useCallback(() => {
      const api = gridRef.current?.api;
      if (api && !effectiveIsLoading) {
        // Ensure API is available and not loading
        // It's good practice to check if the component is still mounted if operations are async
        const persistedState = onGetColumnsState?.();
        if (persistedState && persistedState.length > 0) {
          api.applyColumnState({
            state: persistedState,
            applyOrder: true,
          });
        } else {
          applyAutoFitState(); // from useColumnState
        }
      }
    }, [effectiveIsLoading, onGetColumnsState, applyAutoFitState, gridRef]); // gridRef is stable

    useEffect(() => {
      if (gridRef.current?.api && !effectiveIsLoading) {
        // Apply column state when colDefs change.
        // A timeout helps ensure AG Grid has processed the new colDefs.
        const timerId = setTimeout(() => {
          applyCurrentColumnState();
        }, 50); // Adjust delay as needed, could be 0 for next tick

        return () => clearTimeout(timerId);
      }
    }, [memoizedColDefs, effectiveIsLoading, applyCurrentColumnState]); // Key dependencies

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
            enableCellTextSelection={true}
            suppressLoadingOverlay={true}
            noRowsOverlayComponent={NoRowsOverlayComponent}
            columnDefs={memoizedColDefs}
            rowData={safeVisibleData}
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
            debug={debug}
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
