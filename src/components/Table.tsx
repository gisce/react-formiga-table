import { forwardRef, useImperativeHandle, useCallback, useEffect } from "react";
import { useExpandable } from "../hooks/useExpandable";
import { useSelectable } from "../hooks/useSelectable";
import { useShiftSelected } from "../hooks/useShiftSelect";
import { useSortable } from "../hooks/useSortable";
import { TableProps, TableRef } from "../types";
import { Container } from "./Container";
import { Headers } from "./Headers";
import { Rows } from "./Rows";

export const Table = forwardRef<TableRef, TableProps>((props, ref) => {
  const {
    height,
    loading,
    loadingComponent,
    dataSource,
    columns,
    onRowDoubleClick,
    onRowStyle,
    onRowStatus,
    onRowSelectionChange,
    onChangeSort,
    sorter,
    expandableOpts,
    onCellRender,
    readonly,
    selectionRowKeys: selectionRowKeysProps,
    customStyle,
  } = props;

  const {
    selectedRowKeys,
    toggleAllRowsSelected,
    isRowSelected,
    changeSelected,
  } = useSelectable({
    selectionRowKeysProps,
  });

  useImperativeHandle(ref, () => ({
    unselectAll: () => {
      toggleAllRowsSelected([]);
    },
  }));

  const onChange = useShiftSelected(
    dataSource.map((el) => el.id),
    changeSelected,
  );
  const { localSorter, getColumnSorter, handleColumnClick } =
    useSortable(sorter);

  const {
    keyIsOpened,
    onExpandableIconClicked,
    getExpandableStatusForRow,
    getChildsForParent,
    getAllVisibleKeys,
    getLevelForKey,
  } = useExpandable({
    dataSource,
    onFetchChildrenForRecord: expandableOpts?.onFetchChildrenForRecord,
    childField: expandableOpts?.childField,
  });

  useEffect(() => {
    onRowSelectionChange?.(selectedRowKeys);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedRowKeys]);

  useEffect(() => {
    onChangeSort?.(localSorter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localSorter]);

  const allRowsAreSelected = useCallback(() => {
    if (selectedRowKeys.length === 0) {
      return false;
    }

    if (!expandableOpts) {
      return dataSource.length === selectedRowKeys.length;
    }
    return getAllVisibleKeys().length === selectedRowKeys.length;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataSource.length, expandableOpts, selectedRowKeys.length]);

  const onToggleAllRowsSelected = useCallback(() => {
    toggleAllRowsSelected(getAllVisibleKeys());
  }, [toggleAllRowsSelected, getAllVisibleKeys]);

  if (loading) {
    return loadingComponent;
  }

  return (
    <Container
      height={height}
      canClick={onRowDoubleClick !== undefined}
      readonly={readonly}
      containerStyle={customStyle?.containerStyle}
    >
      <table style={customStyle?.tableStyle}>
        <thead>
          <tr>
            <Headers
              allRowsAreSelected={allRowsAreSelected()}
              columns={columns}
              onRowSelectionChange={onRowSelectionChange}
              selectedRowKeys={selectedRowKeys}
              toggleAllRowsSelected={onToggleAllRowsSelected}
              handleColumnClick={handleColumnClick}
              getColumnSorter={getColumnSorter}
              sortEnabled={expandableOpts === undefined}
              readonly={readonly}
              status={!!onRowStatus}
              headerStyle={customStyle?.headerStyle}
            />
          </tr>
        </thead>
        <tbody>
          <Rows
            dataSource={dataSource}
            columns={columns}
            onRowSelectionChange={onRowSelectionChange}
            getColumnSorter={getColumnSorter}
            onRowDoubleClick={onRowDoubleClick}
            onRowStyle={onRowStyle}
            onRowStatus={onRowStatus}
            isRowSelected={isRowSelected}
            toggleRowSelected={onChange}
            expandableOpts={expandableOpts}
            onExpandableIconClicked={onExpandableIconClicked}
            getExpandableStatusForRow={getExpandableStatusForRow}
            keyIsOpened={keyIsOpened}
            getChildsForParent={getChildsForParent}
            getLevelForKey={getLevelForKey}
            onCellRender={onCellRender}
            cellStyle={customStyle?.cellStyle}
            readonly={readonly}
          />
        </tbody>
      </table>
    </Container>
  );
});

Table.displayName = "Table";
