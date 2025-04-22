import React, { useRef, useState } from "react";
import { Meta } from "@storybook/react";
import {
  InfiniteTable,
  InfiniteTableRef,
} from "../components/InfiniteTable/InfiniteTable";
import heavyTable from "./heavy_table.json";
import { Button } from "antd";

export default {
  title: "Components/InfiniteTable",
  component: InfiniteTable,
} as Meta;

const columns = [
  {
    title: "Name",
    key: "name",
  },
  {
    title: "Surnames",
    key: "surnames",
  },
  {
    title: "Address",
    key: "address",
  },
  {
    title: "Address 2",
    key: "address2",
  },
  {
    title: "Address 3",
    key: "address3",
  },
  {
    title: "Image",
    key: "image",
    render: (value: any, data: any) => {
      return <img src={value} alt="Image" />;
    },
  },
  {
    title: "Object",
    key: "object",
    render: (value: any, data: any) => {
      return <pre>{JSON.stringify(value, null, 2)}</pre>;
    },
  },
];

const onRequestData = async (startRow: number, endRow: number) => {
  await new Promise((resolve) => setTimeout(resolve, 1000)); // simulate fetch delay
  return heavyTable.slice(startRow, endRow);
};

export const HeavyTable = (): React.ReactElement => {
  const tableRef = useRef<InfiniteTableRef>(null);
  const [greenStatusRows, setGreenStatusRows] = useState<number[]>([]);
  const [redTextRows, setRedTextRows] = useState<number[]>([]);

  const refresh = () => {
    tableRef.current?.refresh();
  };

  const updateRandomStyles = () => {
    // Get current visible rows
    const visibleRows = tableRef.current?.getVisibleRows() || [];

    // Randomly select 4 rows for green status
    const selectedStatusRows = [...visibleRows]
      .sort(() => 0.5 - Math.random())
      .slice(0, 4)
      .map((row) => row.id);

    // Randomly select 4 rows for red text (might overlap with status rows)
    const selectedTextRows = [...visibleRows]
      .sort(() => 0.5 - Math.random())
      .slice(0, 4)
      .map((row) => row.id);

    setGreenStatusRows(selectedStatusRows);
    setRedTextRows(selectedTextRows);

    // Force refresh of the rows to update both status and style
    tableRef.current?.refreshRowStyles();
  };

  return (
    <>
      <div style={{ marginBottom: "10px", display: "flex", gap: "10px" }}>
        <Button onClick={refresh}>Refresh table</Button>
        <Button onClick={updateRandomStyles} type="primary">
          Update Random Styles
        </Button>
      </div>
      <InfiniteTable
        onRequestData={onRequestData}
        columns={columns}
        onRowSelectionChange={(selectedRows: any) => {
          console.log("selectedRows: " + JSON.stringify(selectedRows));
        }}
        onRowDoubleClick={(record: any) => {
          alert("Double clicked record: " + JSON.stringify(record));
        }}
        height={600}
        ref={tableRef}
        onColumnChanged={(columnsState) => {
          console.log(
            "columnChanged - columnsState: " + JSON.stringify(columnsState),
          );
          localStorage.setItem("columnsState", JSON.stringify(columnsState));
        }}
        onGetColumnsState={() => {
          const columnsState = localStorage.getItem("columnsState");
          return columnsState ? JSON.parse(columnsState) : undefined;
        }}
        footer={<p>This is a footer</p>}
        hasStatusColumn={true}
        onRowStatus={(record: any) => {
          return greenStatusRows.includes(record.id) ? "success" : "default";
        }}
        onRowStyle={(record: any) => ({
          color: redTextRows.includes(record.id) ? "#ff4d4f" : "inherit",
        })}
        statusComponent={(status: any) => (
          <div
            style={{
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              backgroundColor: status === "success" ? "#52c41a" : "#d9d9d9",
              margin: "0 auto",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          />
        )}
      />
    </>
  );
};
