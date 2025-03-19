import Dropdown from "rc-dropdown";
import Menu, { Item as MenuItem } from "rc-menu";
import "rc-dropdown/assets/index.css";
import styled from "styled-components";
import { MoreIcon } from "./icons/MoreIcon";
import { RedoIcon } from "./icons/RedoIcon";
import { TableType } from "@/types";
import { SwapIcon } from "./icons/SwapIcon";

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

const StyledSwapIcon = styled(SwapIcon)`
  font-size: 12px;
  flex-shrink: 0;
`;

export type ITOptsButtonProps = {
  onResetTableView: () => void;
  resetTableViewLabel: string;
  currentTableType: TableType;
  onChangeTableType?: (targetType: TableType) => void;
  changeToInfiniteLabel: string;
  changeToPaginatedLabel: string;
};

export const ITOptsButton = ({
  onResetTableView,
  resetTableViewLabel,
  currentTableType,
  onChangeTableType,
  changeToInfiniteLabel,
  changeToPaginatedLabel,
}: ITOptsButtonProps) => {
  const handleMenuClick = ({ key }: { key: string }) => {
    if (key === "1") {
      onResetTableView();
    } else if (key === "2") {
      const targetType: TableType =
        currentTableType === "paginated" ? "infinite" : "paginated";
      onChangeTableType?.(targetType);
    }
  };

  const menu = (
    <Menu onClick={handleMenuClick}>
      <StyledMenuItem key="1">
        <StyledRedoIcon />
        <span>{resetTableViewLabel}</span>
      </StyledMenuItem>
      {onChangeTableType && (
        <StyledMenuItem key="2">
          <StyledSwapIcon />
          <span>
            {currentTableType === "paginated"
              ? changeToInfiniteLabel
              : changeToPaginatedLabel}
          </span>
        </StyledMenuItem>
      )}
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
