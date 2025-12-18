/**
 * Application Settings State
 *
 * Manages user preferences and settings across the app
 */

// Active hours for gap finding in assistant view
let activeStartTime = $state("08:00");
let activeEndTime = $state("23:00");

// Load from localStorage if available
if (typeof window !== "undefined") {
  const savedStart = localStorage.getItem("activeStartTime");
  const savedEnd = localStorage.getItem("activeEndTime");
  if (savedStart) activeStartTime = savedStart;
  if (savedEnd) activeEndTime = savedEnd;
}

export const settingsState = {
  get activeStartTime() {
    return activeStartTime;
  },
  get activeEndTime() {
    return activeEndTime;
  },
  setActiveStartTime(value: string) {
    activeStartTime = value;
    if (typeof window !== "undefined") {
      localStorage.setItem("activeStartTime", value);
    }
  },
  setActiveEndTime(value: string) {
    activeEndTime = value;
    if (typeof window !== "undefined") {
      localStorage.setItem("activeEndTime", value);
    }
  },
};
