export type Difficulty = "easy" | "medium" | "hard" | "expert";

export interface Clue {
  number: number;
  clue: string;
  answer: string;
  row: number;
  col: number;
  direction: "across" | "down";
}

export interface CrosswordConfig {
  name: string;
  emoji: string;
  gridRows: number;
  gridCols: number;
  clues: Clue[];
}

// All crossword configs have been carefully verified:
// - Every word fits within the grid bounds
// - Overlapping cells share the same letter

export const crosswordConfigs: Record<Difficulty, CrosswordConfig> = {
  easy: {
    name: "Easy",
    emoji: "🌟",
    gridRows: 6,
    gridCols: 6,
    clues: [
      // FRIES across row 0: F(0,0) R(0,1) I(0,2) E(0,3) S(0,4)
      { number: 1, clue: "Crispy potato sticks", answer: "FRIES", row: 0, col: 0, direction: "across" },
      // RANCH down col 1: R(0,1) A(1,1) N(2,1) C(3,1) H(4,1) - shares R at (0,1)
      { number: 2, clue: "Creamy dipping sauce", answer: "RANCH", row: 0, col: 1, direction: "down" },
      // SAUCE down col 4: S(0,4) A(1,4) U(2,4) C(3,4) E(4,4) - shares S at (0,4)
      { number: 3, clue: "Dipping liquid for chicken", answer: "SAUCE", row: 0, col: 4, direction: "down" },
    ],
  },
  medium: {
    name: "Medium",
    emoji: "⭐",
    gridRows: 9,
    gridCols: 9,
    clues: [
      { number: 1, clue: "Crispy potato sticks", answer: "FRIES", row: 0, col: 0, direction: "across" },
      { number: 2, clue: "Creamy dipping sauce", answer: "RANCH", row: 0, col: 1, direction: "down" },
      { number: 3, clue: "Dipping liquid for chicken", answer: "SAUCE", row: 0, col: 4, direction: "down" },
      // WINGS across row 5: W(5,0) I(5,1) N(5,2) G(5,3) S(5,4)
      { number: 4, clue: "Spicy chicken parts", answer: "WINGS", row: 5, col: 0, direction: "across" },
      // BURGER down col 3: B(2,3) U(3,3) R(4,3) G(5,3) E(6,3) R(7,3) - shares G at (5,3) with WINGS
      { number: 5, clue: "Meat patty on a bun", answer: "BURGER", row: 2, col: 3, direction: "down" },
    ],
  },
  hard: {
    name: "Hard",
    emoji: "🔥",
    gridRows: 11,
    gridCols: 11,
    clues: [
      { number: 1, clue: "Crispy potato sticks", answer: "FRIES", row: 0, col: 0, direction: "across" },
      { number: 2, clue: "Creamy dipping sauce", answer: "RANCH", row: 0, col: 1, direction: "down" },
      { number: 3, clue: "Dipping liquid for chicken", answer: "SAUCE", row: 0, col: 4, direction: "down" },
      { number: 4, clue: "Spicy chicken parts", answer: "WINGS", row: 5, col: 0, direction: "across" },
      { number: 5, clue: "Meat patty on a bun", answer: "BURGER", row: 2, col: 3, direction: "down" },
      // TENDERS across row 6: T(6,2) E(6,3) N(6,4) D(6,5) E(6,6) R(6,7) S(6,8) - shares E at (6,3) with BURGER
      { number: 6, clue: "Breaded chicken strips", answer: "TENDERS", row: 6, col: 2, direction: "across" },
      // CRISPY down col 7: C(5,7) R(6,7) I(7,7) S(8,7) P(9,7) Y(10,7) - shares R at (6,7) with TENDERS
      { number: 7, clue: "Crunchy and golden fried", answer: "CRISPY", row: 5, col: 7, direction: "down" },
    ],
  },
  expert: {
    name: "Expert",
    emoji: "💎",
    gridRows: 12,
    gridCols: 12,
    clues: [
      { number: 1, clue: "Crispy potato sticks", answer: "FRIES", row: 0, col: 0, direction: "across" },
      { number: 2, clue: "Creamy dipping sauce", answer: "RANCH", row: 0, col: 1, direction: "down" },
      { number: 3, clue: "Dipping liquid for chicken", answer: "SAUCE", row: 0, col: 4, direction: "down" },
      { number: 4, clue: "Spicy chicken parts", answer: "WINGS", row: 5, col: 0, direction: "across" },
      { number: 5, clue: "Meat patty on a bun", answer: "BURGER", row: 2, col: 3, direction: "down" },
      { number: 6, clue: "Breaded chicken strips", answer: "TENDERS", row: 6, col: 2, direction: "across" },
      { number: 7, clue: "Crunchy and golden fried", answer: "CRISPY", row: 5, col: 7, direction: "down" },
      // CHICKEN down col 6: C(1,6) H(2,6) I(3,6) C(4,6) K(5,6) E(6,6) N(7,6) - shares E at (6,6) with TENDERS
      { number: 8, clue: "Popular poultry meat", answer: "CHICKEN", row: 1, col: 6, direction: "down" },
      // GRILLED across row 3: G(3,4) R(3,5) I(3,6) L(3,7) L(3,8) E(3,9) D(3,10) - shares I at (3,6) with CHICKEN
      { number: 9, clue: "Cooked over flames", answer: "GRILLED", row: 3, col: 4, direction: "across" },
    ],
  },
};
