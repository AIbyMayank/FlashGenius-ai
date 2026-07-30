export type Difficulty = "easy" | "medium" | "hard";

export const DIFFICULTIES: Difficulty[] = ["easy", "medium", "hard"];

export type Flashcard = {
  id: number;
  front: string;
  back: string;
};

export type QuizQuestion = {
  id: number;
  difficulty: Difficulty;
  prompt: string;
  options: string[];
  answerIndex: number;
  explanation: string;
};

export type StudySet = {
  title: string;
  flashcards: Flashcard[];
  quiz: QuizQuestion[];
};

export const demoStudySet: StudySet = {
  title: "Cell Biology (demo set)",
  flashcards: [
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
  ],
  quiz: [
    {
      id: 1,
      difficulty: "easy",
      prompt: "Which organelle produces most of a cell's ATP?",
      options: ["Nucleus", "Mitochondria", "Golgi apparatus", "Lysosome"],
      answerIndex: 1,
      explanation: "Mitochondria generate ATP through aerobic respiration.",
    },
    {
      id: 2,
      difficulty: "easy",
      prompt: "Osmosis specifically refers to the movement of…",
      options: ["Glucose", "Oxygen", "Water", "Protein"],
      answerIndex: 2,
      explanation: "Osmosis is water movement across a semipermeable membrane.",
    },
    {
      id: 3,
      difficulty: "easy",
      prompt: "Mitosis results in how many daughter cells?",
      options: ["One", "Two", "Three", "Four"],
      answerIndex: 1,
      explanation: "Mitosis yields two genetically identical daughter cells.",
    },
    {
      id: 4,
      difficulty: "medium",
      prompt: "Enzymes speed up reactions because they…",
      options: [
        "Raise activation energy",
        "Lower activation energy",
        "Add heat to the reaction",
        "Are consumed as substrate",
      ],
      answerIndex: 1,
      explanation: "Enzymes are catalysts that lower activation energy.",
    },
    {
      id: 5,
      difficulty: "medium",
      prompt: "Photosynthesis and respiration are linked because one releases what the other consumes:",
      options: ["Nitrogen", "Oxygen", "Hydrogen", "Methane"],
      answerIndex: 1,
      explanation: "Photosynthesis releases oxygen, which respiration consumes to make ATP.",
    },
    {
      id: 6,
      difficulty: "medium",
      prompt: "Ribosomes need mRNA because they…",
      options: [
        "Store genetic material",
        "Translate mRNA into protein",
        "Digest waste",
        "Replicate DNA",
      ],
      answerIndex: 1,
      explanation: "Ribosomes translate the mRNA sequence into a protein chain.",
    },
    {
      id: 7,
      difficulty: "hard",
      prompt: "A cell placed in pure water will most likely…",
      options: ["Shrink", "Swell", "Stay identical", "Stop making ATP"],
      answerIndex: 1,
      explanation: "Water moves toward higher solute concentration — inward — so the cell swells.",
    },
    {
      id: 8,
      difficulty: "hard",
      prompt: "Blocking DNA replication would most directly prevent…",
      options: ["Diffusion", "Mitosis", "Osmosis", "Enzyme folding"],
      answerIndex: 1,
      explanation: "DNA must be copied before a cell can divide by mitosis.",
    },
    {
      id: 9,
      difficulty: "hard",
      prompt: "If a cell's mitochondria fail, homeostasis breaks down mainly because…",
      options: [
        "Water can no longer diffuse",
        "Energy-requiring processes lose their ATP supply",
        "Ribosomes disappear",
        "Photosynthesis reverses",
      ],
      answerIndex: 1,
      explanation: "Homeostasis depends on ATP-driven processes supplied by mitochondria.",
    },
  ],
};
