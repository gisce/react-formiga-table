import { ComponentMeta, ComponentStoryObj } from "@storybook/react";
import { Table } from "../Table";
import { Spin } from "antd";
import "antd/dist/antd.css";
import { Sorter } from "../types";
import { PlusSquareOutlined, MinusSquareOutlined } from "@ant-design/icons";

const meta: ComponentMeta<typeof Table> = {
  title: "Table/Basic",
  component: Table,
};
export default meta;

export const Primary: ComponentStoryObj<typeof Table> = {
  args: {
    loading: false,
    loadingComponent: <Spin />,
    height: 300,
    onRowSelectionChange: (selectedRows: any) => {
      console.log("selectedRows: " + JSON.stringify(selectedRows));
    },
    onRowStyle: () => undefined,
    onRowDoubleClick: (record: any) => {
      alert("double clicked record" + JSON.stringify(record));
    },
    sorter: { id: "name", desc: true },
    onChangeSort: (sorter: Sorter | undefined) => {
      console.log("onChangeSort: ", sorter);
    },
    columns: [
      {
        title: "Name",
        key: "name",
      },
      {
        title: "Surnames",
        key: "surnames",
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
    ],
    dataSource: [
      {
        id: 0,
        name: "A. John",
        surnames: "Doe",
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
        image:
          "https://pickaface.net/gallery/avatar/unr_sample_170130_2257_9qgawp.png",
        object: {
          model: "test",
          value: "Test value",
        },
      },
    ],
  },
};

export const Expandable: ComponentStoryObj<typeof Table> = {
  args: {
    loading: false,
    loadingComponent: <Spin />,
    height: 400,
    onRowSelectionChange: (selectedRows: any) => {
      console.log("selectedRows: " + JSON.stringify(selectedRows));
    },
    onRowStyle: () => undefined,
    onRowDoubleClick: (record: any) => {
      alert("double clicked record" + JSON.stringify(record));
    },
    columns: [
      {
        title: "Name",
        key: "name",
      },
      {
        title: "Surnames",
        key: "surnames",
      },
    ],
    dataSource: [
      {
        id: 0,
        name: "A. John",
        surnames: "Doe",
      },
      {
        id: 1,
        name: "B. Jane",
        surnames: "Doe",
      },
    ],
    expandableOpts: {
      expandIcon: PlusSquareOutlined,
      collapseIcon: MinusSquareOutlined,
    },
  },
};
