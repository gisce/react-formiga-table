import { useState, useCallback } from "react";
import { Sorter } from "../types";

export const useSortable = (sorter: Sorter | undefined) => {
  const [localSorter, setLocalSorter] = useState(sorter);

  const getColumnSorter = useCallback(
    (columnId: string) => {
      if (!localSorter) {
        return undefined;
      }

      if (columnId === localSorter.id) {
        return localSorter;
      }

      return undefined;
    },
    [localSorter]
  );

  const handleColumnClick = useCallback(
    (columnId: string) => {
      if (!localSorter) {
        setLocalSorter({
          id: columnId,
          desc: false,
        });
        return;
      }

      if (localSorter!.id !== columnId) {
        setLocalSorter({
          id: columnId,
          desc: false,
        });
        return;
      }

      if (localSorter!.desc === false) {
        setLocalSorter({
          id: columnId,
          desc: true,
        });
        return;
      }

      if (localSorter!.desc === true) {
        setLocalSorter(undefined);
      }
    },
    [localSorter]
  );

  return {
    localSorter,
    getColumnSorter,
    handleColumnClick,
  };
};
