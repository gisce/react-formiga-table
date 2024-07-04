export const getPersistedColumnState = ({
  actualColumnKeys,
  persistedColumnState,
}: {
  actualColumnKeys: string[];
  persistedColumnState?: any[];
}) => {
  if (!persistedColumnState) {
    return undefined;
  }
  const persistedColumnKeys = persistedColumnState.map(
    (col) => col.colId as string,
  );
  // we now have to sort both actualColumnKeys and persistedColumnKeys, and detect if there are differences
  // we have to remove the "0" (checkbox column) from the persistedColumnKeys
  const sortedActualColumnKeys = [...actualColumnKeys].sort();
  const sortedPersistedColumnKeys = [
    ...persistedColumnKeys.filter((key) => key !== "0"),
  ].sort();
  const areColumnKeysEqual =
    JSON.stringify(sortedActualColumnKeys) ===
    JSON.stringify(sortedPersistedColumnKeys);
  if (!areColumnKeysEqual) {
    return undefined;
  }
  return persistedColumnState;
};
