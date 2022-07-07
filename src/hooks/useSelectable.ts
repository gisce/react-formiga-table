import { useState, useCallback } from "react";

export const useSelectable = (dataSource: any[]) => {
  const [selectedRowKeys, setSelectedRowKeys] = useState<number[]>([]);

  const toggleAllRowsSelected = useCallback(() => {
    if (
      selectedRowKeys.length === dataSource.length ||
      selectedRowKeys.length > 0
    ) {
      setSelectedRowKeys([]);
      return;
    }

    setSelectedRowKeys(dataSource.map((item: any) => item.id));
  }, [selectedRowKeys, setSelectedRowKeys]);

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
