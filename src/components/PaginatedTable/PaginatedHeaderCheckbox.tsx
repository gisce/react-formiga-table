import React, { memo, useEffect } from "react";

type CheckboxState = "checked" | "unchecked" | "indeterminate";
export type { CheckboxState };

interface PaginatedHeaderCheckboxCompProps {
  state: CheckboxState;
  onClick: () => void;
}

const PaginatedHeaderCheckboxComp = memo(
  ({ state, onClick }: PaginatedHeaderCheckboxCompProps) => {
    const checkboxRef = React.useRef<HTMLInputElement>(null);

    useEffect(() => {
      const cbRef = checkboxRef.current;
      if (cbRef) {
        if (state === "checked") {
          cbRef.checked = true;
          cbRef.indeterminate = false;
        } else if (state === "unchecked") {
          cbRef.checked = false;
          cbRef.indeterminate = false;
        } else if (state === "indeterminate") {
          cbRef.checked = false;
          cbRef.indeterminate = true;
        }
      }
    }, [state]);

    return (
      <input
        style={{
          width: "13px",
          height: "13px",
          border: "1px solid grey",
          cursor: "pointer",
          margin: 0,
        }}
        onDoubleClick={(e) => {
          e.stopPropagation();
        }}
        ref={checkboxRef}
        type="checkbox"
        onChange={onClick}
        checked={state === "checked"}
        tabIndex={-1}
      />
    );
  },
);

PaginatedHeaderCheckboxComp.displayName = "PaginatedHeaderCheckboxComp";

interface PaginatedHeaderCheckboxProps {
  state: CheckboxState;
  onClick: () => void;
}

export const PaginatedHeaderCheckbox = memo(
  ({ state, onClick }: PaginatedHeaderCheckboxProps) => {
    return <PaginatedHeaderCheckboxComp state={state} onClick={onClick} />;
  },
);

PaginatedHeaderCheckbox.displayName = "PaginatedHeaderCheckbox";
