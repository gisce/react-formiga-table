// import { CSSProperties } from "react";

import { CSSProperties } from "react";

export type TableColumn = {
  key: string;
  dataIndex?: string;
  title: string;
  render?: (item: any) => React.ReactNode;
  sorter?: (a: any, b: any, column: string, desc: boolean) => number;
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

export interface cellStyle extends CSSProperties {
  rftLabel?: CSSProperties
}

export interface headerStyle extends CSSProperties {
  rftLabel?: CSSProperties
}

export type style = {
  containerStyle?: CSSProperties;
  tableStyle?: CSSProperties;
  cellStyle?: cellStyle;
  headerStyle?: headerStyle;
}

export type TableProps = {
  dataSource: any[];
  columns: TableColumn[];
  onRowStyle?: (item: any) => any;
  onRowStatus?: (item: any) => any;
  onRowDoubleClick?: (item: any) => void;
  onRowSelectionChange?: (selectedRowItems: any[]) => void;
  sortEnabled?: boolean;
  onChangeSort?: (sorter: Sorter | undefined) => void;
  sorter?: Sorter | undefined;
  expandableOpts?: ExpandOptions;
  loading: boolean;
  loadingComponent: any;
  height?: number;
  onCellRender?: (opts: OnCellRenderOpts) => React.ReactNode;
  readonly?: boolean;
  selectionRowKeys?: number[];
  style?: style;
};
