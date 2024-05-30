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
          width: "15px",
          height: "15px",
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
    allRowSelectedMode,
  }: {
    selectedRowKeysLength: number;
    totalRows: number;
    allRowSelected: boolean;
    onHeaderCheckboxChange: (value: boolean | null) => void;
    allRowSelectedMode: boolean;
  }) => {
    const noRowsSelected = selectedRowKeysLength === 0;
    const someRowsSelected =
      selectedRowKeysLength > 0 && totalRows !== selectedRowKeysLength;

    let value: boolean | null = false;

    console.log(
      "HeaderCheckbox rendered: ",
      selectedRowKeysLength,
      totalRows,
      allRowSelected,
      allRowSelectedMode,
    );

    if (allRowSelectedMode) {
      value = true;
    } else if (totalRows === selectedRowKeysLength && totalRows > 0) {
      value = true;
    } else if (allRowSelected) {
      value = true;
    } else if (noRowsSelected) {
      value = false;
    } else if (someRowsSelected) {
      value = null;
    }

    return (
      <HeaderCheckboxComp value={value} onChange={onHeaderCheckboxChange} />
    );
  },
);

HeaderCheckbox.displayName = "HeaderCheckbox";
