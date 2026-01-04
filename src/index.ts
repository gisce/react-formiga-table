import { ModuleRegistry, AllCommunityModule } from "ag-grid-community";

ModuleRegistry.registerModules([AllCommunityModule]);

export { Table } from "./components/Table";
export { InfiniteTable } from "./components/InfiniteTable/InfiniteTable";
export { PaginatedTable } from "./components/PaginatedTable/PaginatedTable";
export type { TableProps, TableRef } from "./types";
export type {
  InfiniteTableProps,
  InfiniteTableRef,
} from "./components/InfiniteTable/InfiniteTable";
export type {
  PaginatedTableProps,
  PaginatedTableRef,
} from "./components/PaginatedTable/PaginatedTable";
export type { CheckboxState } from "./components/PaginatedTable/PaginatedHeaderCheckbox";

export type { ColumnState } from "ag-grid-community";
export type { BodyScrollEndEvent } from "ag-grid-community";

export * from "./types";
