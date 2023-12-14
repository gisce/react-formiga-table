import { useState, useCallback, useRef, useEffect } from "react";
import { ExpandableRowIcon } from "../types";

export type ExpandableItem = {
  id: number;
  child_id?: number[];
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
  const idLevelMap = useRef<Map<number, number>>(new Map<number, number>());

  const [items, setItems] = useState<ExpandableItem[]>(
    dataSource.map((item) =>
      transformData({
        entry: item,
        childField,
        idLevelMap: idLevelMap.current,
      }),
    ),
  );

  useEffect(() => {
    setItems(
      dataSource.map((item) =>
        transformData({
          entry: item,
          childField,
          idLevelMap: idLevelMap.current,
        }),
      ),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataSource]);

  const toggleOpenedKey = useCallback(
    (key: number) => {
      if (openedKeys.indexOf(key) === -1) {
        openedKeys.push(key);
        setOpenedKeys([...openedKeys]);
      } else {
        setOpenedKeys(openedKeys.filter((item) => item !== key));
      }
    },
    [openedKeys],
  );

  const keyIsOpened = useCallback(
    (key: number) => {
      return openedKeys.includes(key);
    },
    [openedKeys],
  );

  const keyIsLoaded = useCallback(
    (key: number) => {
      return loadedKeys.includes(key);
    },
    [loadedKeys],
  );

  const getLevelForKey = (key: number) => {
    return idLevelMap.current.get(key) || 0;
  };

  const keyHasChilds = useCallback(
    (key: number) => {
      const item: any = items.find((item) => item.id === key);

      if (!item) {
        return false;
      }

      return item[childField] !== undefined && item[childField].length > 0;
    },
    [childField, items],
  );

  const keyIsLoading = useCallback(
    (key: number) => {
      const item = items.find((item) => item.id === key);

      if (!item) {
        return false;
      }
      return item.isLoading;
    },
    [items],
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
    [childField, items],
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
            items,
          ),
        );

        try {
          const children = (await onFetchChildrenForRecord?.(item)) || [];
          children.forEach((child) => {
            idLevelMap.current.set(child.id, item.level + 1);
          });
          setItems(
            updateItemInArray(
              {
                ...item,
                isLoading: false,
              },
              [
                ...items,
                ...children.map((child) => {
                  return transformData({
                    entry: child,
                    childField,
                    idLevelMap: idLevelMap.current,
                  });
                }),
              ],
            ),
          );

          loadedKeys.push(item.id);
          setLoadedKeys([...loadedKeys]);
        } catch (err) {
          console.error(err);
          setItems(
            updateItemInArray(
              {
                ...item,
                isLoading: false,
              },
              items,
            ),
          );
        }
      }

      toggleOpenedKey(record.id);
    },
    [
      items,
      keyIsOpened,
      keyIsLoaded,
      toggleOpenedKey,
      onFetchChildrenForRecord,
      loadedKeys,
      childField,
    ],
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
    [keyIsLoading, keyHasChilds, keyIsOpened],
  );

  const getAllVisibleKeys = useCallback((): number[] => {
    const firstLevelItems = items.filter((item) => item.level === 0);
    const visibleKeys = firstLevelItems.map((item) => item.id);

    openedKeys.forEach((key: number) => {
      const item: any = items.find((lItem) => lItem.id === key);
      if (!item) {
        return;
      }
      if (!item.child_id) {
        return;
      }
      item.child_id.forEach((child_key: number) => {
        if (!visibleKeys.includes(child_key)) {
          visibleKeys.push(child_key);
        }
      });
    });
    return visibleKeys;
  }, [openedKeys, items]);

  return {
    keyIsOpened,
    onExpandableIconClicked,
    getExpandableStatusForRow,
    getChildsForParent,
    getAllVisibleKeys,
    getLevelForKey,
  };
};

function transformData({
  entry,
  childField,
  idLevelMap,
}: {
  entry: any;
  childField: string;
  idLevelMap: Map<number, number>;
}): ExpandableItem {
  return {
    id: entry.id,
    [childField]: entry[childField],
    isLoading: false,
    level: idLevelMap.get(entry.id) || 0,
    data: entry,
  };
}

const updateItemInArray = (
  itemToUpdate: ExpandableItem,
  items: any[],
): any[] => {
  return items.map((localItem: any) => {
    if (localItem.id === itemToUpdate.id) {
      return itemToUpdate;
    } else return localItem;
  });
};
