export type Color = "w" | "b";

export type PieceType = "p" | "n" | "b" | "r" | "q" | "k";

export type Piece = {
  color: Color;
  type: PieceType;
};

export type Square = number;

export type CastlingRights = {
  w: {
    kingSide: boolean;
    queenSide: boolean;
  };
  b: {
    kingSide: boolean;
    queenSide: boolean;
  };
};

export type MoveFlag =
  | "quiet"
  | "capture"
  | "double-pawn-push"
  | "king-side-castle"
  | "queen-side-castle"
  | "en-passant"
  | "promotion";

export type Move = {
  from: Square;
  to: Square;
  flags: MoveFlag[];
  promotion?: Exclude<PieceType, "p" | "k">;
};

export type Position = {
  board: Array<Piece | null>;
  turn: Color;
  castling: CastlingRights;
  enPassant: Square | null;
  halfmoveClock: number;
  fullmoveNumber: number;
};

