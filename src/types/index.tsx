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
  onRowExpand?: (item: any) => Promise<void>;
  expandIcon?: any;
  collapseIcon?: any;
};

export type TableProps = {
  dataSource: any[];
  columns: TableColumn[];
  onRowStyle: (item: any) => any;
  onRowDoubleClick?: (item: any) => void;
  onRowSelectionChange?: (selectedRowItems: any[]) => void;
  onChangeSort?: (sorter: Sorter | undefined) => void;
  sorter: Sorter | undefined;
  expandableOpts?: ExpandOptions;
  loading: boolean;
  loadingComponent: any;
  height?: number;
};
