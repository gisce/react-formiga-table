import { CSSProperties } from "react";

export type TableColumn = {
  key: string;
  dataIndex?: string;
  title: string;
  render?: (item: any) => React.ReactNode;
  sorter?: (a: any, b: any, column: string, desc: boolean) => number;
  isSortable?: boolean;
};

export type Sorter = {
  id: string;
  desc: boolean;
};

export type ExpandOptions = {
  onFetchChildrenForRecord: (item: any) => Promise<any[]>;
  expandIcon: any;
  collapseIcon: any;
  loadingIcon: any;
  childField: string;
};

export type ExpandableRowIcon = "loading" | "expand" | "collapse" | "none";

export type OnCellRenderOpts = {
  column: any;
  columnIdx: number;
  rowKey: string;
  value: any;
};

export interface RFTLabelStyle extends CSSProperties {
  rftLabel?: CSSProperties;
}

export type customStyle = {
  containerStyle?: CSSProperties;
  tableStyle?: CSSProperties;
  cellStyle?: RFTLabelStyle;
  headerStyle?: RFTLabelStyle;
};

export type TableProps = {
  dataSource: any[];
  columns: TableColumn[];
  onRowStyle?: (item: any) => any;
  onRowStatus?: (item: any) => any;
  onRowDoubleClick?: (item: any) => void;
  onRowSelectionChange?: (selectedRowKeys: any[]) => void;
  sortEnabled?: boolean;
  onChangeSort?: (sorter: Sorter | undefined) => void;
  sorter?: Sorter | undefined;
  expandableOpts?: ExpandOptions;
  loading: boolean;
  loadingComponent: any;
  height?: number | string;
  onCellRender?: (opts: OnCellRenderOpts) => React.ReactNode;
  readonly?: boolean;
  selectionRowKeys?: number[];
  customStyle?: customStyle;
};

export interface TableRef {
  unselectAll: () => void;
}

export type SortDirection = "asc" | "desc" | null | undefined;
