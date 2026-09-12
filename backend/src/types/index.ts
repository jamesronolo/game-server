export interface Player {
  id: string;
  socketId: string;
  name: string;
  avatar: string;
  score: number;
  isHost: boolean;
}

export interface Room {
  code: string;
  hostSocketId: string;
  gameSlug: string;
  questionSetId: string;
  status: 'waiting' | 'playing' | 'finished';
  players: Player[];
  createdAt: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'teacher' | 'student' | 'admin';
  is_pro?: boolean;
  isPro?: boolean;
  avatar_url?: string;
  avatarUrl?: string;
  class_name?: string;
  className?: string;
  created_at?: string;
  createdAt?: string;
}

export interface Game {
  id: string;
  name: string;
  slug: string;
  description: string;
  mechanic: string;
  badge: string;
  category: string;
  min_grade?: string;
  minGrade?: string;
  icon_name?: string;
  iconName?: string;
  gradient_bg?: string;
  gradientBg?: string;
  accent_color?: string;
  accentColor?: string;
  image_url?: string;
  imageUrl?: string;
}

export interface Question {
  id: string;
  setId?: string;
  promptText: string;
  answer: string;
  options: string[];
  type?: string;
  position?: number;
  hint?: string | null;
}

export interface QuestionSet {
  id: string;
  ownerId?: string;
  ownerName?: string;
  title: string;
  description?: string;
  subject?: string;
  gradeLevel?: string;
  isPublic?: boolean;
  tags?: string[] | string;
  createdAt?: string;
  updatedAt?: string;
  questions?: Question[];
}

export interface Assignment {
  id: string;
  teacherId: string;
  teacherName: string;
  classId: string;
  className: string;
  questionSetId: string;
  questionSetTitle: string;
  gameSlug: string;
  gameName: string;
  joinCode: string;
  dueDate: string;
  rewardsEnabled: boolean;
  createdAt: string;
}

export interface AttemptAnswer {
  questionId: string;
  questionPrompt: string;
  studentAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
}

export interface Attempt {
  id: string;
  assignmentId?: string;
  studentId: string;
  studentName: string;
  questionSetId: string;
  questionSetTitle: string;
  gameSlug: string;
  score: number;
  accuracy: number;
  totalQuestions: number;
  correctCount: number;
  completedAt: string;
  answers?: AttemptAnswer[];
}

export interface Sticker {
  id: string;
  name: string;
  rarity: string;
  category: string;
  emoji: string;
  description: string;
}

export interface ClassStudent {
  id: string;
  name: string;
  avatar: string;
  stars: number;
  points: number;
}

export interface StudentRewards {
  studentId: string;
  points: number;
  ticketsEarned: number;
  unlockedStickerIds: string | string[];
}

export interface StudentGrade {
  id: string;
  studentId: string;
  studentName: string;
  subject: string;
  gradeValue: string;
  term: string;
  notes: string;
  recordedBy: string;
  createdAt: string;
}

export interface ProgrammingQuizQuestion {
  id: string;
  number: number;
  question: string;
  options: string[];
  correctOption: string;
  explanation?: string;
}

export interface ProgrammingQuizAttempt {
  id: string;
  studentName: string;
  score: number;
  accuracy: number;
  totalQuestions: number;
  correctCount: number;
  completedAt: string;
  answers: any;
}
