export type TableColumn = {
  key: string;
  dataIndex?: string;
  title: string;
  render?: (item: any) => React.ReactNode;
  sorter?: (a: any, b: any, column: string, desc: boolean) => number;
};

export type RowSettings = {
  style: any;
  onDoubleClick: () => void;
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
  onRow: (item: any) => RowSettings;
  onRowSelectionChange?: (selectedRowItems: any[]) => void;
  onChangeSort?: (sorter: Sorter | undefined) => void;
  sorter: Sorter | undefined;
  expandableOpts?: ExpandOptions;
  loading: boolean;
  loadingComponent: any;
  height?: number;
};
