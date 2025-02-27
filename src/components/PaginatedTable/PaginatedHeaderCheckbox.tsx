import React, {
  forwardRef,
  memo,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
} from "react";

type CheckboxState = "checked" | "unchecked" | "indeterminate";
export type { CheckboxState };

interface PaginatedHeaderCheckboxCompProps {
  onClick: () => void;
}

export interface PaginatedHeaderCheckboxRef {
  setState: (state: CheckboxState) => void;
}

// Custom hook to manage checkbox state and click handling
export function usePaginatedHeaderCheckbox(
  headerCheckboxState: CheckboxState,
  onHeaderCheckboxClick: () => void,
) {
  const headerCheckboxRef = useRef<PaginatedHeaderCheckboxRef>(null);
  const onHeaderCheckboxClickRef = useRef(onHeaderCheckboxClick);

  // Keep the click handler ref up to date
  useEffect(() => {
    onHeaderCheckboxClickRef.current = onHeaderCheckboxClick;
  }, [onHeaderCheckboxClick]);

  // Update checkbox state through ref when headerCheckboxState changes
  useEffect(() => {
    if (headerCheckboxRef.current) {
      headerCheckboxRef.current.setState(headerCheckboxState);
    }
  }, [headerCheckboxState]);

  // Memoized header component that uses refs to avoid rerenders
  const HeaderComponent = useCallback(
    () => (
      <PaginatedHeaderCheckbox
        ref={headerCheckboxRef}
        onClick={() => {
          onHeaderCheckboxClickRef.current();
        }}
      />
    ),
    [], // No dependencies needed since we're using refs
  );

  return { HeaderComponent };
}

const PaginatedHeaderCheckboxComp = memo(
  forwardRef<PaginatedHeaderCheckboxRef, PaginatedHeaderCheckboxCompProps>(
    ({ onClick }, ref) => {
      const checkboxRef = useRef<HTMLInputElement>(null);

      useImperativeHandle(ref, () => ({
        setState: (state: CheckboxState) => {
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
        },
      }));

      const handleClick = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
          e.stopPropagation();
          onClick();
        },
        [onClick],
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
          onChange={handleClick}
          tabIndex={-1}
        />
      );
    },
  ),
);

PaginatedHeaderCheckboxComp.displayName = "PaginatedHeaderCheckboxComp";

interface PaginatedHeaderCheckboxProps {
  onClick: () => void;
}

export const PaginatedHeaderCheckbox = memo(
  forwardRef<PaginatedHeaderCheckboxRef, PaginatedHeaderCheckboxProps>(
    // eslint-disable-next-line react/prop-types
    ({ onClick }, ref) => {
      return <PaginatedHeaderCheckboxComp ref={ref} onClick={onClick} />;
    },
  ),
);

PaginatedHeaderCheckbox.displayName = "PaginatedHeaderCheckbox";
