import { memo } from "react";

type NoRowsOverlayProps = {
  message?: string;
};

export const NoRowsOverlay = memo(
  ({ message = "No results found" }: NoRowsOverlayProps) => {
    return <span style={{ color: "#333" }}>{message}</span>;
  },
);

NoRowsOverlay.displayName = "NoRowsOverlay";
