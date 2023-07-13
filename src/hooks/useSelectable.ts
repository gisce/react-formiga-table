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

  const changeSelected = useCallback(
    (check: boolean, items: Array<number>): void => {
      console.log('changeSelected!', check, items);
      if (items.length === 0) {
        return;
      }
      if (check) {
        setSelectedRowKeys([...new Set([...selectedRowKeys, ...items])])
      } else {
        setSelectedRowKeys(selectedRowKeys.filter((id: number) => !items.includes(id)))
      }
    }, [selectedRowKeys, setSelectedRowKeys]
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

      //console.log('selectedRowKeys', selectedRowKeys);
      const selectedFoundRow = selectedRowKeys.find(
        (id: number) => row.id === id
      );
      console.log('isRowSelected', row, selectedFoundRow);

      return selectedFoundRow !== undefined;
    },
    [selectedRowKeys, setSelectedRowKeys]
  );

  return {
    selectedRowKeys,
    isRowSelected,
    toggleAllRowsSelected,
    toggleRowSelected,
    changeSelected,
  };
};
