export const getPersistedColumnState = ({
  actualColumnKeys,
  persistedColumnState,
}: {
  actualColumnKeys: string[];
  persistedColumnState: any[];
}) => {
  if (!persistedColumnState) {
    return undefined;
  }
  const persistedColumnKeys = persistedColumnState.map(
    (col) => col.colId as string,
  );
  // we now have to sort both actualColumnKeys and persistedColumnKeys, and detect if there are differences
  const sortedActualColumnKeys = [...actualColumnKeys].sort();
  const sortedPersistedColumnKeys = [...persistedColumnKeys].sort();
  const areColumnKeysEqual =
    JSON.stringify(sortedActualColumnKeys) ===
    JSON.stringify(sortedPersistedColumnKeys);
  if (!areColumnKeysEqual) {
    return undefined;
  }
  return persistedColumnState;
};
