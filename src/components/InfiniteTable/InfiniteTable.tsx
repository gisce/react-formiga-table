import { useState } from "react";
import { AgGridReact } from "ag-grid-react";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-quartz.css";
import { ColDef } from "ag-grid-community";

// Row Data Interface
interface IRow {
  make: string;
  model: string;
  price: number;
  electric: boolean;
}

// Create new GridExample component
export const InfiniteTable = () => {
  // Row Data: The data to be displayed.
  const [rowData, setRowData] = useState<IRow[]>([
    {
      make: "Tesla model x super guay de la ostia",
      model: "Model Y",
      price: 64950,
      electric: true,
    },
    { make: "Ford", model: "F-Series", price: 33850, electric: false },
    { make: "Toyota", model: "Corolla", price: 29600, electric: false },
    { make: "Mercedes", model: "EQA", price: 48890, electric: true },
    { make: "Fiat", model: "500", price: 15774, electric: false },
    { make: "Nissan", model: "Juke", price: 20675, electric: false },
  ]);

  const defaultColumnDef = {
    resizable: false,
    suppressMovable: true,
    sortable: false,
  };

  // Column Definitions: Defines & controls grid columns.
  const [colDefs, setColDefs] = useState<ColDef<IRow>[]>([
    {
      ...defaultColumnDef,
      headerCheckboxSelection: true,
      checkboxSelection: true,
      showDisabledCheckboxes: true,
    },
    { ...defaultColumnDef, field: "make" },
    { ...defaultColumnDef, field: "model" },
    { ...defaultColumnDef, field: "price" },
    { ...defaultColumnDef, field: "electric" },
  ]);

  return (
    <div
      className={`ag-grid-default-table ag-theme-quartz`}
      style={{ height: 600 }}
    >
      <AgGridReact
        rowData={rowData}
        columnDefs={colDefs}
        autoSizeStrategy={{
          type: "fitCellContents",
        }}
        onRowDoubleClicked={(event) => {
          alert("Row Double Clicked: ");
        }}
        rowStyle={{
          cursor: "pointer",
        }}
        suppressCellFocus={true}
        rowSelection={"multiple"}
        suppressRowClickSelection={true}
        onSelectionChanged={(event) => {
          const allSelectedNodes = event.api.getSelectedNodes();
          const selectedData = allSelectedNodes.map((node) => node.data);
          console.log("Selected rows data:", selectedData);
        }}
      />
    </div>
  );
};
