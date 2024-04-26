import React, { memo, useEffect } from "react";

const HeaderCheckboxComp = memo(
  ({
    value,
    onChange,
  }: {
    value: boolean | null;
    onChange: (value: boolean | null) => void;
  }) => {
    const checkboxRef = React.useRef();

    useEffect(() => {
      const cbRef = checkboxRef.current as any;

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
    });

    return (
      <input
        style={{
          width: "16px",
          height: "16px",
          border: "1px solid grey",
          cursor: "pointer",
        }}
        onDoubleClick={(e) => {
          e.stopPropagation();
        }}
        ref={checkboxRef as any}
        type="checkbox"
        onChange={onChange as any}
        tabIndex={-1}
      />
    );
  },
);

HeaderCheckboxComp.displayName = "HeaderCheckboxComp";

export const HeaderCheckbox = memo(
  ({
    selectedRowKeysLength,
    totalRows,
    allRowSelected,
    onHeaderCheckboxChange,
  }: {
    selectedRowKeysLength: number;
    totalRows: number;
    allRowSelected: boolean;
    onHeaderCheckboxChange: (value: boolean | null) => void;
  }) => {
    const noRowsSelected = selectedRowKeysLength === 0;
    const someRowsSelected =
      selectedRowKeysLength > 0 && totalRows !== selectedRowKeysLength;

    let value: boolean | null = false;

    if (totalRows === selectedRowKeysLength && totalRows > 0) {
      value = true;
    } else if (allRowSelected) {
      value = true;
    } else if (noRowsSelected) {
      value = false;
    } else if (someRowsSelected) {
      // value = null;
      value = true;
    }

    return (
      <HeaderCheckboxComp value={value} onChange={onHeaderCheckboxChange} />
    );
  },
);

HeaderCheckbox.displayName = "HeaderCheckbox";
