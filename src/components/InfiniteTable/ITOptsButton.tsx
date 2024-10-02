import { Dropdown, MenuProps } from "antd";
import { RedoOutlined, MoreOutlined } from "@ant-design/icons";

export type ITOptsButtonProps = {
  onResetTableView: () => void;
  resetTableViewLabel: string;
};

export const ITOptsButton = ({
  onResetTableView,
  resetTableViewLabel,
}: ITOptsButtonProps) => {
  const handleMenuClick: MenuProps["onClick"] = (e) => {
    if (e.key === "1") {
      onResetTableView();
    }
  };

  const menuItems = [
    {
      key: "1",
      icon: <RedoOutlined />,
      label: resetTableViewLabel,
    },
  ];

  const menu: MenuProps = {
    items: menuItems,
    onClick: handleMenuClick,
  };

  return (
    <Dropdown menu={menu} trigger={["click"]}>
      <MoreOutlined style={{ fontSize: "1.5em", cursor: "pointer" }} />
    </Dropdown>
  );
};
