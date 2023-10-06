import styled from "styled-components";
import { LocalizedStrings } from "../types";
import { useState } from "react";

export const Container = styled.div`
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

export const SelectAllRecordsRow = ({
  numberOfVisibleSelectedRows,
  totalRecords,
  numberOfTotalRows,
  translations,
  onSelectAllRecords,
  loadingComponent,
  numberOfRealSelectedRows,
}: {
  numberOfVisibleSelectedRows: number;
  totalRecords: number;
  numberOfTotalRows: number;
  translations: LocalizedStrings;
  loadingComponent: any;
  numberOfRealSelectedRows: number;
  onSelectAllRecords: () => Promise<void>;
}) => {
  const [loading, setLoading] = useState(false);

  if (numberOfTotalRows === 0) {
    return null;
  }

  if (
    numberOfVisibleSelectedRows < numberOfTotalRows &&
    numberOfRealSelectedRows <= numberOfTotalRows
  ) {
    return null;
  }

  const handleClick = async (event: any) => {
    event.preventDefault(); // prevent the default action (navigation) from happening
    event.stopPropagation();
    setLoading(true);
    await onSelectAllRecords();
    setLoading(false);
  };

  const selectRowsComponent = (
    <span>
      {translations.recordsSelected.replace(
        "{numberOfSelectedRows}",
        numberOfVisibleSelectedRows.toString()
      ) + " "}

      {loading ? (
        loadingComponent
      ) : (
        <a href="#" onClick={handleClick} style={{ fontWeight: 600 }}>
          {translations.selectAllRecords.replace(
            "{totalRecords}",
            totalRecords.toString()
          )}
        </a>
      )}
    </span>
  );

  const allRowsAreSelected = (
    <span style={{ fontWeight: 600 }}>
      {translations.allRecordsSelected.replace(
        "{totalRecords}",
        numberOfRealSelectedRows.toString()
      ) + " "}
    </span>
  );

  return (
    <Container>
      {numberOfRealSelectedRows > numberOfTotalRows
        ? allRowsAreSelected
        : selectRowsComponent}
    </Container>
  );
};
