import { useEffect } from "react";
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
    sortEnabled = true,
  } = props;

  if (loading) {
    return loadingComponent;
  }

  const {
    selectedRowKeys,
    toggleAllRowsSelected,
    toggleRowSelected,
    isRowSelected,
  } = useSelectable(dataSource);
  const { localSorter, getColumnSorter, handleColumnClick } =
    useSortable(sorter);

  const {
    keyIsOpened,
    onExpandableIconClicked,
    getExpandableStatusForRow,
    getChildsForParent,
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

  return (
    <Container height={height} canClick={onRowDoubleClick !== undefined}>
      <table>
        <thead>
          <tr>
            <Headers
              totalRows={dataSource.length}
              columns={columns}
              onRowSelectionChange={onRowSelectionChange}
              selectedRowKeys={selectedRowKeys}
              toggleAllRowsSelected={toggleAllRowsSelected}
              handleColumnClick={handleColumnClick}
              getColumnSorter={getColumnSorter}
              sortEnabled={sortEnabled}
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
          />
        </tbody>
      </table>
    </Container>
  );
};
