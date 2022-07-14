import { useState, useCallback } from "react";
import { ExpandableRowIcon } from "../types";

export type ExpandableItem = {
  id: number;
  child_id?: Array<number>;
  isLoading: boolean;
  level: number;
  data: any;
};

export const useExpandable = ({
  dataSource,
  onFetchChildrenForRecord,
  childField = "child_id",
}: {
  dataSource: any[];
  onFetchChildrenForRecord?: (item: any) => Promise<any[]>;
  childField?: string;
}) => {
  const [openedKeys, setOpenedKeys] = useState<number[]>([]);
  const [loadedKeys, setLoadedKeys] = useState<number[]>([]);

  const [items, setItems] = useState<Array<ExpandableItem>>(
    dataSource.map((item) =>
      transformData({ entry: item, childField, level: 0 })
    )
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

  const keyIsLoaded = useCallback(
    (key: number) => {
      return loadedKeys.includes(key);
    },
    [loadedKeys]
  );

  const keyHasChilds = useCallback(
    (key: number) => {
      const item: any = items.find((item) => item.id === key);

      if (!item) {
        return false;
      }

      return item[childField] !== undefined && item[childField].length > 0;
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

  const getChildsForParent = useCallback(
    (id: number): any[] => {
      const parent: any = items.find((item) => item.id === id);
      if (!parent) {
        return [];
      }
      const child_id = parent[childField];

      if (!child_id) {
        return [];
      }

      return items.filter((item) => child_id.includes(item.id));
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

      if (!keyIsOpened(record.id) && !keyIsLoaded(item.id)) {
        setItems(
          updateItemInArray(
            {
              ...item,
              isLoading: true,
            },
            items
          )
        );

        try {
          const children = (await onFetchChildrenForRecord?.(item)) || [];
          const newItems = [
            ...items,
            ...children.map((child) =>
              transformData({ entry: child, level: item.level + 1, childField })
            ),
          ];
          loadedKeys.push(item.id);
          setLoadedKeys([...loadedKeys]);

          setItems(
            updateItemInArray(
              {
                ...item,
                isLoading: false,
              },
              newItems
            )
          );
        } catch (err) {
          console.error(err);
          setItems(
            updateItemInArray(
              {
                ...item,
                isLoading: false,
              },
              items
            )
          );
        }
      }

      toggleOpenedKey(record.id);
    },
    [items, openedKeys, loadedKeys]
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
    keyIsOpened,
    onExpandableIconClicked,
    getExpandableStatusForRow,
    getChildsForParent,
  };
};

function transformData({
  entry,
  childField,
  level = 0,
}: {
  entry: any;
  childField: string;
  level: number;
}): ExpandableItem {
  return {
    id: entry.id,
    [childField]: entry[childField],
    isLoading: false,
    level,
    data: entry,
  };
}

const updateItemInArray = (
  itemToUpdate: ExpandableItem,
  items: any[]
): any[] => {
  return items.map((localItem: any) => {
    if (localItem.id === itemToUpdate.id) {
      return itemToUpdate;
    } else return localItem;
  });
};
