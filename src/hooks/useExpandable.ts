import { useState, useCallback } from "react";
import { ExpandableItemUi, updateDeepItem } from "../helpers/expandableHelper";

export const useExpandable = () => {
  const [openedKeys, setOpenedKeys] = useState<string[]>([]);
  const [items, setItems] = useState<Array<ExpandableItemUi>>([]);

  const toggleOpenedKey = useCallback(
    (key: string) => {
      if (openedKeys.indexOf(key) === -1) {
        openedKeys.push(key);
        setOpenedKeys([...openedKeys]);
      } else {
        setOpenedKeys(openedKeys.filter((item) => item !== key));
      }
    },
    [openedKeys]
  );

  const keyIsOpened = useCallback(
    (key: string) => {
      return openedKeys.includes(key);
    },
    [openedKeys]
  );

  const updateItem = useCallback(
    (item: ExpandableItemUi): void => {
      // We search for the item in our local items nested array, we update it,
      // and we get the whole updated nested array
      const updatedItems = updateDeepItem(item, items);

      // We set the updated item's nested array in our state
      setItems(updatedItems);
    },
    [items]
  );

  return {
    openedKeys,
    setOpenedKeys,
    toggleOpenedKey,
    keyIsOpened,
    updateItem,
    items,
    setItems,
  };
};
