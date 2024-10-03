import Dropdown from "rc-dropdown";
import Menu, { Item as MenuItem } from "rc-menu";
import "rc-dropdown/assets/index.css";
import styled from "styled-components";
import { MoreIcon } from "./icons/MoreIcon";
import { RedoIcon } from "./icons/RedoIcon";

const StyledMenuItem = styled(MenuItem)`
  padding: 7px 10px !important;
  cursor: pointer;
  font-family: -apple-system, "system-ui", "Segoe UI", Roboto, Oxygen-Sans,
    Ubuntu, Cantarell, "Helvetica Neue", sans-serif;
  display: flex;
  align-items: center;
  gap: 8px;

  &:hover {
    background-color: #f0f0f0;
  }
`;

const StyledMoreOutlined = styled(MoreIcon)`
  font-size: 1.5em;
  cursor: pointer;
  color: #000000;
`;

const StyledRedoIcon = styled(RedoIcon)`
  font-size: 12px;
  flex-shrink: 0;
`;

export type ITOptsButtonProps = {
  onResetTableView: () => void;
  resetTableViewLabel: string;
};

export const ITOptsButton = ({
  onResetTableView,
  resetTableViewLabel,
}: ITOptsButtonProps) => {
  const handleMenuClick = ({ key }: { key: string }) => {
    if (key === "1") {
      onResetTableView();
    }
  };

  const menu = (
    <Menu onClick={handleMenuClick}>
      <StyledMenuItem key="1">
        <StyledRedoIcon />
        <span>{resetTableViewLabel}</span>
      </StyledMenuItem>
    </Menu>
  );

  return (
    <Dropdown overlay={menu} trigger={["click"]}>
      <div
        style={{ display: "inline-block" }}
        aria-label="More options"
        role="button"
        tabIndex={0}
      >
        <StyledMoreOutlined />
      </div>
    </Dropdown>
  );
};
