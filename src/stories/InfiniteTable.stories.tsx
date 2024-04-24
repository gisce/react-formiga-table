import React, { useRef } from "react";
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
    render: (item: any) => {
      return <img src={item} alt="Image" />;
    },
  },
  {
    title: "Object",
    key: "object",
    render: (item: any) => {
      return <pre>{JSON.stringify(item, null, 2)}</pre>;
    },
  },
];

const onRequestData = async (startRow: number, endRow: number) => {
  await new Promise((resolve) => setTimeout(resolve, 1000)); // simulate fetch delay
  return heavyTable.slice(startRow, endRow);
};

export const HeavyTable = (): React.ReactElement => {
  const tableRef = useRef<InfiniteTableRef>(null);

  const refresh = () => {
    tableRef.current?.refresh();
  };

  return (
    <>
      <Button onClick={refresh} style={{ marginBottom: "10px" }}>
        Refresh table
      </Button>
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
      />
    </>
  );
};
