import React from "react";
import { Meta, Story } from "@storybook/react";
import { InfiniteTable } from "../components/InfiniteTable/InfiniteTable";

export default {
  title: "Components/InfiniteTable",
  component: InfiniteTable,
} as Meta;

const Template: Story = (args) => <InfiniteTable {...args} />;

export const Default = Template.bind({});
Default.args = {};
