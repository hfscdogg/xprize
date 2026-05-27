export type ProjectStatus =
  | "open"
  | "in_progress"
  | "judging"
  | "awarded"
  | "paid";

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  is_admin: boolean;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  slug: string;
  title: string;
  description: string;
  status: ProjectStatus;
  prize_cents: number;
  created_by: string;
  winner_id: string | null;
  awarded_at: string | null;
  prize_paid_at: string | null;
  prize_paid_in_quarter: string | null;
  created_at: string;
  updated_at: string;
}

export interface Contribution {
  id: string;
  project_id: string;
  user_id: string;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface ProjectVote {
  project_id: string;
  user_id: string;
  created_at: string;
}

export interface ContributorVote {
  project_id: string;
  voter_id: string;
  contributor_id: string;
  created_at: string;
}
