import React, {
  useRef,
  useState,
  useMemo,
  useEffect,
  useCallback,
} from "react";
import { ComponentMeta, ComponentStoryObj } from "@storybook/react";
import {
  PaginatedTable,
  PaginatedTableRef,
} from "../components/PaginatedTable/PaginatedTable";
import { Button, Spin } from "antd";
import { TableColumn, TableType, ExpandOptions } from "../types";
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  LoadingOutlined,
  PlusSquareOutlined,
  MinusSquareOutlined,
} from "@ant-design/icons";
import heavyTable from "./heavy_table.json";
import { CheckboxState } from "../components/PaginatedTable/PaginatedHeaderCheckbox";

const meta: ComponentMeta<typeof PaginatedTable> = {
  title: "Table/Paginated",
  component: PaginatedTable,
};
export default meta;

const columns: TableColumn[] = [
  {
    title: "Name",
    key: "name",
    render: (value: string) => {
      return <div>{value}</div>;
    },
    isSortable: true,
  },
  {
    title: "Surnames",
    render: (value: string) => {
      return <div>{value}</div>;
    },
    key: "surnames",
    isSortable: true,
  },
  {
    title: "Address",
    key: "address",
    isSortable: false,
    render: (value: string) => {
      return <div>{value}</div>;
    },
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
    image: "https://ui-avatars.com/api/?name=Alice+Johnson&background=random",
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
    image: "https://ui-avatars.com/api/?name=Alice+Johnson&background=random",
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
    image: "https://ui-avatars.com/api/?name=Alice+Johnson&background=random",
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
        dataSource={dataSource}
        columns={columns}
        isLoading={false}
        headerCheckboxState="unchecked"
        onHeaderCheckboxClick={() => {}}
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
      columns={columns}
      isLoading={isLoading}
      height={600}
      headerCheckboxState="unchecked"
      onHeaderCheckboxClick={() => {}}
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
        dataSource={dataSource}
        columns={columns}
        isLoading={false}
        headerCheckboxState="unchecked"
        onHeaderCheckboxClick={() => {}}
        onChangeTableType={(type) => {
          console.log("Changing table type to:", type);
          setTableType(type);
        }}
      />
      <div style={{ marginTop: 16 }}>Current table type: {tableType}</div>
    </div>
  );
};

// Story demonstrating expandable/tree functionality
export const Expandable = () => {
  // Define the initial top-level data
  const initialData = useMemo(
    () => [
      {
        id: 0,
        name: "A. John (CEO)",
        surnames: "Doe",
        address: "123 Main St",
        image: "https://ui-avatars.com/api/?name=John+Doe&background=random",
        object: {
          model: "test",
          value: "Level 1 - Has children [2, 3]",
        },
        child_id: [2, 3], // Indicates children exist
      },
      {
        id: 1,
        name: "B. Jane (CFO)",
        surnames: "Doe",
        address: "456 Oak Ave",
        image: "https://ui-avatars.com/api/?name=Jane+Doe&background=random",
        object: {
          model: "test",
          value: "Level 1 - Has children [4, 5]",
        },
        child_id: [4, 5], // Indicates children exist
      },
    ],
    [],
  );

  // Store all possible records (including children) in a ref for easy lookup
  // In a real app, this might come from different API calls or a larger dataset
  const allRecords = useRef<Record<number, any>>({
    0: initialData[0],
    1: initialData[1],
    // Child records to be loaded on demand
    2: {
      id: 2,
      name: "C. Bob (VP Sales)",
      surnames: "Smith",
      address: "789 Pine Rd",
      image: "https://ui-avatars.com/api/?name=Bob+Smith&background=random",
      object: { model: "test", value: "Level 2 - Has children [6, 7]" },
      child_id: [6, 7],
    },
    3: {
      id: 3,
      name: "D. Alice (VP Marketing)",
      surnames: "Johnson",
      address: "321 Elm St",
      image: "https://ui-avatars.com/api/?name=Alice+Johnson&background=random",
      object: { model: "test", value: "Level 2 - Has child [8]" },
      child_id: [8],
    },
    4: {
      id: 4,
      name: "E. Charlie (Controller)",
      surnames: "Brown",
      address: "741 Maple Dr",
      image: "https://ui-avatars.com/api/?name=Charlie+Brown&background=random",
      object: { model: "test", value: "Level 2 - Has child [9]" },
      child_id: [9],
    },
    5: {
      id: 5,
      name: "F. Diana (Treasurer)",
      surnames: "Wilson",
      address: "852 Cedar Ln",
      image: "https://ui-avatars.com/api/?name=Diana+Wilson&background=random",
      object: { model: "test", value: "Level 2 - No children" },
    },
    6: {
      id: 6,
      name: "G. Edward (Sales Manager)",
      surnames: "Davis",
      address: "963 Birch Rd",
      image: "https://ui-avatars.com/api/?name=Edward+Davis&background=random",
      object: { model: "test", value: "Level 3 - Has children [10, 11]" },
      child_id: [10, 11],
    },
    7: {
      id: 7,
      name: "H. Frank (Sales Manager)",
      surnames: "Miller",
      address: "159 Walnut St",
      image: "https://ui-avatars.com/api/?name=Frank+Miller&background=random",
      object: { model: "test", value: "Level 3 - No children" },
    },
    8: {
      id: 8,
      name: "I. Grace (Marketing Manager)",
      surnames: "Taylor",
      address: "753 Pine St",
      image: "https://ui-avatars.com/api/?name=Grace+Taylor&background=random",
      object: { model: "test", value: "Level 3 - Has child [12]" },
      child_id: [12],
    },
    9: {
      id: 9,
      name: "J. Henry (Accountant)",
      surnames: "Anderson",
      address: "951 Oak Rd",
      image:
        "https://ui-avatars.com/api/?name=Henry+Anderson&background=random",
      object: { model: "test", value: "Level 3 - No children" },
    },
    10: {
      id: 10,
      name: "K. Isabel (Sales Rep)",
      surnames: "White",
      address: "357 Elm Ave",
      image: "https://ui-avatars.com/api/?name=Isabel+White&background=random",
      object: { model: "test", value: "Level 4 - Has child [13]" },
      child_id: [13],
    },
    11: {
      id: 11,
      name: "L. Jack (Sales Rep)",
      surnames: "Clark",
      address: "246 Maple Ln",
      image: "https://ui-avatars.com/api/?name=Jack+Clark&background=random",
      object: { model: "test", value: "Level 4 - No children" },
    },
    12: {
      id: 12,
      name: "M. Kelly (Marketing Specialist)",
      surnames: "Moore",
      address: "135 Cedar Ave",
      image: "https://ui-avatars.com/api/?name=Kelly+Moore&background=random",
      object: { model: "test", value: "Level 4 - No children" },
    },
    13: {
      id: 13,
      name: "N. Leo (Junior Sales)",
      surnames: "Baker",
      address: "468 Birch St",
      image: "https://ui-avatars.com/api/?name=Leo+Baker&background=random",
      object: { model: "test", value: "Level 5 - No children" },
    },
  }).current;

  // State to manage the currently loaded data for the table
  // We start with only the top-level items
  const [results, setResults] = useState<any[]>(initialData);

  // Simulate fetching children for a given parent record
  const fetchChildren = async (parent: any): Promise<any[]> => {
    console.log("Fetching children for:", parent.name);
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 750));

    const childIdsToRetrieve: number[] = parent.child_id || [];
    const children = childIdsToRetrieve
      .map((id) => allRecords[id])
      .filter(Boolean); // Find children in our mock dataset

    console.log("Children found:", children);

    // Add newly fetched children to our main results state if they aren't already there
    // This makes them available to the useExpandable hook's internal logic
    setResults((prev) => {
      const existingIds = new Set(prev.map((item) => item.id));
      const newChildren = children.filter(
        (child) => !existingIds.has(child.id),
      );
      return [...prev, ...newChildren];
    });

    return children; // Return the fetched children to the hook
  };

  // Define the expandable options for the table
  const expandableOptions: ExpandOptions = useMemo(
    () => ({
      childField: "child_id",
      expandIcon: PlusSquareOutlined,
      collapseIcon: MinusSquareOutlined,
      loadingIcon: () => (
        <Spin indicator={<LoadingOutlined spin />} size="small" />
      ),
      onFetchChildrenForRecord: fetchChildren,
    }),
    [], // Dependencies: fetchChildren should be stable if defined outside typically
  );

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <h3>Expandable Tree Structure Demo</h3>
        <p>Click the [+] icons to load and expand child rows:</p>
      </div>
      <PaginatedTable
        // Pass the current results state which includes fetched children over time
        dataSource={results}
        columns={columns} // Using the columns defined earlier in the file
        isLoading={false} // Assuming initial load is done, loading handled by expand icon
        height={600}
        headerCheckboxState="unchecked" // Example state
        onHeaderCheckboxClick={() => console.log("Header checkbox clicked")}
        onRowSelectionChange={(changedRow) => {
          console.log("Row selection changed:", changedRow);
        }}
        onRowDoubleClick={(record) => {
          console.log("Double clicked record:", record);
        }}
        strings={{
          resetTableViewLabel: "Reset View",
          changeToInfiniteLabel: "Switch to Infinite",
          changeToPaginatedLabel: "Switch to Paginated",
        }}
        // Provide the expandable options
        expandableOpts={expandableOptions}
      />
    </div>
  );
};

// Story demonstrating auto-refresh functionality
export const WithAutoRefresh = () => {
  const tableRef = useRef<PaginatedTableRef>(null);
  const [dataCounter, setDataCounter] = useState(0);
  const [initialData] = useState(() =>
    dataSource.map((item) => ({
      ...item,
      name: `${item.name} (refresh: 0)`,
    })),
  );

  // Use updateRows to update data without flickering
  const handleForceReload = useCallback(() => {
    setDataCounter((prev) => {
      const newCounter = prev + 1;

      // Update rows using the imperative API
      const updates = dataSource.map((item) => ({
        id: item.id,
        name: `${item.name} (refresh: ${newCounter})`,
      }));

      // Use setTimeout to ensure the table is ready
      setTimeout(() => {
        tableRef.current?.updateRows(updates);
      }, 0);

      return newCounter;
    });
  }, []);

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <h3>Auto-Refresh Demo (2 seconds)</h3>
        <p>
          The table automatically refreshes every 2 seconds. Watch the refresh
          counter in the Name column.
        </p>
        <p>Current refresh count: {dataCounter}</p>
      </div>
      <PaginatedTable
        ref={tableRef}
        dataSource={initialData}
        columns={columns}
        isLoading={false}
        height={400}
        headerCheckboxState="unchecked"
        onHeaderCheckboxClick={() => console.log("Header checkbox clicked")}
        onRowSelectionChange={(changedRow) => {
          console.log("Row selection changed:", changedRow);
        }}
        onForceReload={handleForceReload}
        autoRefresh={2000}
        strings={{
          resetTableViewLabel: "Reset View",
          changeToInfiniteLabel: "Switch to Infinite",
          changeToPaginatedLabel: "Switch to Paginated",
        }}
      />
    </div>
  );
};
