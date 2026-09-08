import type { Book, Database } from '../types';

export const DB_KEY = 'studymate_ts_v1';
export const SESSION_KEY = 'studymate_ts_session';

export const SEED_BOOKS: Book[] = [
  {
    id: 'b1',
    title: 'Cell Biology Mastery',
    author: 'Dr. Amina Okonkwo',
    category: 'Biology',
    price: 12.99,
    cover: '🧬',
    description:
      'A complete guide to cell structure, organelles, membranes, and cellular energy. Written for secondary and early university students.',
    pages: 186,
    rating: 4.8,
    content: `# Cell Biology Mastery

## Chapter 1 — Introduction to Cells
Cells are the basic unit of life. Every living organism is made of one or more cells.

## Chapter 2 — Cell Theory
1. All living things are composed of cells.
2. The cell is the basic unit of structure and function.
3. All cells arise from pre-existing cells.

## Chapter 3 — Cell Structure
Eukaryotic cells contain membrane-bound organelles: nucleus, mitochondria, ER, Golgi, lysosomes.

## Chapter 4 — The Cell Membrane
The phospholipid bilayer regulates what enters and leaves the cell.

## Chapter 5 — Mitochondria
Mitochondria produce ATP through cellular respiration.`,
  },
  {
    id: 'b2',
    title: 'Foundations of Chemistry',
    author: 'Prof. James Rivera',
    category: 'Chemistry',
    price: 14.5,
    cover: '⚗️',
    description: 'Atoms, bonding, reactions, and stoichiometry with worked examples.',
    pages: 220,
    rating: 4.7,
    content: `# Foundations of Chemistry

## Chapter 1 — Atomic Structure
Atoms consist of protons, neutrons, and electrons.

## Chapter 2 — The Periodic Table
Elements are arranged by atomic number.

## Chapter 3 — Chemical Bonding
Ionic bonds transfer electrons; covalent bonds share electrons.

## Chapter 4 — Chemical Reactions
Balance equations and identify reaction types.

## Chapter 5 — Stoichiometry
Mole concept, molar mass, and quantitative problem solving.`,
  },
  {
    id: 'b3',
    title: 'Algebra & Problem Solving',
    author: 'Sarah Chen',
    category: 'Mathematics',
    price: 9.99,
    cover: '📐',
    description: 'Linear equations, quadratics, inequalities, and word problems.',
    pages: 160,
    rating: 4.9,
    content: `# Algebra & Problem Solving

## Chapter 1 — Linear Equations
Solve for x using inverse operations.

## Chapter 2 — Quadratics
Factoring, completing the square, and the quadratic formula.

## Chapter 3 — Inequalities
Graph solution sets on a number line.

## Chapter 4 — Word Problems
Translate language into equations.`,
  },
  {
    id: 'b4',
    title: 'World History Essentials',
    author: 'Marcus Adeyemi',
    category: 'History',
    price: 11,
    cover: '🌍',
    description: 'Civilizations, revolutions, and global conflicts with clear timelines.',
    pages: 240,
    rating: 4.6,
    content: `# World History Essentials

## Chapter 1 — Early Civilizations
Mesopotamia, Egypt, Indus Valley, and China.

## Chapter 2 — Classical Empires
Greece, Rome, Persia, and Maurya.

## Chapter 3 — Revolutions
Scientific, industrial, and political revolutions.

## Chapter 4 — The 20th Century
World wars, decolonization, and the Cold War.`,
  },
  {
    id: 'b5',
    title: 'Physics: Motion & Energy',
    author: 'Elena Petrova',
    category: 'Physics',
    price: 13.25,
    cover: '⚡',
    description: 'Kinematics, forces, work, energy, and momentum.',
    pages: 198,
    rating: 4.8,
    content: `# Physics: Motion & Energy

## Chapter 1 — Describing Motion
Displacement, velocity, and acceleration.

## Chapter 2 — Newton’s Laws
Inertia, F = ma, and action-reaction pairs.

## Chapter 3 — Work & Energy
Work-energy theorem and conservation of energy.

## Chapter 4 — Momentum
Impulse, collisions, and conservation of momentum.`,
  },
  {
    id: 'b6',
    title: 'Academic Writing Handbook',
    author: 'Olivia Grant',
    category: 'Skills',
    price: 8.5,
    cover: '✍️',
    description: 'Essay structure, thesis statements, citations, and revision.',
    pages: 120,
    rating: 4.5,
    content: `# Academic Writing Handbook

## Chapter 1 — Planning
Understand the prompt. Outline before you draft.

## Chapter 2 — Thesis & Structure
A strong thesis is specific and arguable.

## Chapter 3 — Style & Clarity
Prefer active voice. Cut filler.

## Chapter 4 — Revision
Edit for argument, then clarity, then grammar.`,
  },
];

export function defaultDB(): Database {
  return {
    users: [],
    orders: [],
    books: SEED_BOOKS,
    releases: {},
  };
}

export function loadDB(): Database {
  try {
    const raw = localStorage.getItem(DB_KEY);
    if (!raw) return defaultDB();
    return JSON.parse(raw) as Database;
  } catch {
    return defaultDB();
  }
}

export function saveDB(db: Database): void {
  localStorage.setItem(DB_KEY, JSON.stringify(db));
}

export function uid(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}
