import React, { memo, useEffect, useCallback } from "react";

interface HeaderCheckboxCompProps {
  value: boolean | null;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

const HeaderCheckboxComp = memo(
  ({ value, onChange }: HeaderCheckboxCompProps) => {
    const checkboxRef = React.useRef<HTMLInputElement>(null);

    useEffect(() => {
      const cbRef = checkboxRef.current;
      if (cbRef) {
        if (value === true) {
          cbRef.checked = true;
          cbRef.indeterminate = false;
        } else if (value === false) {
          cbRef.checked = false;
          cbRef.indeterminate = false;
        } else if (value === null) {
          cbRef.checked = false;
          cbRef.indeterminate = true;
        }
      }
    }, [value]);

    const handleChange = useCallback(
      (event: React.ChangeEvent<HTMLInputElement>) => {
        onChange(event);
      },
      [onChange],
    );

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
        onChange={handleChange}
        checked={value === true}
        tabIndex={-1}
      />
    );
  },
);

HeaderCheckboxComp.displayName = "HeaderCheckboxComp";

interface HeaderCheckboxProps {
  selectedRowKeysLength: number;
  totalRows: number;
  onSelectionCheckboxClicked?: (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => void;
}

export const HeaderCheckbox = memo(
  ({
    selectedRowKeysLength,
    totalRows,
    onSelectionCheckboxClicked,
  }: HeaderCheckboxProps) => {
    const value = React.useMemo(() => {
      if (selectedRowKeysLength === 0) return false;
      if (selectedRowKeysLength === totalRows && totalRows > 0) return true;
      return null;
    }, [selectedRowKeysLength, totalRows]);

    return (
      <HeaderCheckboxComp
        value={value}
        onChange={onSelectionCheckboxClicked!}
      />
    );
  },
);

HeaderCheckbox.displayName = "HeaderCheckbox";
