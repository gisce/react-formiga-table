import { useCallback, useEffect } from "react";
import { Container } from "./components/Container";
import { useExpandable } from "./hooks/useExpandable";
import { useSelectable } from "./hooks/useSelectable";
import { useSortable } from "./hooks/useSortable";
import { TableProps } from "./types";
import { Headers } from "./components/Headers";
import { Rows } from "./components/Rows";
import { useShiftSelected } from "./hooks/useShiftSelect";
import { SelectAllRecordsRow } from "./components/SelectAllRecordsRow";

export const Table = (props: TableProps) => {
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
    translations = {
      recordsSelected:
        "{numberOfSelectedRows} records are selected from this page.",
      selectAllRecords: "Select all {totalRecords} records.",
      allRecordsSelected: "There are {totalRecords} records selected.",
    },
    onSelectAllRecords,
    totalItems = 0,
  } = props;

  const {
    selectedRowKeys,
    toggleAllRowsSelected,
    isRowSelected,
    changeSelected,
  } = useSelectable({
    selectionRowKeysProps,
  });

  const onChange = useShiftSelected(
    dataSource.map((el) => el.id),
    changeSelected
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
  }, [selectedRowKeys]);

  useEffect(() => {
    onChangeSort?.(localSorter);
  }, [localSorter]);

  const allRowsAreSelected = useCallback(() => {
    if (selectedRowKeys.length === 0) {
      return false;
    }

    if (!expandableOpts) {
      return dataSource.length === selectedRowKeys.length;
    }
    return getAllVisibleKeys().length === selectedRowKeys.length;
  }, [dataSource, selectedRowKeys]);

  const onToggleAllRowsSelected = useCallback(() => {
    toggleAllRowsSelected(getAllVisibleKeys());
  }, [toggleAllRowsSelected, getAllVisibleKeys]);

  if (loading) {
    return loadingComponent;
  }

  const numberOfVisibleSelectedRows = dataSource
    .filter((entry) => getLevelForKey(entry.id) === 0)
    .filter((entry) => selectedRowKeys.includes(entry.id)).length;

  return (
    <Container
      height={height}
      canClick={onRowDoubleClick !== undefined}
      readonly={readonly}
    >
      {onSelectAllRecords && (
        <SelectAllRecordsRow
          numberOfVisibleSelectedRows={numberOfVisibleSelectedRows}
          numberOfRealSelectedRows={selectedRowKeys.length}
          numberOfTotalRows={dataSource.length}
          totalRecords={totalItems}
          translations={translations}
          onSelectAllRecords={onSelectAllRecords}
          loadingComponent={loadingComponent}
        />
      )}
      <table>
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
            readonly={readonly}
          />
        </tbody>
      </table>
    </Container>
  );
};
