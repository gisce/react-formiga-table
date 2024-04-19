import React from "react";
import { Meta, Story } from "@storybook/react";
import { InfiniteTable } from "../components/InfiniteTable/InfiniteTable";
import { Spin } from "antd";
import heavyTable from "./heavy_table.json";

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
      return <img src={item} />;
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

export const HeavyTable = (): React.ReactElement => {
  return (
    <>
      <InfiniteTable
        dataSource={heavyTable}
        onRequestData={async (startRow: number, endRow: number) => {
          // simulate timeout
          await new Promise((resolve) => setTimeout(resolve, 1000));
          return heavyTable.slice(startRow, endRow);
        }}
        columns={columns}
        onRowSelectionChange={(selectedRows: any) => {
          console.log("selectedRows: " + JSON.stringify(selectedRows));
        }}
        onRowStyle={() => undefined}
        onRowDoubleClick={(record: any) => {
          alert("double clicked record" + JSON.stringify(record));
        }}
        loadingComponent={<Spin />}
        height={600}
        sorter={undefined}
        loading={false}
      />
    </>
  );
};
