import { AgGridReact } from "ag-grid-react";
import { RefObject, useCallback, useEffect, useRef, useState } from "react";
import debounce from "lodash/debounce";

const DEBOUNCE_TIME = 50;

export const useRowSelection = ({
  gridRef,
  onRowSelectionChange,
  onAllRowSelectedModeChange,
  totalRows,
  allRowSelectedModeProps = false,
}: {
  gridRef: RefObject<AgGridReact>;
  onRowSelectionChange?: (selectedKeys: any[]) => void;
  onAllRowSelectedModeChange?: (allRowSelectedMode: boolean) => void;
  totalRows: number;
  allRowSelectedModeProps?: boolean;
}) => {
  const [internalSelectedRowKeys, setInternalSelectedRowKeys] = useState<any[]>(
    [],
  );
  const [allRowSelectedMode, setAllRowSelectedMode] = useState<boolean>(
    allRowSelectedModeProps,
  );
  const prevAllRowSelectedMode = useRef<boolean>(false);

  const selectedRowKeysPendingToRender = useRef<any[]>([]);
  const allRowSelectedModeLock = useRef<boolean>(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    prevAllRowSelectedMode.current = allRowSelectedMode;
  }, [allRowSelectedMode]);

  useEffect(() => {
    setAllRowSelectedMode(allRowSelectedModeProps);
    if (allRowSelectedModeProps) {
      setInternalSelectedRowKeys([]);
      allRowSelectedModeLock.current = true;
    }
  }, [allRowSelectedModeProps]);

  useEffect(() => {
    onAllRowSelectedModeChange?.(allRowSelectedMode);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allRowSelectedMode]);

  const onHeaderCheckboxChange = useCallback(() => {
    // Determine the new selection state based on current conditions
    let newAllSelectedState = false;

    if (allRowSelectedMode) {
      newAllSelectedState = false;
    } else if (!allRowSelectedMode && internalSelectedRowKeys.length === 0) {
      newAllSelectedState = true; // No rows are selected and selection should be toggled to all
    } else if (
      !allRowSelectedMode &&
      internalSelectedRowKeys.length === totalRows
    ) {
      newAllSelectedState = false; // All rows are selected and selection should be toggled to none
    } else if (allRowSelectedMode || internalSelectedRowKeys.length > 0) {
      newAllSelectedState = true;
    }

    allRowSelectedModeLock.current = true;
    // Apply the determined state to all nodes
    gridRef?.current?.api.forEachNode((node) => {
      node.setSelected(newAllSelectedState);
    });

    setAllRowSelectedMode(newAllSelectedState);

    timeoutRef.current && clearTimeout(timeoutRef.current);
    // this is a hacky tweak in order to make this work with the new selection mechanism
    timeoutRef.current = setTimeout(() => {
      allRowSelectedModeLock.current = false;
    }, 1000);
  }, [allRowSelectedMode, internalSelectedRowKeys.length, totalRows, gridRef]);

  useEffect(() => {
    return () => {
      timeoutRef.current && clearTimeout(timeoutRef.current);
    };
  }, [onHeaderCheckboxChange]);

  const onSelectionChanged = useCallback(
    (event: { api: { getSelectedNodes: () => any } }) => {
      if (allRowSelectedModeLock.current) {
        onRowSelectionChange?.([]);
        setInternalSelectedRowKeys([]);
        return;
      }
      setAllRowSelectedMode(false);

      const allSelectedNodes = event.api.getSelectedNodes();
      let selectedKeys = allSelectedNodes.map(
        (node: { data: any }) => node.data.id,
      );
      // merge the pending selected rows
      selectedKeys = selectedKeys.concat(
        selectedRowKeysPendingToRender.current,
      );
      onRowSelectionChange?.(selectedKeys);
      setInternalSelectedRowKeys(selectedKeys);
    },
    [onRowSelectionChange],
  );

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const onSelectionChangedDebounced = useCallback(
    debounce((event: { api: { getSelectedNodes: () => any } }) => {
      onSelectionChanged?.(event);
    }, DEBOUNCE_TIME),
    [onSelectionChanged],
  );

  const setSelectedRowKeysPendingToRender = useCallback((value: any[]) => {
    selectedRowKeysPendingToRender.current = value;
  }, []);

  return {
    internalSelectedRowKeys,
    onHeaderCheckboxChange,
    allRowSelectedMode,
    onSelectionChangedDebounced,
    selectedRowKeysPendingToRender: selectedRowKeysPendingToRender.current,
    setSelectedRowKeysPendingToRender,
  };
};
