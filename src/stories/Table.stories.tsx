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
        name: "John",
        surnames: "Doe",
        image:
          "https://pickaface.net/gallery/avatar/unr_sample_161118_2054_ynlrg.png",
        object: {
          model: "test",
          value: "Test value",
        },
      },
      {
        name: "Jane",
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
