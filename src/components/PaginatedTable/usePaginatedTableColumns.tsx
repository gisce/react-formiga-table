import React, { useMemo, ReactNode, memo } from "react";
import { ColDef, ColumnState } from "ag-grid-community";
import type {
  ExpandOptions,
  Strings,
  TableColumn,
  TableType,
} from "../../types";
import {
  CHECKBOX_COLUMN,
  STATUS_COLUMN,
} from "../InfiniteTable/columnStateHelper";
import { ITOptsButton } from "../InfiniteTable/ITOptsButton";
import { ExpandableCellRenderer } from "./renderers/ExpandableCellRenderer";
import { StatusCellRenderer } from "./renderers/StatusCellRenderer";
import { StyledTextCell } from "./renderers/StyledTextCell";
import { useDeepCompareMemo } from "use-deep-compare";

const DEFAULT_COL_DEF: ColDef = {
  autoHeight: true,
  wrapText: true,
  sortable: false,
  comparator: () => 0,
  resizable: true,
  valueFormatter: () => "", // To skip warnings, return an empty string
};

type UsePaginatedTableColumnsProps = {
  columns: TableColumn[];
  initialSortState?: ColumnState[];
  onGetColumnsState?: () => ColumnState[] | undefined;
  HeaderComponent: React.ElementType; // From usePaginatedHeaderCheckbox
  statusComponent?: (status: any) => ReactNode;
  strings?: Strings;
  onChangeTableType?: (targetType: TableType) => void;
  onResetTableView: () => void;
  expandableOpts?: ExpandOptions;
  getExpandableStatusForRow?: (
    data: any,
  ) => "expand" | "collapse" | "loading" | "none";
  onExpandableIconClicked?: (data: any) => void;
  getLevelForKey?: (key: any) => number | undefined;
};

export const usePaginatedTableColumns = ({
  columns,
  initialSortState,
  onGetColumnsState,
  HeaderComponent,
  statusComponent,
  strings = {},
  onChangeTableType,
  onResetTableView,
  expandableOpts,
  getExpandableStatusForRow,
  onExpandableIconClicked,
  getLevelForKey,
}: UsePaginatedTableColumnsProps): ColDef[] => {
  const MemoizedStatusComponent = useMemo(() => {
    if (!statusComponent) return undefined;
    // eslint-disable-next-line react/display-name
    return memo((propsComp: { status: any }) =>
      statusComponent(propsComp.status),
    );
  }, [statusComponent]);

  const colDefs = useMemo((): ColDef[] => {
    const checkboxColumn: ColDef = {
      ...DEFAULT_COL_DEF,
      checkboxSelection: true,
      suppressMovable: true,
      sortable: false,
      pinned: "left",
      lockPosition: "left",
      lockPinned: true,
      maxWidth: expandableOpts?.onFetchChildrenForRecord ? 30 : 50,
      resizable: false,
      field: CHECKBOX_COLUMN,
      headerComponent: HeaderComponent,
    };

    const mustShowExpandableColumn = Boolean(
      expandableOpts?.onFetchChildrenForRecord &&
        getExpandableStatusForRow &&
        onExpandableIconClicked,
    );

    console.log({ mustShowExpandableColumn });
    const expandableColumn: ColDef | null =
      expandableOpts?.onFetchChildrenForRecord &&
      getExpandableStatusForRow &&
      onExpandableIconClicked
        ? {
            ...DEFAULT_COL_DEF,
            field: "$expandable",
            suppressMovable: true,
            sortable: false,
            pinned: "left",
            lockPosition: "left",
            lockPinned: true,
            maxWidth: 40,
            resizable: false,
            headerName: "",
            headerComponent: null,
            cellRenderer: (params: any) => (
              <ExpandableCellRenderer
                data={params.data}
                expandableOpts={expandableOpts!}
                getExpandableStatusForRow={getExpandableStatusForRow!}
                onExpandableIconClicked={onExpandableIconClicked!}
              />
            ),
            cellStyle: {
              padding: 0, // Handled by renderer
              margin: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            },
          }
        : null;

    const restOfColumns: ColDef[] = columns.map((column) => {
      const initialSort = initialSortState?.find(
        (state) => state.colId === column.key,
      );
      return {
        ...DEFAULT_COL_DEF,
        field: column.key,
        sortable: column.isSortable,
        headerName: column.title,
        sort: initialSort?.sort,
        sortIndex: initialSort?.sortIndex,
        pinned: false,
        cellRenderer: (params: any) => (
          <StyledTextCell
            value={params.value}
            data={params.data}
            columnRender={column.render}
            getLevelForKey={getLevelForKey}
            hasExpandableColumn={!!expandableOpts?.onFetchChildrenForRecord}
          />
        ),
        cellStyle: expandableOpts?.onFetchChildrenForRecord
          ? () => ({ paddingLeft: "0px" }) // Padding is handled by StyledTextCell
          : undefined,
      };
    });

    const storedState = onGetColumnsState?.();
    const storedStateKeys = storedState?.map((col: any) => col.colId);

    if (storedState && storedStateKeys) {
      restOfColumns.sort((a, b) => {
        const aIndex = storedStateKeys.indexOf(a.field!);
        const bIndex = storedStateKeys.indexOf(b.field!);
        return aIndex - bIndex;
      });
    }

    const statusColumn: ColDef = {
      ...DEFAULT_COL_DEF,
      field: STATUS_COLUMN,
      suppressMovable: true,
      sortable: false,
      lockPosition: "left",
      lockPinned: true,
      maxWidth: 30,
      pinned: "left",
      resizable: false,
      cellStyle: {
        padding: 0,
        margin: 0,
      },
      headerComponent: () => (
        <ITOptsButton
          resetTableViewLabel={
            strings?.["resetTableViewLabel"] || "resetTableViewLabel"
          }
          currentTableType="paginated"
          onChangeTableType={onChangeTableType}
          changeToInfiniteLabel={
            strings?.["changeToInfiniteLabel"] || "Canviar a llistat infinit"
          }
          changeToPaginatedLabel={
            strings?.["changeToPaginatedLabel"] || "Canviar a llistat paginat"
          }
          onResetTableView={onResetTableView}
        />
      ),
      cellRenderer: MemoizedStatusComponent
        ? (params: any) => (
            <StatusCellRenderer
              value={params.value} // This would be $status field value
              StatusComponent={MemoizedStatusComponent}
            />
          )
        : undefined,
    };

    const finalColumns = [
      statusColumn,
      checkboxColumn,
      ...(expandableColumn ? [expandableColumn] : []),
      ...restOfColumns,
    ];

    return finalColumns;
  }, [
    HeaderComponent,
    expandableOpts,
    columns,
    onGetColumnsState,
    MemoizedStatusComponent,
    getExpandableStatusForRow,
    onExpandableIconClicked,
    initialSortState,
    getLevelForKey,
    strings,
    onChangeTableType,
    onResetTableView,
  ]);

  return useDeepCompareMemo(() => colDefs, [colDefs]);
};
