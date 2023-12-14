import { useState, useCallback, ChangeEvent } from "react";

export const useShiftSelected = (
  initialState: number[],
  change: (addOrRemove: boolean, items: number[]) => void,
) => {
  const [previousSelected, setPreviousSelected] = useState<number | null>(null);
  const [previousChecked, setPreviousChecked] = useState<boolean>(false);
  const [currentSelected, setCurrentSelected] = useState<number | null>(null);

  const onChange = useCallback(
    (item: number, event: ChangeEvent<HTMLInputElement>) => {
      // @ts-expect-error shiftKey is defined for click events
      if (event.nativeEvent.shiftKey) {
        const current = initialState.findIndex((x) => x === item);
        const previous = initialState.findIndex((x) => x === previousSelected);
        const previousCurrent = initialState.findIndex(
          (x) => x === currentSelected,
        );
        const start = Math.min(current, previous);
        const end = Math.max(current, previous);
        if (start > -1 && end > -1) {
          change(previousChecked, initialState.slice(start, end + 1));
          if (previousCurrent > end) {
            change(
              !previousChecked,
              initialState.slice(end + 1, previousCurrent + 1),
            );
          }
          if (previousCurrent < start) {
            change(
              !previousChecked,
              initialState.slice(previousCurrent, start),
            );
          }
          setCurrentSelected(item);
          return;
        }
      } else {
        setPreviousSelected(item);
        setCurrentSelected(null);
        setPreviousChecked(event.target.checked);
      }
      change(event.target.checked, [item]);
    },
    [
      change,
      initialState,
      previousSelected,
      setPreviousSelected,
      previousChecked,
      setPreviousChecked,
      currentSelected,
      setCurrentSelected,
    ],
  );

  return onChange;
};
