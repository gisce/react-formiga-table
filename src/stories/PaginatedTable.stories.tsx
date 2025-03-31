import React, { useRef, useState } from "react";
import { ComponentMeta, ComponentStoryObj } from "@storybook/react";
import { PaginatedTable } from "../components/PaginatedTable/PaginatedTable";
import { Button, Spin } from "antd";
import { TableColumn, TableType } from "../types";
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  LoadingOutlined,
} from "@ant-design/icons";
import heavyTable from "./heavy_table.json";

const meta: ComponentMeta<typeof PaginatedTable> = {
  title: "Table/Paginated",
  component: PaginatedTable,
};
export default meta;

const columns: TableColumn[] = [
  {
    title: "Name",
    key: "name",
    isSortable: true,
  },
  {
    title: "Surnames",
    key: "surnames",
    isSortable: true,
  },
  {
    title: "Address",
    key: "address",
    isSortable: false,
  },
  {
    title: "Image",
    key: "image",
    isSortable: false,
    render: (value: string) => {
      return <img src={value} alt="avatar" style={{ width: 50, height: 50 }} />;
    },
  },
  {
    title: "Object",
    key: "object",
    isSortable: false,
    render: (value: any) => {
      return <pre>{JSON.stringify(value, null, 2)}</pre>;
    },
  },
];

const dataSource = [
  {
    id: 0,
    name: "A. John",
    surnames: "Doe",
    address: "123 Main St",
    image:
      "https://pickaface.net/gallery/avatar/unr_sample_161118_2054_ynlrg.png",
    object: {
      model: "test",
      value: "Test value",
    },
  },
  {
    id: 1,
    name: "B. Jane",
    surnames: "Doe",
    address: "456 Oak Ave",
    image:
      "https://pickaface.net/gallery/avatar/unr_sample_170130_2257_9qgawp.png",
    object: {
      model: "test",
      value: "Test value",
    },
  },
  {
    id: 2,
    name: "C. Bob",
    surnames: "Smith",
    address: "789 Pine Rd",
    image:
      "https://pickaface.net/gallery/avatar/unr_sample_161118_2054_ynlrg.png",
    object: {
      model: "test",
      value: "Another value",
    },
  },
];

// Basic story with essential features
export const Basic: ComponentStoryObj<typeof PaginatedTable> = {
  args: {
    dataSource,
    columns,
    isLoading: false,
    height: 400,
    headerCheckboxState: "unchecked",
    onHeaderCheckboxClick: () => console.log("Header checkbox clicked"),
    onRowSelectionChange: (changedRow) => {
      console.log("Row selection changed:", changedRow);
    },
    onRowDoubleClick: (record) => {
      console.log("Double clicked record:", record);
    },
    strings: {
      resetTableViewLabel: "Reset View",
      changeToInfiniteLabel: "Switch to Infinite",
      changeToPaginatedLabel: "Switch to Paginated",
    },
  },
};

// Story with status column
const StatusIndicator: React.FC<{ status: string }> = ({ status }) => {
  return status === "active" ? (
    <CheckCircleOutlined style={{ color: "#52c41a" }} />
  ) : (
    <CloseCircleOutlined style={{ color: "#ff4d4f" }} />
  );
};

export const WithStatus: ComponentStoryObj<typeof PaginatedTable> = {
  args: {
    ...Basic.args,
    hasStatusColumn: true,
    onRowStatus: (item: any) => (item.id % 2 === 0 ? "active" : "inactive"),
    statusComponent: (status: string) => <StatusIndicator status={status} />,
  },
};

// Story with sorting
export const WithSorting: ComponentStoryObj<typeof PaginatedTable> = {
  args: {
    ...Basic.args,
    initialSortState: [{ colId: "name", sort: "asc", sortIndex: 0 }],
    onSortChange: (state) => {
      console.log("Sort state changed:", state);
    },
  },
};

// Story demonstrating column state persistence
export const WithColumnState = () => {
  const [columnState, setColumnState] = useState<any[]>([]);

  return (
    <div>
      <PaginatedTable
        {...Basic.args}
        onColumnChanged={(state) => {
          console.log("Column state changed:", state);
          setColumnState(state);
        }}
        onGetColumnsState={() => columnState}
      />
      <div style={{ marginTop: 16 }}>
        <Button onClick={() => setColumnState([])}>Reset Column State</Button>
      </div>
    </div>
  );
};

// Story with heavy data
export const HeavyData = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState<any[]>([]);

  React.useEffect(() => {
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      setData(heavyTable);
      setIsLoading(false);
    }, 1000);
  }, []);

  return (
    <PaginatedTable
      {...Basic.args}
      dataSource={data}
      isLoading={isLoading}
      height={600}
    />
  );
};

// Story demonstrating table type switching
export const WithTableTypeSwitch = () => {
  const [tableType, setTableType] = useState<TableType>("paginated");

  return (
    <div>
      <PaginatedTable
        {...Basic.args}
        onChangeTableType={(type) => {
          console.log("Changing table type to:", type);
          setTableType(type);
        }}
      />
      <div style={{ marginTop: 16 }}>Current table type: {tableType}</div>
    </div>
  );
};
