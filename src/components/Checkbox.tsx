import React from "react";

export const Checkbox = ({
  value,
  onChange,
  id,
}: {
  value: boolean | null;
  onChange: (value: boolean | null) => void;
  id: any
}) => {
  const checkboxRef = React.useRef();

  React.useEffect(() => {
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
      onDoubleClick={(e) => {
        e.stopPropagation();
      }}
      ref={checkboxRef as any}
      type="checkbox"
      onChange={onChange as any}
      tabIndex={-1}
    />
  );
};
