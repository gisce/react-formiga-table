import styled from "styled-components";

type ContainerProps = {
  height?: number,
  canClick: boolean,
  readonly?: boolean,
}

export const Container = styled.div`
  overflow-x: auto;
  height: ${({ height }: ContainerProps) =>
    `${height}px` || "auto"};
  border-bottom: 1px solid #f0f0f0;

  table {
    white-space: nowrap;
    border-spacing: 0;
    width: 100%;

    tr {
      cursor: ${({ canClick }: ContainerProps) =>
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

    /* Responsive */
    @media (max-width: 991px) {
      thead {
        display: none;
      }

      td:nth-of-type(1) {
        width: ${(props: ContainerProps) => props.readonly ? 'auto !important' : '50px'};
        display: ${(props: ContainerProps) => props.readonly ? 'block' : ''};
      }

      td:nth-of-type(n + 2) {
        display: block;
        width: auto !important;
      }

      .rft-label {
        display: block !important;
      }
    }
  }
`;
