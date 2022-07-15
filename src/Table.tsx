import { useCallback, useEffect } from "react";
import { Container } from "./components/Container";
import { useExpandable } from "./hooks/useExpandable";
import { useSelectable } from "./hooks/useSelectable";
import { useSortable } from "./hooks/useSortable";
import { TableProps } from "./types";
import { Headers } from "./components/Headers";
import { Rows } from "./components/Rows";

export const Table = (props: TableProps) => {
  const {
    height,
    loading,
    loadingComponent,
    dataSource,
    columns,
    onRowDoubleClick,
    onRowStyle,
    onRowSelectionChange,
    onChangeSort,
    sorter,
    expandableOpts,
  } = props;

  if (loading) {
    return loadingComponent;
  }

  const {
    selectedRowKeys,
    toggleAllRowsSelected,
    toggleRowSelected,
    isRowSelected,
  } = useSelectable();
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

  return (
    <Container height={height} canClick={onRowDoubleClick !== undefined}>
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
            isRowSelected={isRowSelected}
            toggleRowSelected={toggleRowSelected}
            expandableOpts={expandableOpts}
            onExpandableIconClicked={onExpandableIconClicked}
            getExpandableStatusForRow={getExpandableStatusForRow}
            keyIsOpened={keyIsOpened}
            getChildsForParent={getChildsForParent}
            getLevelForKey={getLevelForKey}
          />
        </tbody>
      </table>
    </Container>
  );
};
