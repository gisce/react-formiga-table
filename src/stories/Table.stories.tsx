import React, { useState } from "react";
import { ComponentMeta, ComponentStoryObj } from "@storybook/react";
import { Table } from "../Table";
import { Button, Spin } from "antd";
import "antd/dist/antd.css";
import { OnCellRenderOpts, Sorter } from "../types";
import {
  PlusSquareOutlined,
  MinusSquareOutlined,
  LoadingOutlined,
} from "@ant-design/icons";

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

const otherChilds = [
  { id: 2, name: "R. Kate", surnames: "Hellington", child_id: [4, 5] },
  { id: 4, name: "Four Bob", surnames: "Asdt" },
  { id: 5, name: "Five Bob", surnames: "Asdt", child_id: [6] },
  { id: 6, name: "Six thur", surnames: "Ficht" },
];

export const Expandable = (): React.ReactElement => {
  const [results, setResults] = useState<any[]>([
    {
      id: 0,
      name: "B. John",
      surnames: "Doe",
      child_id: [2],
    },
    {
      id: 1,
      name: "B. Jane",
      surnames: "Doe",
    },
  ]);

  return (
    <Table
      dataSource={results}
      columns={[
        {
          title: "Name",
          key: "name",
        },
        {
          title: "Surnames",
          key: "surnames",
        },
      ]}
      onRowSelectionChange={(selectedRows: any) => {
        console.log("selectedRows: " + JSON.stringify(selectedRows));
      }}
      onRowStyle={() => undefined}
      onRowDoubleClick={(record: any) => {
        alert("double clicked record" + JSON.stringify(record));
      }}
      loadingComponent={<Spin />}
      height={400}
      sorter={undefined}
      loading={false}
      expandableOpts={{
        childField: "child_id",
        expandIcon: PlusSquareOutlined,
        collapseIcon: MinusSquareOutlined,
        loadingIcon: LoadingOutlined,
        onFetchChildrenForRecord: async (parent: any) => {
          await new Promise((resolve) => setTimeout(resolve, 2000));
          const childIdsToRetrieve: number[] = parent.child_id;
          const filteredChilds = otherChilds.filter((item) =>
            childIdsToRetrieve.includes(item.id)
          );
          setResults([...results, ...filteredChilds]);
          return filteredChilds;
        },
      }}
    />
  );
};

export const CustomCellRender: ComponentStoryObj<typeof Table> = {
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
    onCellRender: (opts: OnCellRenderOpts) => {
      return <>onCellRender content: {JSON.stringify(opts, null, 2)}</>;
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

export const AddingMoreChilds = (): React.ReactElement => {
  const [results, setResults] = useState<any[]>([
    {
      id: 0,
      name: "B. John",
      surnames: "Doe",
      child_id: [2],
    },
    {
      id: 1,
      name: "B. Jane",
      surnames: "Doe",
    },
  ]);

  return (
    <>
      <Button
        style={{ marginBottom: 20 }}
        onClick={() => {
          setResults([
            {
              id: 0,
              name: "B. John",
              surnames: "Doe",
              child_id: [2],
            },
            {
              id: 1,
              name: "B. Jane",
              surnames: "Doe",
            },
            {
              id: 2,
              name: "B. Doe",
              surnames: "Jhane",
            },
            {
              id: 3,
              name: "B. Minion",
              surnames: "Senesio",
            },
            {
              id: 4,
              name: "B. Clark",
              surnames: "Harrisson",
            },
          ]);
        }}
      >
        Add more childs
      </Button>
      <Table
        dataSource={results}
        columns={[
          {
            title: "Name",
            key: "name",
          },
          {
            title: "Surnames",
            key: "surnames",
          },
        ]}
        onRowSelectionChange={(selectedRows: any) => {
          console.log("selectedRows: " + JSON.stringify(selectedRows));
        }}
        onRowStyle={() => undefined}
        onRowDoubleClick={(record: any) => {
          alert("double clicked record" + JSON.stringify(record));
        }}
        loadingComponent={<Spin />}
        height={400}
        sorter={undefined}
        loading={false}
      />
    </>
  );
};
