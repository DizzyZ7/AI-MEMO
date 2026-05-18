export type Mood = "POSITIVE" | "NEUTRAL" | "NEGATIVE";
export type Plan = "FREE" | "PRO" | "TEAM";
export type Role = "USER" | "TEAM_ADMIN" | "ADMIN";

export type MemoTask = {
  id: string;
  memoId?: string;
  title: string;
  done: boolean;
  dueDate?: string;
  createdAt: string;
};

export type Memo = {
  id: string;
  content: string;
  audioUrl?: string;
  transcript?: string;
  summary?: string;
  mood: Mood;
  tags: string[];
  tasks: MemoTask[];
  processed: boolean;
  createdAt: string;
  updatedAt: string;
};

export type MemoAnalysis = {
  summary: string;
  mood: Mood;
  tags: string[];
  tasks: string[];
  keyInsight?: string;
};
