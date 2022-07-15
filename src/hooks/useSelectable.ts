import { useState, useCallback } from "react";

export const useSelectable = () => {
  const [selectedRowKeys, setSelectedRowKeys] = useState<number[]>([]);

  const toggleAllRowsSelected = useCallback(
    (allVisibleKeys: number[]) => {
      if (
        selectedRowKeys.length === allVisibleKeys.length ||
        selectedRowKeys.length > 0
      ) {
        setSelectedRowKeys([]);
        return;
      }

      setSelectedRowKeys(allVisibleKeys);
    },
    [selectedRowKeys, setSelectedRowKeys]
  );

  const toggleRowSelected = useCallback(
    (row: any) => {
      const selectedFoundRow = selectedRowKeys.find(
        (id: number) => row.id === id
      );

      if (selectedFoundRow === undefined) {
        setSelectedRowKeys([...selectedRowKeys, row.id]);
        return;
      }

      setSelectedRowKeys([...selectedRowKeys.filter((id) => id !== row.id)]);
    },
    [selectedRowKeys, setSelectedRowKeys]
  );

  const isRowSelected = useCallback(
    (row: any) => {
      const selectedFoundRow = selectedRowKeys.find(
        (id: number) => row.id === id
      );

      return selectedFoundRow !== undefined;
    },
    [selectedRowKeys, setSelectedRowKeys]
  );

  return {
    selectedRowKeys,
    isRowSelected,
    toggleAllRowsSelected,
    toggleRowSelected,
  };
};
