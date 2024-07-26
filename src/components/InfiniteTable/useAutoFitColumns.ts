import { Column } from "ag-grid-community";
import { AgGridReact } from "ag-grid-react";
import { RefObject, useCallback, useRef } from "react";

export const useAutoFitColumns = ({
  gridRef,
  containerRef,
  columnsPersistedStateRef,
  hasStatusColumn,
}: {
  gridRef: RefObject<AgGridReact>;
  containerRef: RefObject<HTMLDivElement>;
  columnsPersistedStateRef: RefObject<any>;
  hasStatusColumn: boolean;
}) => {
  const firstTimeResized = useRef(false);

  const columnsToIgnore = ["0"]; // 0 is for header checkbox column
  if (hasStatusColumn) {
    columnsToIgnore.push("$status");
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const autoSizeColumnsIfNecessary = useCallback(() => {
    if (!columnsPersistedStateRef.current && !firstTimeResized.current) {
      firstTimeResized.current = true;
      setTimeout(() => {
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
      }, 50);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remainingBlankSpace]);

  return {
    autoSizeColumnsIfNecessary,
  };
};
