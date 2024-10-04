import { Column, ColumnState } from "ag-grid-community";
import { AgGridReact } from "ag-grid-react";
import { RefObject, useCallback, useRef } from "react";
import {
  FIXED_COLUMNS_TO_IGNORE,
  getPersistedColumnState,
} from "./columnStateHelper";
import { TableColumn } from "@/types";
import { useDeepCompareCallback } from "use-deep-compare";
import { dequal } from "dequal";

const DEBOUNCE_DELAY = 50;

export const useColumnState = ({
  gridRef,
  containerRef,
  columns,
  onGetColumnsState,
}: {
  gridRef: RefObject<AgGridReact>;
  containerRef: RefObject<HTMLDivElement>;
  columns: TableColumn[];
  onGetColumnsState?: () => ColumnState[] | undefined;
}) => {
  const columnsPersistedStateRef = useRef<ColumnState[]>();

  const columnsToIgnore = FIXED_COLUMNS_TO_IGNORE;

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

  const applyAndUpdateNewState = useCallback(
    (state: ColumnState[]) => {
      columnsPersistedStateRef.current = state;
      gridRef?.current?.api.applyColumnState({
        state: columnsPersistedStateRef.current,
        applyOrder: true,
      });
    },
    [gridRef],
  );

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

  const loadPersistedColumnState = useDeepCompareCallback(() => {
    columnsPersistedStateRef.current = getPersistedColumnState({
      actualColumnKeys: columns.map((column) => column.key),
      persistedColumnState: onGetColumnsState?.(),
    });

    if (columnsPersistedStateRef.current) {
      applyPersistedState();
    }
  }, [applyPersistedState, columns, onGetColumnsState]);

  return {
    loadPersistedColumnState,
    columnsPersistedStateRef,
    applyAndUpdateNewState,
    applyAutoFitState,
  };
};

const removeNullsFromState = (state: ColumnState): Partial<ColumnState> => {
  return Object.entries(state).reduce<Partial<ColumnState>>(
    (acc, [key, value]) => {
      if (value != null) {
        acc[key as keyof ColumnState] = value;
      }
      return acc;
    },
    {},
  );
};

export const areStatesEqual = (
  a?: ColumnState[],
  b?: ColumnState[],
): boolean => {
  if (!a || !b) {
    return false;
  }
  const cleanA = a.map(removeNullsFromState);
  const cleanB = b.map(removeNullsFromState);
  return dequal(cleanA, cleanB);
};
