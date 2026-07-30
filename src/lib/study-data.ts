export type Flashcard = {
  id: number;
  front: string;
  back: string;
};

export type QuizQuestion = {
  id: number;
  prompt: string;
  options: string[];
  answerIndex: number;
};

export const flashcards: Flashcard[] = [
  { id: 1, front: "What is mitosis?", back: "Cell division producing two genetically identical daughter cells." },
  { id: 2, front: "Define osmosis", back: "Movement of water across a semipermeable membrane toward higher solute concentration." },
  { id: 3, front: "What does ATP stand for?", back: "Adenosine triphosphate — the main energy currency of the cell." },
  { id: 4, front: "Role of ribosomes", back: "Synthesize proteins by translating messenger RNA." },
  { id: 5, front: "What is photosynthesis?", back: "Plants convert light, CO₂ and water into glucose and oxygen." },
  { id: 6, front: "Define homeostasis", back: "Maintaining a stable internal environment despite external change." },
  { id: 7, front: "What is an enzyme?", back: "A protein catalyst that lowers activation energy of a reaction." },
  { id: 8, front: "Function of mitochondria", back: "Generate ATP through aerobic cellular respiration." },
  { id: 9, front: "What is DNA replication?", back: "Semi-conservative copying of DNA before cell division." },
  { id: 10, front: "Define diffusion", back: "Net movement of particles from high to low concentration." },
];

export const quizQuestions: QuizQuestion[] = [
  {
    id: 1,
    prompt: "Which organelle produces most of a cell's ATP?",
    options: ["Nucleus", "Mitochondria", "Golgi apparatus", "Lysosome"],
    answerIndex: 1,
  },
  {
    id: 2,
    prompt: "Osmosis specifically refers to the movement of…",
    options: ["Glucose", "Oxygen", "Water", "Protein"],
    answerIndex: 2,
  },
  {
    id: 3,
    prompt: "Mitosis results in how many daughter cells?",
    options: ["One", "Two", "Three", "Four"],
    answerIndex: 1,
  },
  {
    id: 4,
    prompt: "Enzymes work by…",
    options: [
      "Raising activation energy",
      "Lowering activation energy",
      "Adding heat to a reaction",
      "Consuming the substrate",
    ],
    answerIndex: 1,
  },
  {
    id: 5,
    prompt: "Photosynthesis releases which gas?",
    options: ["Nitrogen", "Carbon dioxide", "Hydrogen", "Oxygen"],
    answerIndex: 3,
  },
];
