import { useCustomCompareMemo } from "use-custom-compare";

export const useDeepArrayMemo = (array: any[], field: string) => {
  return useCustomCompareMemo(
    () => array,
    [array],
    (prevDeps, nextDeps) => {
      const prevArray = prevDeps[0];
      const nextArray = nextDeps[0];

      if (prevArray.length !== nextArray.length) {
        return false;
      }

      // Deep comparison of each column object
      for (let i = 0; i < prevArray.length; i++) {
        const prevColumn = prevArray[i];
        const nextColumn = nextArray[i];

        // Compare all properties of the column object
        if (JSON.stringify(prevColumn) !== JSON.stringify(nextColumn)) {
          return false;
        }
      }

      return true;
    },
  );
};
