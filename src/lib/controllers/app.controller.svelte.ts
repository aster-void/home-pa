// Main application controller using Svelte stores
import type { Event, Memo, ViewMode, Suggestion } from '../types.js';
import { writable, type Writable } from 'svelte/store';
import { events, memos, suggestionLogs, eventOperations, memoOperations, suggestionLogOperations, selectedDate } from '../stores/data.js';
import { suggestionService } from '../services/suggestion.js';

interface EventFormData {
  title: string;
  start: string;
  end: string;
  isEditing: boolean;
  editingId: string | null;
}

interface MemoFormData {
  text: string;
  isEditing: boolean;
  editingId: string | null;
}

export class AppController {
  // State using Svelte stores
  currentView: Writable<'calendar' | 'personal-assistant'> = writable('calendar');
  viewMode: Writable<ViewMode> = writable('day');
  currentSuggestion: Writable<Suggestion | null> = writable(null);
  selectedDate: Writable<Date> = writable(new Date());
  isMemoOpen: Writable<boolean> = writable(false);
  
  // Form states
  eventForm: Writable<EventFormData> = writable({
    title: '',
    start: '',
    end: '',
    isEditing: false,
    editingId: null
  });
  
  memoForm: Writable<MemoFormData> = writable({
    text: '',
    isEditing: false,
    editingId: null
  });

  // Store operations (components will access stores directly)
  getEvents() {
    return eventOperations;
  }
  
  getMemos() {
    return memoOperations;
  }
  
  getSuggestionLogs() {
    return suggestionLogOperations;
  }
  
  // Methods
  setView(view: 'calendar' | 'personal-assistant'): void {
    this.currentView.set(view);
    
    // Check for suggestions when returning to calendar
    if (view === 'calendar') {
      this.checkForSuggestion();
    }
  }
  
  toggleMemo(): void {
    this.isMemoOpen.update(open => !open);
  }
  
  setMemoOpen(open: boolean): void {
    this.isMemoOpen.set(open);
  }
  
  setViewMode(mode: ViewMode): void {
    this.viewMode.set(mode);
  }
  
  setSelectedDate(date: Date): void {
    this.selectedDate.set(date);
  }
  
  // Event management
  createEvent(): void {
    let formData: any;
    this.eventForm.subscribe(data => formData = data)();
    
    
    // Validate form fields
    if (!formData.title?.trim()) {
      alert('タイトルを入力してください');
      return;
    }
    
    if (!formData.start || !formData.end) {
      alert('開始時間と終了時間を入力してください');
      return;
    }
    
    const startDate = new Date(formData.start);
    const endDate = new Date(formData.end);
    
    if (startDate >= endDate) {
      alert('終了時間は開始時間より後にしてください');
      return;
    }
    
    // Check if event is in the past
    const now = new Date();
    if (startDate < now) {
      alert('過去の時間に予定を作成することはできません');
      return;
    }
    
    const newEvent = eventOperations.create({
      title: formData.title.trim(),
      start: startDate,
      end: endDate
    });
    
    
    this.resetEventForm();
    this.checkForSuggestion();
  }
  
  editEvent(event: Event): void {
    this.eventForm.set({
      title: event.title,
      start: event.start.toISOString().slice(0, 16),
      end: event.end.toISOString().slice(0, 16),
      isEditing: true,
      editingId: event.id
    });
  }
  
  updateEvent(): void {
    let formData: any;
    this.eventForm.subscribe(data => formData = data)();
    
    if (!formData.editingId) return;
    
    const startDate = new Date(formData.start);
    const endDate = new Date(formData.end);
    
    if (startDate >= endDate) {
      alert('終了時間は開始時間より後にしてください');
      return;
    }
    
    eventOperations.update(formData.editingId, {
      title: formData.title,
      start: startDate,
      end: endDate
    });
    
    this.resetEventForm();
  }
  
  deleteEvent(id: string): void {
    eventOperations.delete(id);
  }
  
  resetEventForm(): void {
    // Set default start/end times for new events
    const now = new Date();
    const startTime = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour from now
    const endTime = new Date(startTime.getTime() + 60 * 60 * 1000); // 2 hours from now
    
    this.eventForm.set({
      title: '',
      start: startTime.toISOString().slice(0, 16),
      end: endTime.toISOString().slice(0, 16),
      isEditing: false,
      editingId: null
    });
  }
  
  // Memo management
  createMemo(): void {
    let formData: any;
    this.memoForm.subscribe(data => formData = data)();
    
    if (!formData.text.trim()) {
      return;
    }
    
    memoOperations.create(formData.text.trim());
    this.resetMemoForm();
  }
  
  editMemo(memo: Memo): void {
    this.memoForm.set({
      text: memo.text,
      isEditing: true,
      editingId: memo.id
    });
  }
  
  updateMemo(): void {
    let formData: any;
    this.memoForm.subscribe(data => formData = data)();
    
    if (!formData.editingId) return;
    
    memoOperations.update(formData.editingId, formData.text.trim());
    this.resetMemoForm();
  }
  
  deleteMemo(id: string): void {
    memoOperations.delete(id);
  }
  
  resetMemoForm(): void {
    this.memoForm.set({
      text: '',
      isEditing: false,
      editingId: null
    });
  }
  
  // Suggestion management
  checkForSuggestion(): void {
    if (suggestionService.hasRecentSuggestion()) {
      return;
    }
    
    const suggestion = suggestionService.checkForSuggestion();
    this.currentSuggestion.set(suggestion);
  }
  
  reactToSuggestion(reaction: 'accepted' | 'rejected' | 'later'): void {
    let suggestion: any;
    this.currentSuggestion.subscribe(data => suggestion = data)();
    
    if (!suggestion) return;
    
    suggestionService.logReaction(suggestion, reaction);
    this.currentSuggestion.set(null);
  }
  
  dismissSuggestion(): void {
    this.currentSuggestion.set(null);
  }
  
  // Utility methods
  formatDateTime(date: Date): string {
    return date.toLocaleString('ja-JP', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
  
  formatDate(date: Date): string {
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
  
  navigateDate(days: number): void {
    let currentDate: Date = new Date();
    
    // Get current date from store
    this.selectedDate.subscribe(date => {
      currentDate = new Date(date);
    })();
    
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + days);
    this.setSelectedDate(newDate);
  }
  
  
  constructor() {
    this.selectedDate.set(new Date());
    this.initialize();
  }

  // Initialize app
  initialize(): void {
    // Set default start/end times for new events
    const now = new Date();
    const startTime = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour from now
    const endTime = new Date(startTime.getTime() + 60 * 60 * 1000); // 2 hours from now
    
    this.eventForm.update(form => ({
      ...form,
      start: startTime.toISOString().slice(0, 16),
      end: endTime.toISOString().slice(0, 16)
    }));
    
    // Check for initial suggestion
    this.checkForSuggestion();
  }
}
