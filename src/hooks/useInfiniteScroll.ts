import { useCallback, useEffect, useState } from "react";

export const useInfiniteScroll = ({
  parentRef,
  initialNumberOfRows,
  numberOfRowsToLoad,
  fetchRows,
}: {
  parentRef: React.MutableRefObject<null>;
  initialNumberOfRows: number;
  numberOfRowsToLoad: number;
  fetchRows: (startIndex: number, stopIndex: number) => Promise<any[]>;
}) => {
  const [dataSource, setDataSource] = useState<any[]>([]);
  const [moreRowsLoading, setMoreRowsLoading] = useState<boolean>(false);
  const [allRowsLoaded, setAllRowsLoaded] = useState<boolean>(false);

  useEffect(() => {
    loadMoreRows(initialNumberOfRows);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadMoreRows = useCallback(
    async (amount: number) => {
      setMoreRowsLoading(true);
      const newRows = await fetchRows(
        dataSource.length,
        dataSource.length + amount,
      );
      if (newRows.length === 0) {
        setAllRowsLoaded(true);
      }
      setDataSource([...dataSource, ...newRows]);
      setMoreRowsLoading(false);
    },
    [dataSource, fetchRows],
  );

  const fetchMoreOnBottomReached = useCallback(
    async (event: React.UIEvent<HTMLDivElement, UIEvent>) => {
      const containerRefElement = event.target as HTMLDivElement;
      event.stopPropagation();
      if (containerRefElement) {
        const { scrollHeight, scrollTop, clientHeight } = containerRefElement;
        if (moreRowsLoading) event.preventDefault();
        if (
          !allRowsLoaded &&
          scrollHeight - scrollTop - clientHeight < 500 &&
          !moreRowsLoading
        ) {
          await loadMoreRows(numberOfRowsToLoad);
        }
      }
    },
    [allRowsLoaded, loadMoreRows, moreRowsLoading, numberOfRowsToLoad],
  );

  return {
    dataSource,
    moreRowsLoading,
    loadMoreRows,
    fetchMoreOnBottomReached,
  };
};
