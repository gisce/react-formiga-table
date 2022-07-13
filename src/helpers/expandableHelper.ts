export type ExpandableItem = {
  id: number;
  child_id?: Array<number>;
};

export type ExpandableItemUi = {
  id: number;
  child_id?: Array<number>;
  isLoading: boolean;
  level: number;
  data: any;
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
