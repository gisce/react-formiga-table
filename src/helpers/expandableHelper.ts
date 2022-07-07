export type ExpandableItem = {
  id: number;
  child_id?: Array<number>;
};

export type ExpandableItemUi = {
  id: string;
  child_id?: Array<string>;
  children?: ExpandableItemUi[];
  isLoading: boolean;
};

// A recursion method for finding the item
// inside the items nested array
export const findDeepItem = (
  id: string,
  items: Array<ExpandableItemUi>
): ExpandableItemUi | undefined => {
  for (const item of items || []) {
    if (item.id == id) return item;

    if (item.children) {
      const _item = findDeepItem(id, item.children);
      if (_item) return _item;
    }
  }
};

// A recursion method for finding the item inside nested array
// and updating that object with the passed one.
// Returns the updated nested array
export const updateDeepItem = (
  menuItemUi: ExpandableItemUi,
  items: Array<ExpandableItemUi>
): Array<ExpandableItemUi> => {
  return items.map((item: ExpandableItemUi) => {
    return item.id === menuItemUi.id
      ? menuItemUi
      : {
          ...item,
          children: item.children
            ? updateDeepItem(menuItemUi, item.children!)
            : undefined,
        };
  });
};

// In order to get the tree menu simplified, we set item id's composed with their parents id
// and splitted by a dash.
// e.g:
// A submenu item with id 84, who's child of 17, and being item with id 17 at the same time child
// of 16, will result in a compound id for submenu item 84 of "16-17-84".
// Here, we retreive the childest id, so, in the previous example, this will return "84".
export const getChildestId = (compoundId: string): string => {
  return compoundId.indexOf("-") !== -1
    ? compoundId.split("-")[compoundId.split("-").length - 1]
    : compoundId;
};

export const itemHasChilds = (menuItem: ExpandableItemUi): boolean => {
  return (menuItem.child_id && menuItem.child_id.length > 0)!;
};

export const getCompoundId = ({
  parentId,
  childId,
}: {
  parentId?: string;
  childId: string;
}): string => {
  return parentId ? `${parentId}-${childId}` : childId;
};
