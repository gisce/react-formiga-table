import { ComponentMeta, ComponentStoryObj } from "@storybook/react";
import { Table } from "../Table";

const meta: ComponentMeta<typeof Table> = {
  title: "Table/Basic",
  component: Table,
};
export default meta;

export const Primary: ComponentStoryObj<typeof Table> = {
  args: {
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
        name: "John",
        surnames: "Doe",
      },
      {
        name: "Jane",
        surnames: "Doe",
      },
    ],
  },
};
