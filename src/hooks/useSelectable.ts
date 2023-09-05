import { useState, useCallback, useEffect } from "react";
import useDeepCompareEffect from "use-deep-compare-effect";

export const useSelectable = ({
  selectionRowKeysProps = [],
}: {
  selectionRowKeysProps?: number[];
}) => {
  const [selectedRowKeys, setSelectedRowKeys] = useState<number[]>(
    selectionRowKeysProps
  );

  useDeepCompareEffect(() => {
    setSelectedRowKeys(selectionRowKeysProps);
  }, [selectionRowKeysProps]);

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
      if (items.length === 0) {
        return;
      }
      if (check) {
        setSelectedRowKeys([...new Set([...selectedRowKeys, ...items])]);
      } else {
        setSelectedRowKeys(
          selectedRowKeys.filter((id: number) => !items.includes(id))
        );
      }
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
    changeSelected,
  };
};