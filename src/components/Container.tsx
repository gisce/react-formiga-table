import styled from "styled-components";

export const Container = styled.div`
  overflow-x: auto;
  height: ${({ height }: { height?: number; canClick: boolean }) =>
    `${height}px` || "auto"};
  border-bottom: 1px solid #f0f0f0;

  table {
    white-space: nowrap;
    border-spacing: 0;
    width: 100%;

    tr {
      cursor: ${({ canClick }: { height?: number; canClick: boolean }) =>
        canClick ? "pointer" : "auto"};
      user-select: none;

      &:nth-child(odd) {
        background: #fff;
      }

      &:nth-child(even) {
        background: #fafafa;
      }

      &:hover {
        background-color: #f2f2f2;
      }

      td  {
        border-bottom: 1px solid #f0f0f0;
      }

      :last-child td {
        border-bottom: 0;
      }
    }

    th {
      position: sticky;
      top: 0;
      background-color: #fafafa;
      border-bottom: 1px solid #f0f0f0;
      z-index: 5;
    }

    th:hover {
      background-color: #f2f2f2;
    }

    th .arrow {
      padding-left: 10px;
      font-size: 0.65em;
      color: #bdbdbd;
    }

    th .ctx {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    th,
    td {
      margin: 0;
      padding: 0.5rem;

      :last-child {
        border-right: 0;
      }
    }
  }
`;
