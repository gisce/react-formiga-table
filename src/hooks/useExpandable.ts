import { useState, useCallback } from "react";
import {
  ExpandableItem,
  ExpandableItemUi,
  updateDeepItem,
  getCompoundId,
} from "../helpers/expandableHelper";
import { ExpandableRowIcon } from "../types";

export const useExpandable = ({
  dataSource,
  onFetchChildrenForRecord,
}: {
  dataSource: ExpandableItem[];
  onFetchChildrenForRecord?: (item: any) => Promise<any[]>;
}) => {
  const [openedKeys, setOpenedKeys] = useState<number[]>([]);
  const [items, setItems] = useState<Array<ExpandableItemUi>>(
    dataSource.map(transformData)
  );

  const toggleOpenedKey = useCallback(
    (key: number) => {
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
    (key: number) => {
      return openedKeys.includes(key);
    },
    [openedKeys]
  );

  const keyHasChilds = useCallback(
    (key: number) => {
      const item = items.find((item) => item.id === key);

      if (!item) {
        return false;
      }

      return item.child_id !== undefined && item.child_id.length > 0;
    },
    [items]
  );

  const getChildsForParent = useCallback(
    (key: number) => {
      return items.find((item) => item.id === key)?.children;
    },
    [items]
  );

  const keyIsLoading = useCallback(
    (key: number) => {
      const item = items.find((item) => item.id === key);

      if (!item) {
        return false;
      }
      return item.isLoading;
    },
    [items]
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

  const onExpandableIconClicked = useCallback(
    async (record: any) => {
      const item = items.find((item) => item.id === record.id);

      if (!item) {
        return false;
      }

      if (item.isLoading) {
        return;
      }

      if (!keyIsOpened(record.id)) {
        if (!item.children) {
          updateItem({ ...item, isLoading: true });

          try {
            const children = await onFetchChildrenForRecord?.(item);
            updateItem({ ...item, isLoading: false, children });
          } catch (err) {
            console.error(err);
            updateItem({ ...item, isLoading: false });
          }
        }
      }

      toggleOpenedKey(record.id);
    },
    [items, openedKeys]
  );

  const getExpandableStatusForRow = useCallback(
    (record: any): ExpandableRowIcon => {
      if (keyIsLoading(record.id)) {
        return "loading";
      } else if (keyHasChilds(record.id)) {
        return keyIsOpened(record.id) ? "collapse" : "expand";
      } else {
        return "none";
      }
    },
    [openedKeys, items]
  );

  return {
    openedKeys,
    setOpenedKeys,
    toggleOpenedKey,
    keyIsOpened,
    keyHasChilds,
    updateItem,
    items,
    setItems,
    onExpandableIconClicked,
    getExpandableStatusForRow,
    getChildsForParent,
  };
};

function transformData(entry: ExpandableItem): ExpandableItemUi {
  // const child_id = entry.child_id
  //   ? entry.child_id.map((childId: number) => {
  //       return getCompoundId({
  //         parentId: entry.id.toString(),
  //         childId: childId.toString(),
  //       });
  //     })
  //   : undefined;

  return {
    id: entry.id,
    child_id: entry.child_id,
    isLoading: false,
  } as ExpandableItemUi;
}
