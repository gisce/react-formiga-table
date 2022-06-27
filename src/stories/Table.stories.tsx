import { ComponentMeta, ComponentStoryObj } from "@storybook/react";
import { Table } from "../Table";

const meta: ComponentMeta<typeof Table> = {
  title: "Table/Basic",
  component: Table,
};
export default meta;

export const Primary: ComponentStoryObj<typeof Table> = {
  args: {
    loading: false,
    loadingComponent: <h1>loading</h1>,
    height: 300,
    onRowSelectionChange: (selectedRows: any) => {
      // alert("selectedRows: " + JSON.stringify(selectedRows));
    },
    onRow: (record: any) => ({
      style: {},
      onDoubleClick: () => {
        alert("double clicked record" + JSON.stringify(record));
      },
    }),
    columns: [
      {
        title: "Name",
        key: "name",
        sorter: (a, b, column, desc) => {
          console.log("Name sorter");
          if (a.original[column] > b.original[column]) {
            return desc ? 1 : -1;
          } else if (a.original[column] < b.original[column]) {
            return desc ? -1 : 1;
          } else {
            return 0;
          }
        },
      },
      {
        title: "Surnames",
        key: "surnames",
        sorter: (a, b, column, desc) => {
          console.log("Surnames sorter");
          return -1;
        },
      },
      {
        title: "Image",
        key: "image",
        render: (item: any) => {
          return <img src={item} />;
        },
        sorter: (a, b, column, desc) => {
          console.log("Image sorter");
          return -1;
        },
      },
      {
        title: "Object",
        key: "object",
        render: (item: any) => {
          return <pre>{JSON.stringify(item, null, 2)}</pre>;
        },
        sorter: (a, b, column, desc) => {
          console.log("Object sorter");
          return -1;
        },
      },
    ],
    dataSource: [
      {
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
