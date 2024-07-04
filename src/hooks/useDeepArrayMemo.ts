import { useCustomCompareMemo } from "use-custom-compare";

export const useDeepArrayMemo = (array: any[], field: string) => {
  return useCustomCompareMemo(
    () => array,
    [array],
    (prevDeps, nextDeps) => {
      const prevArray = prevDeps[0];
      const nextArray = nextDeps[0];
      const prevColumnsKeys = prevArray
        .map((column) => column[field])
        .sort((a, b) => a.localeCompare(b))
        .join(",");
      const nextColumnsKeys = nextArray
        .map((column) => column[field])
        .sort((a, b) => a.localeCompare(b))
        .join(",");
      return prevColumnsKeys === nextColumnsKeys;
    },
  );
};
