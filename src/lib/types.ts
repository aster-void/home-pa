// Core data models for M1 specification

export interface Event {
  id: string;
  title: string;
  start: Date;
  end: Date;
}

export interface Memo {
  id: string;
  text: string;
}

export interface SuggestionLog {
  id: string;
  at: Date;
  gapMin: number;
  eventId?: string;
  reaction: 'accepted' | 'rejected' | 'later';
}

export interface Suggestion {
  id: string;
  template: string;
  gapMin: number;
  eventId?: string;
}

export type ViewMode = 'day' | 'list';
export type ReactionType = 'accepted' | 'rejected' | 'later';
