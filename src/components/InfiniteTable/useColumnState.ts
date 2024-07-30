import { Column, ColumnState } from "ag-grid-community";
import { AgGridReact } from "ag-grid-react";
import { RefObject, useCallback, useRef } from "react";
import {
  FIXED_COLUMNS_TO_IGNORE,
  getPersistedColumnState,
  STATUS_COLUMN,
} from "./columnStateHelper";
import { TableColumn } from "@/types";
import { useDeepCompareCallback } from "use-deep-compare";

const DEBOUNCE_DELAY = 50;

export const useColumnState = ({
  gridRef,
  containerRef,
  hasStatusColumn,
  columns,
  onGetColumnsState,
}: {
  gridRef: RefObject<AgGridReact>;
  containerRef: RefObject<HTMLDivElement>;
  hasStatusColumn: boolean;
  columns: TableColumn[];
  onGetColumnsState?: () => ColumnState[] | undefined;
}) => {
  const firstTimeResized = useRef(false);
  const columnsPersistedStateRef = useRef<any>();

  const columnsToIgnore = FIXED_COLUMNS_TO_IGNORE;
  if (hasStatusColumn) {
    columnsToIgnore.push(STATUS_COLUMN);
  }

  const remainingBlankSpace = useCallback(
    (allColumns: Array<Column<any>>) => {
      const totalColumnWidth = allColumns?.reduce(
        (acc, column) => acc + column.getActualWidth(),
        0,
      );
      const gridRefWidth = containerRef?.current?.clientWidth;
      if (!gridRefWidth || !totalColumnWidth) return 0;
      return gridRefWidth - totalColumnWidth;
    },
    [containerRef],
  );

  const runDeferredCallback = useCallback((callback: Function) => {
    setTimeout(() => {
      callback();
    }, DEBOUNCE_DELAY);
  }, []);

  const applyPersistedState = useCallback(() => {
    runDeferredCallback(() => {
      gridRef?.current?.api.applyColumnState({
        state: columnsPersistedStateRef.current,
        applyOrder: true,
      });
    });
  }, [gridRef, runDeferredCallback]);

  const applyAutoFitState = useDeepCompareCallback(() => {
    runDeferredCallback(() => {
      gridRef?.current?.api.autoSizeAllColumns();
      const allColumns = gridRef?.current?.api.getAllGridColumns();
      if (!allColumns) return;
      const blankSpace = remainingBlankSpace(allColumns);
      if (blankSpace > 0) {
        const spacePerColumn =
          blankSpace / (allColumns.length - columnsToIgnore.length);
        const state = gridRef?.current?.api.getColumnState()!;
        const newState = state.map((col: any) => ({
          ...col,
          width: columnsToIgnore.includes(col.colId)
            ? col.width
            : col.width + spacePerColumn,
        }));
        gridRef?.current?.api.applyColumnState({ state: newState });
      }
    });
  }, [columnsToIgnore, gridRef, remainingBlankSpace, runDeferredCallback]);

  const applyColumnState = useDeepCompareCallback(() => {
    columnsPersistedStateRef.current = getPersistedColumnState({
      actualColumnKeys: columns.map((column) => column.key),
      persistedColumnState: onGetColumnsState?.(),
    });

    if (columnsPersistedStateRef.current) {
      applyPersistedState();
      return;
    }

    if (!columnsPersistedStateRef.current && !firstTimeResized.current) {
      firstTimeResized.current = true;
      applyAutoFitState();
    }
  }, [applyAutoFitState, applyPersistedState, columns, onGetColumnsState]);

  return {
    applyColumnState,
  };
};
