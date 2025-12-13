export interface User {
  fullname: string;
  avatarUrl: string;
  name: string;
  isLocalUse?: boolean;
  isPro: boolean;
  id: string;
  token?: string;
}

export interface HtmlHistory {
  pages: Page[];
  createdAt: Date;
  prompt: string;
}

export interface Project {
  title: string;
  html: string;
  prompts: string[];
  user_id: string;
  space_id: string;
  _id?: string;
  _updatedAt?: Date;
  _createdAt?: Date;
}

export interface Page {
  path: string;
  html: string;
}
