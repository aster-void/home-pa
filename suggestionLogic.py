# Home-PA Scheduling Algorithm
# Core scheduling logic for suggestion allocation

from __future__ import annotations

import itertools
import math
import random
from collections import defaultdict
from dataclasses import dataclass, field
from typing import Dict, List, Optional, Sequence, Tuple

Coordinate = Tuple[float, float]
MINUTES_PER_DISTANCE_UNIT = 3.0  # minutes per unit of euclidean distance
MANDATORY_NEED_THRESHOLD = 1.0    # suggestions with need >= this are mandatory
HOME_LABEL = "home"
HOME_COORDINATE: Coordinate = (0.0, 0.0)  # Default home location; can be updated


def set_home_location(coordinate: Coordinate) -> None:
    """
    Set the home location coordinate.
    
    This affects:
    - Where "near_home" suggestions are placed (within ~2 units of this coordinate)
    - Gap boundary labels (first gap start and last gap end should be at this location)
    
    Args:
        coordinate: (x, y) tuple representing the home location on the grid
    """
    global HOME_COORDINATE
    HOME_COORDINATE = coordinate


def clamp01(value: float) -> float:
    if value < 0.0:
        return 0.0
    if value > 1.0:
        return 1.0
    return value


def euclidean_distance(a: Coordinate, b: Coordinate) -> float:
    return math.hypot(a[0] - b[0], a[1] - b[1])


def travel_minutes_between(a: Coordinate, b: Coordinate) -> Tuple[float, float]:
    """
    Return (distance, minutes) between coordinates using MINUTES_PER_DISTANCE_UNIT.
    
    Units:
      - distance: Euclidean distance in spatial units (unchanged)
      - minutes: travel time in minutes (distance * MINUTES_PER_DISTANCE_UNIT)
    """
    distance = euclidean_distance(a, b)
    minutes = distance * MINUTES_PER_DISTANCE_UNIT
    return distance, minutes


def normalize_location_preference(value: Optional[str]) -> Optional[str]:
    if value is None:
        return None
    normalized = value.strip()
    if not normalized:
        return None
    if normalized.lower().replace(" ", "_") == "near_home":
        return "near_home"
    return normalized


@dataclass(frozen=True)
class Gap:
    gap_id: str
    duration: float  # minutes
    start_location: Coordinate
    end_location: Coordinate
    start_label: Optional[str] = None
    end_label: Optional[str] = None

    def __post_init__(self) -> None:
        if self.duration <= 0:
            raise ValueError(f"Gap '{self.gap_id}' duration must be positive.")


@dataclass
class Suggestion:
    suggestion_id: str
    need: float
    importance: float
    duration: float
    location: Coordinate
    location_preference: Optional[str] = None

    score: float = field(init=False)
    min_duration: float = field(init=False)
    max_duration: float = field(init=False)

    def __post_init__(self) -> None:
        if self.duration <= 0:
            raise ValueError(
                f"Suggestion '{self.suggestion_id}' duration must be positive."
            )
        object.__setattr__(self, "score", clamp01(self.need) + clamp01(self.importance))
        object.__setattr__(self, "min_duration", self.duration)
        object.__setattr__(self, "max_duration", self.duration)
        object.__setattr__(self, "location_preference", normalize_location_preference(self.location_preference))


@dataclass
class ScheduledBlock:
    suggestion_id: str
    gap_id: str
    start_offset: float
    duration: float
    location: Coordinate


@dataclass
class MovementLogEntry:
    from_label: str
    to_label: str
    distance: float
    minutes: float


@dataclass
class AllocationState:
    gap_usage: Dict[str, float]
    gap_index: int
    current_cursor: Optional[Coordinate]
    current_label: Optional[str]
    gap_has_blocks: bool


@dataclass
class ScheduleResult:
    ordered_suggestions: List[Suggestion]
    scheduled_blocks: List[ScheduledBlock]
    travel_cost: float  # total travel time in minutes
    dropped_suggestions: List[Suggestion]
    unused_gap_time: float
    permutations_evaluated: int
    allocated_minutes: Dict[str, float]
    movement_log: List[MovementLogEntry]

    def is_feasible(self) -> bool:
        return bool(self.scheduled_blocks)

    def blocks_used(self, suggestion: Suggestion) -> float:
        minutes = self.allocated_minutes.get(suggestion.suggestion_id, 0.0)
        if suggestion.duration == 0:
            return 0.0
        return minutes / suggestion.duration


def total_gap_minutes(gaps: Sequence[Gap]) -> float:
    return sum(gap.duration for gap in gaps)


def resolve_gap_labels(gaps: Sequence[Gap]) -> Dict[str, Tuple[str, str]]:
    labels: Dict[str, Tuple[str, str]] = {}
    total = len(gaps)
    for idx, gap in enumerate(gaps):
        start_label = gap.start_label or (HOME_LABEL if idx == 0 else f"{gap.gap_id}:start")
        end_label = gap.end_label or (HOME_LABEL if idx == total - 1 else f"{gap.gap_id}:end")
        labels[gap.gap_id] = (start_label, end_label)
    return labels


def greedy_select_candidates(
    suggestions: Sequence[Suggestion],
    gaps: Sequence[Gap],
    _max_distance: float,
    *,
    available_minutes: Optional[float] = None,
    tolerance: float = 1e-6,
    resolution_minutes: float = 1.0,  # discretization resolution in minutes
) -> List[Suggestion]:
    """
    Select a subset of suggestions (optional ones) using a 0/1 knapsack DP
    to maximize total score under available_minutes capacity.
    
    - available_minutes: capacity in minutes (if None, use total gap minutes)
    - resolution_minutes: discretize minutes into integer units for DP.
    
    Returns selected list sorted by descending score.
    """
    capacity = available_minutes if available_minutes is not None else total_gap_minutes(gaps)
    if capacity <= tolerance:
        return []

    items = list(suggestions)
    n = len(items)

    # Convert capacity and item durations to integer DP units
    W = max(0, int(round(capacity / resolution_minutes)))
    weights = [max(1, int(round(s.min_duration / resolution_minutes))) for s in items]
    values = [s.score for s in items]

    # DP: 1D table with backtracking info
    dp = [0.0] * (W + 1)
    take = [[False] * (W + 1) for _ in range(n)]

    for i in range(n):
        w_i = weights[i]
        v_i = values[i]
        # iterate backwards to avoid reuse
        for w in range(W, w_i - 1, -1):
            candidate = dp[w - w_i] + v_i
            if candidate > dp[w]:
                dp[w] = candidate
                take[i][w] = True

    # backtrack to find chosen items
    w = W
    chosen: List[Suggestion] = []
    for i in range(n - 1, -1, -1):
        if take[i][w]:
            chosen.append(items[i])
            w -= weights[i]
    chosen.sort(key=lambda s: s.score, reverse=True)
    return chosen


def enumerate_best_order(
    suggestions: Sequence[Suggestion],
    start_location: Optional[Coordinate],
    end_location: Optional[Coordinate],
    *,
    permutation_limit: int,
) -> Tuple[List[Suggestion], float, int]:
    """
    Find the best ordering of suggestions that minimizes travel cost in minutes.
    
    Returns:
        (best_order, travel_cost_minutes, permutations_checked)
        - travel_cost_minutes: total travel time in minutes
    """
    n = len(suggestions)
    if n == 0:
        return [], 0.0, 0
    if n > permutation_limit:
        raise ValueError(
            f"Permutation search limited to {permutation_limit} suggestions, received {n}."
        )

    best_order: Optional[Tuple[Suggestion, ...]] = None
    best_cost_minutes = math.inf
    permutations_checked = 0

    for permutation in itertools.permutations(suggestions):
        permutations_checked += 1
        travel_cost_minutes = 0.0
        previous = start_location
        for suggestion in permutation:
            if previous is not None:
                _, minutes = travel_minutes_between(previous, suggestion.location)
                travel_cost_minutes += minutes
            previous = suggestion.location
        if previous is not None and end_location is not None:
            _, minutes = travel_minutes_between(previous, end_location)
            travel_cost_minutes += minutes
        if travel_cost_minutes < best_cost_minutes:
            best_cost_minutes = travel_cost_minutes
            best_order = permutation

    assert best_order is not None
    return list(best_order), best_cost_minutes, permutations_checked


def remaining_capacity(gaps: Sequence[Gap], state: Optional[AllocationState], tolerance: float) -> float:
    if state is None:
        return total_gap_minutes(gaps)
    total = 0.0
    for idx, gap in enumerate(gaps):
        if idx < state.gap_index:
            continue
        used = state.gap_usage.get(gap.gap_id, 0.0)
        remaining = max(0.0, gap.duration - used)
        if remaining > tolerance:
            total += remaining
    return total


def starting_location_for_state(gaps: Sequence[Gap], state: Optional[AllocationState]) -> Optional[Coordinate]:
    if not gaps:
        return None
    if state is None:
        return gaps[0].start_location
    if state.gap_index >= len(gaps):
        return None
    if state.current_cursor is not None:
        return state.current_cursor
    return gaps[state.gap_index].start_location


def assign_order_to_gaps(
    ordered_suggestions: Sequence[Suggestion],
    gaps: Sequence[Gap],
    gap_labels: Dict[str, Tuple[str, str]],
    *,
    tolerance: float,
    initial_state: Optional[AllocationState] = None,
) -> Optional[Tuple[List[ScheduledBlock], AllocationState, List[MovementLogEntry]]]:
    if not ordered_suggestions:
        state = initial_state or AllocationState({gap.gap_id: 0.0 for gap in gaps}, 0, None, None, False)
        return [], state, []

    gap_usage = {gap.gap_id: 0.0 for gap in gaps}
    gap_index = 0
    current_cursor: Optional[Coordinate] = None
    current_label: Optional[str] = None
    gap_has_blocks = False

    if initial_state is not None:
        gap_usage.update(initial_state.gap_usage)
        gap_index = initial_state.gap_index
        current_cursor = initial_state.current_cursor
        current_label = initial_state.current_label
        gap_has_blocks = initial_state.gap_has_blocks

    def current_gap() -> Optional[Gap]:
        if gap_index >= len(gaps):
            return None
        return gaps[gap_index]

    def gap_start_label(gap: Gap) -> str:
        start_label, _ = gap_labels.get(gap.gap_id, (f"{gap.gap_id}:start", f"{gap.gap_id}:end"))
        return start_label

    def gap_end_label(gap: Gap) -> str:
        _, end_label = gap_labels.get(gap.gap_id, (f"{gap.gap_id}:start", f"{gap.gap_id}:end"))
        return end_label

    schedule: List[ScheduledBlock] = []
    movement_logs: List[MovementLogEntry] = []

    def ensure_gap_exit_ok(gap: Gap, cursor: Coordinate, label: Optional[str]) -> Optional[Tuple[float, float, str, str]]:
        distance, minutes = travel_minutes_between(cursor, gap.end_location)
        remaining = gap.duration - gap_usage[gap.gap_id]
        if minutes > remaining + tolerance:
            return None
        from_label = label if label is not None else gap_start_label(gap)
        return distance, minutes, from_label, gap_end_label(gap)

    def shift_to_next_gap() -> bool:
        nonlocal gap_index, current_cursor, current_label, gap_has_blocks
        gap = current_gap()
        if gap is None:
            return False
        cursor = current_cursor if current_cursor is not None else gap.start_location
        exit_info = ensure_gap_exit_ok(gap, cursor, current_label)
        if exit_info is None:
            return False
        distance, minutes, from_label, to_label = exit_info
        if minutes > tolerance:
            gap_usage[gap.gap_id] += minutes
            movement_logs.append(MovementLogEntry(from_label, to_label, distance, minutes))
        gap_index += 1
        current_cursor = None
        current_label = None
        gap_has_blocks = False
        return gap_index < len(gaps)

    def allocate_suggestion(suggestion: Suggestion, is_last_suggestion: bool = False) -> bool:
        nonlocal gap_index, current_cursor, current_label, gap_has_blocks
        duration = suggestion.duration
        while True:
            gap = current_gap()
            if gap is None:
                return False

            cursor = current_cursor if current_cursor is not None else gap.start_location
            label = current_label if current_label is not None else gap_start_label(gap)

            used = gap_usage[gap.gap_id]
            remaining = gap.duration - used
            if remaining <= tolerance:
                if not shift_to_next_gap():
                    return False
                continue

            preference = suggestion.location_preference
            if preference:
                # Only "near_home" location preference is supported
                if preference != "near_home":
                    # Reject suggestions with other location preferences
                    if not shift_to_next_gap():
                        return False
                    continue
                
                # Check if suggestion is mandatory
                is_mandatory = suggestion.need >= MANDATORY_NEED_THRESHOLD - tolerance
                
                start_label, end_label = gap_labels.get(gap.gap_id, ("", ""))
                is_at_first_gap_start = (gap_index == 0 and current_cursor is None and start_label == HOME_LABEL)
                is_at_last_gap = (gap_index == len(gaps) - 1 and end_label == HOME_LABEL)
                
                # For non-mandatory suggestions with "near_home", it's a HARD CONSTRAINT
                # They must be placed at home boundaries (start of first gap or end of last gap)
                if not is_mandatory:
                    # Check if we can place at first gap start
                    can_place_at_first = False
                    if is_at_first_gap_start:
                        distance, travel_in = travel_minutes_between(cursor, suggestion.location)
                        total_required = travel_in + duration
                        can_place_at_first = (total_required <= remaining + tolerance)
                    
                    # Check if we can place at last gap end
                    # Only need return travel if this is the last suggestion in the order
                    can_place_at_last = False
                    if is_at_last_gap:
                        distance, travel_in = travel_minutes_between(cursor, suggestion.location)
                        if is_last_suggestion:
                            # Last suggestion needs return travel to gap end
                            distance_to_end, travel_to_end = travel_minutes_between(suggestion.location, gap.end_location)
                            total_required = travel_in + duration + travel_to_end
                        else:
                            # Not last - will travel to next suggestion (don't know location yet, so check without return)
                            total_required = travel_in + duration
                        can_place_at_last = (total_required <= remaining + tolerance)
                    
                    # Non-mandatory "near_home" must be at home boundary
                    if not (can_place_at_first or can_place_at_last):
                        if not shift_to_next_gap():
                            return False
                        continue
                
                # For mandatory suggestions with "near_home", it's a PREFERENCE
                # Prefer home boundaries, but allow placement elsewhere if needed
                else:
                    # Prefer home boundaries, but don't enforce
                    prefer_this_placement = is_at_first_gap_start or (is_at_last_gap and remaining > duration + tolerance)
                    
                    # For last gap, if placing here, need to account for travel back to gap end
                    if is_at_last_gap and prefer_this_placement:
                        distance, travel_in = travel_minutes_between(cursor, suggestion.location)
                        distance_to_end, travel_to_end = travel_minutes_between(suggestion.location, gap.end_location)
                        total_with_return = travel_in + duration + travel_to_end
                        if total_with_return > remaining + tolerance:
                            # Can't fit with return travel, but still allow placement if it fits without return
                            # (user will have to travel back separately)
                            prefer_this_placement = False

            distance, travel_in = travel_minutes_between(cursor, suggestion.location)
            total_required = travel_in + duration
            
            # Check if suggestion fits in remaining gap time
            if total_required > remaining + tolerance:
                if not shift_to_next_gap():
                    return False
                continue

            if travel_in > tolerance:
                gap_usage[gap.gap_id] += travel_in
                movement_logs.append(MovementLogEntry(label, suggestion.suggestion_id, distance, travel_in))
                used += travel_in
                remaining -= travel_in

            if duration > remaining + tolerance:
                if not shift_to_next_gap():
                    return False
                continue

            start_offset = gap_usage[gap.gap_id]
            gap_usage[gap.gap_id] += duration
            
            schedule.append(
                ScheduledBlock(
                    suggestion_id=suggestion.suggestion_id,
                    gap_id=gap.gap_id,
                    start_offset=start_offset,
                    duration=duration,
                    location=suggestion.location,
                )
            )
            current_cursor = suggestion.location
            current_label = suggestion.suggestion_id
            gap_has_blocks = True
            return True

    # Process suggestions, tracking which is last for proper return travel handling
    for idx, suggestion in enumerate(ordered_suggestions):
        is_last_suggestion = (idx == len(ordered_suggestions) - 1)
        if not allocate_suggestion(suggestion, is_last_suggestion=is_last_suggestion):
            return None

    gap = current_gap()
    if gap is not None:
        cursor = current_cursor if current_cursor is not None else gap.start_location
        exit_info = ensure_gap_exit_ok(gap, cursor, current_label)
        if exit_info is None:
            return None
        distance, minutes, from_label, to_label = exit_info
        if minutes > tolerance:
            gap_usage[gap.gap_id] += minutes
            movement_logs.append(MovementLogEntry(from_label, to_label, distance, minutes))
        gap_index += 1
        current_cursor = None
        current_label = None
        gap_has_blocks = False

    state = AllocationState(gap_usage, gap_index, current_cursor, current_label, gap_has_blocks)
    return schedule, state, movement_logs


def schedule_suggestions(
    suggestions: Sequence[Suggestion],
    gaps: Sequence[Gap],
    *,
    max_distance: float = 3.0,
    permutation_limit: int = 8,
    tolerance: float = 1e-6,
    resolution_minutes: float = 1.0,
) -> ScheduleResult:
    gap_list = list(gaps)
    suggestion_list = list(suggestions)
    gap_labels = resolve_gap_labels(gap_list)

    if not gap_list:
        return ScheduleResult(
            ordered_suggestions=[],
            scheduled_blocks=[],
            travel_cost=0.0,
            dropped_suggestions=list(suggestion_list),
            unused_gap_time=0.0,
            permutations_evaluated=0,
            allocated_minutes={},
            movement_log=[],
        )

    # Partition mandatory vs optional
    mandatory = [s for s in suggestion_list if s.need >= MANDATORY_NEED_THRESHOLD - tolerance]
    optional = [s for s in suggestion_list if s not in mandatory]

    # Feasibility check: mandatory tasks must fit
    total_gap_time = total_gap_minutes(gap_list)
    total_mand_duration = sum(s.duration for s in mandatory)
    if total_mand_duration > total_gap_time + tolerance:
        # Infeasible: mandatory tasks cannot fit
        return ScheduleResult(
            ordered_suggestions=[],
            scheduled_blocks=[],
            travel_cost=0.0,
            dropped_suggestions=suggestion_list,
            unused_gap_time=total_gap_time,
            permutations_evaluated=0,
            allocated_minutes={},
            movement_log=[],
        )

    # Prepare remaining list: schedule mandatory first
    remaining = list(mandatory) + list(optional)

    state: Optional[AllocationState] = None
    ordered_total: List[Suggestion] = []
    scheduled_blocks_total: List[ScheduledBlock] = []
    allocated_minutes: Dict[str, float] = defaultdict(float)
    movement_log_total: List[MovementLogEntry] = []
    dropped_total: List[Suggestion] = []
    total_travel_cost = 0.0
    permutations_total = 0

    def schedule_group(group: List[Suggestion]) -> bool:
        nonlocal state, total_travel_cost, permutations_total
        batch = [s for s in group if s in remaining]
        if not batch:
            return False
        batch.sort(key=lambda s: s.score, reverse=True)
        while len(batch) > permutation_limit:
            dropped_candidate = batch.pop()
            if dropped_candidate in remaining:
                remaining.remove(dropped_candidate)
            dropped_total.append(dropped_candidate)
        if not batch:
            return False

        success = False
        working = list(batch)
        while working:
            start_location = starting_location_for_state(gap_list, state)
            end_location = gap_list[-1].end_location if gap_list else None
            if start_location is None:
                working.clear()
                break
            try:
                order, travel_cost, permutations_checked = enumerate_best_order(
                    working,
                    start_location=start_location,
                    end_location=end_location,
                    permutation_limit=permutation_limit,
                )
            except ValueError:
                dropped_candidate = working.pop()
                if dropped_candidate in remaining:
                    remaining.remove(dropped_candidate)
                dropped_total.append(dropped_candidate)
                continue

            result = assign_order_to_gaps(
                order,
                gap_list,
                gap_labels,
                tolerance=tolerance,
                initial_state=state,
            )
            if result is None:
                dropped_candidate = working.pop()
                if dropped_candidate in remaining:
                    remaining.remove(dropped_candidate)
                dropped_total.append(dropped_candidate)
                continue

            schedule, state, movements = result
            for suggestion in order:
                if suggestion in remaining:
                    remaining.remove(suggestion)
            ordered_total.extend(order)
            scheduled_blocks_total.extend(schedule)
            for block in schedule:
                allocated_minutes[block.suggestion_id] += block.duration
            movement_log_total.extend(movements)
            total_travel_cost += travel_cost
            permutations_total += permutations_checked
            success = True
            break

        return success

    # Schedule mandatory suggestions first
    mandatory_remaining = [s for s in mandatory if s in remaining]
    if mandatory_remaining:
        if not schedule_group(mandatory_remaining):
            # Mandatory scheduling failed (likely due to location/travel constraints)
            # Return infeasible result
            return ScheduleResult(
                ordered_suggestions=[],
                scheduled_blocks=[],
                travel_cost=0.0,
                dropped_suggestions=suggestion_list,
                unused_gap_time=total_gap_time,
                permutations_evaluated=0,
                allocated_minutes={},
                movement_log=[],
            )

    # Now process optional suggestions using knapsack DP
    while remaining:
        capacity = remaining_capacity(gap_list, state, tolerance)
        if capacity <= tolerance:
            break

        # Only select from optional suggestions
        optional_remaining = [s for s in optional if s in remaining]
        if not optional_remaining:
            break

        selected = greedy_select_candidates(
            optional_remaining,
            gap_list,
            max_distance,
            available_minutes=capacity,
            tolerance=tolerance,
            resolution_minutes=resolution_minutes,
        )
        if not selected:
            break

        selected.sort(key=lambda s: s.score, reverse=True)

        location_selected = [s for s in selected if s.location_preference and s in remaining]
        location_scheduled = False
        if location_selected:
            location_scheduled = schedule_group(location_selected)
            if location_scheduled:
                continue

        flexible_selected = [s for s in selected if not s.location_preference and s in remaining]
        if not flexible_selected:
            if not location_selected or not location_scheduled:
                break
            continue

        if not schedule_group(flexible_selected):
            break

    scheduled_blocks_total.sort(key=lambda block: (block.gap_id, block.start_offset))

    if state is None:
        unused_time = total_gap_minutes(gap_list)
    else:
        unused_time = remaining_capacity(gap_list, state, tolerance)

    dropped = dropped_total + [s for s in remaining if s not in dropped_total]

    return ScheduleResult(
        ordered_suggestions=ordered_total,
        scheduled_blocks=scheduled_blocks_total,
        travel_cost=total_travel_cost,
        dropped_suggestions=dropped,
        unused_gap_time=unused_time,
        permutations_evaluated=permutations_total,
        allocated_minutes=dict(allocated_minutes),
        movement_log=movement_log_total,
    )


def format_schedule(result: ScheduleResult) -> str:
    if not result.scheduled_blocks:
        return "No feasible schedule could be generated."

    lines = [
        "Final schedule:",
        "----------------",
    ]

    for block in result.scheduled_blocks:
        lines.append(
            f"- Gap {block.gap_id}: {block.suggestion_id} "
            f"({block.duration:.0f} min starting at +{block.start_offset:.0f} min)"
        )

    lines.append("")
    lines.append("Per-suggestion totals:")
    for suggestion in result.ordered_suggestions:
        allocated = result.allocated_minutes.get(suggestion.suggestion_id, 0.0)
        lines.append(
            f"  {suggestion.suggestion_id}: {allocated:.0f}/{suggestion.duration:.0f} min"
        )

    if result.movement_log:
        lines.append("")
        lines.append("Movement log:")
        for entry in result.movement_log:
            lines.append(
                f"  {entry.from_label} -> {entry.to_label}: {entry.distance:.2f} units ({entry.minutes:.1f} min)"
            )

    lines.append("")
    lines.append(f"Travel cost: {result.travel_cost:.1f} minutes.")
    lines.append(
        f"Dropped suggestions: {', '.join(s.suggestion_id for s in result.dropped_suggestions) or 'None'}"
    )
    lines.append(f"Unused gap time: {result.unused_gap_time:.0f} minutes.")
    lines.append(f"Permutations evaluated: {result.permutations_evaluated}")
    return "\n".join(lines)


def generate_random_suggestions(
    count: int,
    *,
    grid_size: float = 10.0,
    min_duration: float = 15.0,
    max_duration: float = 120.0,
    mandatory_probability: float = 0.1,
    location_preference_probability: float = 0.3,
    seed: Optional[int] = None,
) -> List[Suggestion]:
    """
    Generate random suggestions for testing.
    
    Args:
        count: Number of suggestions to generate
        grid_size: Maximum coordinate value (grid spans [0, grid_size] x [0, grid_size])
        min_duration: Minimum duration in minutes
        max_duration: Maximum duration in minutes
        mandatory_probability: Probability that a suggestion has need >= 1.0 (mandatory)
        location_preference_probability: Probability that a suggestion has a location preference
        seed: Random seed for reproducibility (None for random)
    
    Returns:
        List of randomly generated Suggestion objects
    """
    if seed is not None:
        random.seed(seed)
    
    activity_names = [
        "exercise", "meal_prep", "call_mom", "deep_work", "groceries", "meditation",
        "language_practice", "cleaning", "read_book", "cooking", "shopping", "meeting",
        "workout", "study", "relax", "errands", "social", "hobby", "maintenance", "planning"
    ]
    
    suggestions = []
    used_names = set()
    
    for i in range(count):
        # Generate unique suggestion ID
        base_name = random.choice(activity_names)
        suggestion_id = base_name
        counter = 1
        while suggestion_id in used_names:
            suggestion_id = f"{base_name}_{counter}"
            counter += 1
        used_names.add(suggestion_id)
        
        # Generate need (with chance of being mandatory)
        if random.random() < mandatory_probability:
            need = random.uniform(MANDATORY_NEED_THRESHOLD, 1.0)
        else:
            need = random.uniform(0.0, 0.99)
        
        # Generate importance
        importance = random.uniform(0.0, 1.0)
        
        # Generate duration
        duration = random.uniform(min_duration, max_duration)
        
        # Generate location preference: only "near_home" is supported
        location_preference = None
        if random.random() < location_preference_probability:
            location_preference = "near_home"
        
        # Generate location: if "near_home", place near HOME_COORDINATE; otherwise random
        if location_preference == "near_home":
            # Place within ~2 units of home (adjustable)
            home_radius = 2.0
            angle = random.uniform(0, 2 * math.pi)
            distance = random.uniform(0, home_radius)
            location = (
                HOME_COORDINATE[0] + distance * math.cos(angle),
                HOME_COORDINATE[1] + distance * math.sin(angle)
            )
            # Clamp to grid bounds
            location = (
                max(0.0, min(grid_size, location[0])),
                max(0.0, min(grid_size, location[1]))
            )
        else:
            # Random point on grid
            location = (random.uniform(0.0, grid_size), random.uniform(0.0, grid_size))
        
        suggestions.append(
            Suggestion(
                suggestion_id=suggestion_id,
                need=need,
                importance=importance,
                duration=duration,
                location=location,
                location_preference=location_preference,
            )
        )
    
    return suggestions





# ============================================================================
# Sample Data and Test Code
# ============================================================================

if __name__ == "__main__":
    sample_suggestions = [
        Suggestion(
            suggestion_id="exercise",
            need=0.85,
            importance=0.9,
            duration=60,
            location=(2.6, 3.0),
            location_preference="near_home",
        ),
        Suggestion(
            suggestion_id="meal_prep",
            need=0.9,
            importance=0.8,
            duration=60,
            location=(2.0, 2.3),
        ),
        Suggestion(
            suggestion_id="call_mom",
            need=0.65,
            importance=0.95,
            duration=30,
            location=(3.6, 2.8),
            location_preference="midtown",
        ),
        Suggestion(
            suggestion_id="deep_work",
            need=0.7,
            importance=0.8,
            duration=60,
            location=(4.6, 4.2),
        ),
        Suggestion(
            suggestion_id="groceries",
            need=0.7,
            importance=0.55,
            duration=45,
            location=(8.5, 7.6),
            location_preference="midtown",
        ),
        Suggestion(
            suggestion_id="meditation",
            need=0.5,
            importance=0.7,
            duration=30,
            location=(3.3, 3.0),
            location_preference="near_home",
        ),
        Suggestion(
            suggestion_id="language_practice",
            need=0.45,
            importance=0.75,
            duration=30,
            location=(5.8, 5.8),
            location_preference="studio",
        ),
        Suggestion(
            suggestion_id="cleaning",
            need=0.55,
            importance=0.6,
            duration=25,
            location=(7.2, 6.9),
        ),
        Suggestion(
            suggestion_id="read_book",
            need=0.4,
            importance=0.7,
            duration=25,
            location=(6.6, 6.5),
        ),
    ]

    sample_gaps = [
        Gap(
            gap_id="gap_1",
            duration=180,
            start_location=(1.2, 1.8),
            end_location=(3.6, 3.1),
            start_label="home",
            end_label="studio",
        ),
        Gap(
            gap_id="gap_2",
            duration=70,
            start_location=(3.8, 3.2),
            end_location=(4.0, 3.5),
            start_label="studio",
            end_label="midtown",
        ),
        Gap(
            gap_id="gap_3",
            duration=90,
            start_location=(6.8, 6.4),
            end_location=(9.0, 8.5),
            start_label="midtown",
            end_label="home",
        ),
    ]

    result = schedule_suggestions(
        sample_suggestions,
        sample_gaps,
        max_distance=3.6,
        permutation_limit=8,
    )
    print(format_schedule(result))

    print("\nOrdered evaluation scores:")
    for suggestion in result.ordered_suggestions:
        allocated = result.allocated_minutes.get(suggestion.suggestion_id, 0.0)
        print(
            f"- {suggestion.suggestion_id}: score {suggestion.score:.2f}, "
            f"allocated {allocated:.0f}/{suggestion.duration:.0f} min"
        )

    print("\nDropped suggestions with scores:")
    for suggestion in result.dropped_suggestions:
        print(f"- {suggestion.suggestion_id}: score {suggestion.score:.2f}")

    print("\nMovement log:")
    for entry in result.movement_log:
        print(
            f"- {entry.from_label} -> {entry.to_label}: {entry.distance:.2f} units ({entry.minutes:.1f} min)"
        )



    # Unit tests for mandatory behavior and travel units

    def test_mandatory_inclusion_simple():
        """Test that mandatory suggestions (need >= 1.0) are always included."""
        # single gap 180 minutes
        gap = Gap("g1", duration=180, start_location=(0, 0), end_location=(0, 0))
        # A mandatory 120 minutes
        a = Suggestion("A", need=1.0, importance=0.5, duration=120, location=(0, 0))
        # B optional 90 minutes score 0.9
        b = Suggestion("B", need=0.5, importance=0.4, duration=90, location=(0, 0))
        result = schedule_suggestions([a, b], [gap], permutation_limit=6)
        # A must be scheduled
        assert any(block.suggestion_id == "A" for block in result.scheduled_blocks)
        # If A + B > gap, B may be dropped, but A must be present
        assert result.allocated_minutes.get("A", 0) >= 120 - 1e-6
        print("✓ test_mandatory_inclusion_simple passed")


    def test_travel_minutes_units():
        """Test that travel_cost is reported in minutes, not grid units."""
        gap = Gap("g1", duration=1000, start_location=(0, 0), end_location=(0, 0))
        # two suggestions spatially separated
        s1 = Suggestion("s1", need=0.0, importance=0.5, duration=10, location=(0, 0))
        s2 = Suggestion("s2", need=0.0, importance=0.6, duration=10, location=(1, 0))
        res = schedule_suggestions([s1, s2], [gap], permutation_limit=6)
        # travel_cost should be in minutes, i.e., distance 1 -> MINUTES_PER_DISTANCE_UNIT
        # We expect at least one travel segment of distance 1, so travel >= MINUTES_PER_DISTANCE_UNIT
        assert res.travel_cost >= 0
        # If both are scheduled, travel should be at least MINUTES_PER_DISTANCE_UNIT
        if len(res.scheduled_blocks) >= 2:
            assert res.travel_cost >= MINUTES_PER_DISTANCE_UNIT - 1e-6
        print("✓ test_travel_minutes_units passed")


    def test_mandatory_infeasible():
        """Test that infeasible mandatory suggestions return empty schedule."""
        gap = Gap("g1", duration=100, start_location=(0, 0), end_location=(0, 0))
        # Mandatory task requires 150 minutes, but gap only has 100
        a = Suggestion("A", need=1.0, importance=0.5, duration=150, location=(0, 0))
        result = schedule_suggestions([a], [gap], permutation_limit=6)
        # Should return infeasible (no blocks scheduled)
        assert not result.scheduled_blocks
        assert len(result.dropped_suggestions) > 0
        print("✓ test_mandatory_infeasible passed")


    # Run tests
    print("Running tests...")
    test_mandatory_inclusion_simple()
    test_travel_minutes_units()
    test_mandatory_infeasible()
    print("\nAll tests passed!")


    # Generate random suggestions
    # Change NUM_SUGGESTIONS to control how many suggestions are generated
    NUM_SUGGESTIONS = 10  # <-- Change this number to generate more/fewer suggestions

    random_suggestions = generate_random_suggestions(
        NUM_SUGGESTIONS,
        grid_size=10.0,
        min_duration=15.0,
        max_duration=120.0,
        mandatory_probability=0.15,  # 15% chance of being mandatory
        location_preference_probability=0.3,  # 30% chance of having location preference
        seed=42,  # Set to None for different results each time, or a number for reproducibility
    )

    print(f"Generated {len(random_suggestions)} random suggestions:\n")
    for s in random_suggestions:
        mandatory = " (MANDATORY)" if s.need >= MANDATORY_NEED_THRESHOLD else ""
        loc_pref = f" [prefers: {s.location_preference}]" if s.location_preference else ""
        print(f"- {s.suggestion_id}: need={s.need:.2f}, importance={s.importance:.2f}, "
              f"duration={s.duration:.0f}min, location={s.location}{mandatory}{loc_pref}")

    # You can now use random_suggestions with schedule_suggestions()
    # Example:
    # result = schedule_suggestions(random_suggestions, sample_gaps, permutation_limit=8)
    # print(format_schedule(result))

