// Main application controller using Svelte 5 runes
import type { Event, Memo, ViewMode, Suggestion } from '../types.js';
import { events, memos, suggestionLogs, eventOperations, memoOperations, suggestionLogOperations, selectedDate } from '../stores/data.js';
import { suggestionService } from '../services/suggestion.js';

export class AppController {
  // State using Svelte 5 runes
  currentView = $state<'calendar' | 'memo' | 'logs'>('calendar');
  viewMode = $state<ViewMode>('day');
  currentSuggestion = $state(null as Suggestion | null);
  
  // Form states
  eventForm = $state({
    title: '',
    start: '',
    end: '',
    isEditing: false,
    editingId: null as string | null
  });
  
  memoForm = $state({
    text: '',
    isEditing: false,
    editingId: null as string | null
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
  setView(view: 'calendar' | 'memo' | 'logs'): void {
    this.currentView = view;
    
    // Check for suggestions when returning to calendar
    if (view === 'calendar') {
      this.checkForSuggestion();
    }
  }
  
  setViewMode(mode: ViewMode): void {
    this.viewMode = mode;
  }
  
  setSelectedDate(date: Date): void {
    selectedDate.set(date);
  }
  
  // Event management
  createEvent(): void {
    // Validate form fields
    if (!this.eventForm.title?.trim()) {
      alert('タイトルを入力してください');
      return;
    }
    
    if (!this.eventForm.start || !this.eventForm.end) {
      alert('開始時間と終了時間を入力してください');
      return;
    }
    
    const startDate = new Date(this.eventForm.start);
    const endDate = new Date(this.eventForm.end);
    
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
    
    eventOperations.create({
      title: this.eventForm.title.trim(),
      start: startDate,
      end: endDate
    });
    
    this.resetEventForm();
    this.checkForSuggestion();
    
    // Show success message (optional)
    console.log('Event created successfully');
  }
  
  editEvent(event: Event): void {
    this.eventForm = {
      title: event.title,
      start: event.start.toISOString().slice(0, 16),
      end: event.end.toISOString().slice(0, 16),
      isEditing: true,
      editingId: event.id
    };
  }
  
  updateEvent(): void {
    if (!this.eventForm.editingId) return;
    
    const startDate = new Date(this.eventForm.start);
    const endDate = new Date(this.eventForm.end);
    
    if (startDate >= endDate) {
      alert('終了時間は開始時間より後にしてください');
      return;
    }
    
    eventOperations.update(this.eventForm.editingId, {
      title: this.eventForm.title,
      start: startDate,
      end: endDate
    });
    
    this.resetEventForm();
  }
  
  deleteEvent(id: string): void {
    if (confirm('この予定を削除しますか？')) {
      eventOperations.delete(id);
    }
  }
  
  resetEventForm(): void {
    // Set default start/end times for new events
    const now = new Date();
    const startTime = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour from now
    const endTime = new Date(startTime.getTime() + 60 * 60 * 1000); // 2 hours from now
    
    this.eventForm = {
      title: '',
      start: startTime.toISOString().slice(0, 16),
      end: endTime.toISOString().slice(0, 16),
      isEditing: false,
      editingId: null
    };
  }
  
  // Memo management
  createMemo(): void {
    if (!this.memoForm.text.trim()) {
      return;
    }
    
    memoOperations.create(this.memoForm.text.trim());
    this.resetMemoForm();
  }
  
  editMemo(memo: Memo): void {
    this.memoForm = {
      text: memo.text,
      isEditing: true,
      editingId: memo.id
    };
  }
  
  updateMemo(): void {
    if (!this.memoForm.editingId) return;
    
    memoOperations.update(this.memoForm.editingId, this.memoForm.text.trim());
    this.resetMemoForm();
  }
  
  deleteMemo(id: string): void {
    if (confirm('このメモを削除しますか？')) {
      memoOperations.delete(id);
    }
  }
  
  resetMemoForm(): void {
    this.memoForm = {
      text: '',
      isEditing: false,
      editingId: null
    };
  }
  
  // Suggestion management
  checkForSuggestion(): void {
    if (suggestionService.hasRecentSuggestion()) {
      return;
    }
    
    const suggestion = suggestionService.checkForSuggestion();
    this.currentSuggestion = suggestion;
  }
  
  reactToSuggestion(reaction: 'accepted' | 'rejected' | 'later'): void {
    if (!this.currentSuggestion) return;
    
    suggestionService.logReaction(this.currentSuggestion, reaction);
    this.currentSuggestion = null;
  }
  
  dismissSuggestion(): void {
    this.currentSuggestion = null;
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
    selectedDate.subscribe(date => {
      currentDate = new Date(date);
    })();
    
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + days);
    this.setSelectedDate(newDate);
  }
  
  
  constructor() {
    selectedDate.set(new Date());
    this.initialize();
  }

  // Initialize app
  initialize(): void {
    // Set default start/end times for new events
    const now = new Date();
    const startTime = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour from now
    const endTime = new Date(startTime.getTime() + 60 * 60 * 1000); // 2 hours from now
    
    this.eventForm.start = startTime.toISOString().slice(0, 16);
    this.eventForm.end = endTime.toISOString().slice(0, 16);
    
    // Check for initial suggestion
    this.checkForSuggestion();
  }
}
