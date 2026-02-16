import { useEffect, useMemo, useRef, useState } from 'react';
import { useAppContext } from '../../core/AppContext';
import { useTime } from '../../core/TimeProvider';
import './Timetable.css';

const DAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday"
];

const START_HOUR = 5;
const END_HOUR = 21;
const HOURS = Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => START_HOUR + i);
const TOTAL_MINUTES = (END_HOUR - START_HOUR) * 60;

const BLOCK_COLORS = ["#4f86f7", "#2bb673", "#f2b632", "#f06c5c", "#3fb6d3", "#f2844b"];

const creatId = () => `tt-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

const minutesToTimeValue = (minutes) => {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
};

const timeValueToMinutes = (time) => {
  if (!time) {
    return START_HOUR * 60;
  }
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
};

const formatTimeLabel = (hour) => {
  const suffix = hour >= 12 ? "PM" : "AM";
  const h12 = ((hour + 11) % 12) +1;
  return `${h12} ${suffix}`;
};

const roundToNearest = (minutes, step = 15) => Math.round(minutes / step) * step;

const clampMinutes = (minutes) => Math.max(0, Math.min(TOTAL_MINUTES, minutes));

const isOverLapping = (candidate, existing) =>
  candidate.startMinutes < existing.endMinutes && candidate.endMinutes > existing.startMinutes;

const matchesRotation = (block, rotationMode, weekIndex, monthWeekIndex) => {
  if (block.rotation !== rotationMode) {
    return false;
  }
  if (rotationMode === "fortnightly") {
    return block.weekIndex === weekIndex;
  }
  if (rotationMode === "monthly") {
    return block.monthWeekIndex === monthWeekIndex;
  }
  return true;
};

const createDraft = (dayIndex, startMinutes, endMinutes, rotationMode, weekIndex, monthWeekIndex) => ({
  id: null,
  title: "",
  dayIndex,
  startMinutes,
  endMinutes,
  color: BLOCK_COLORS[0],
  rotation: rotationMode,
  weekIndex: rotationMode === "fortnightly" ? weekIndex : undefined,
  monthWeekIndex: rotationMode === "monthly" ? monthWeekIndex : undefined,
  info: "",
  attachments: []
});

export default function Timetable() {
  const { time } = useTime();
  const rootRef = useRef(null);
  const scrollRef = useRef(null);
  const headerRef = useRef(null);
  const timeLabelRef = useRef(null);
  const userScrolledRef = useRef(false);
  const {
    rotationMode,
    setRotationMode,
    activeWeekIndex,
    setActiveWeekIndex,
    activeMonthWeek,
    setActiveMonthWeek,
    timetableBlocks,
    setTimetableBlocks,
  } = useAppContext();

  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetMode, setSheetMode] = useState("create");
  const [draft, setDraft] = useState(
    createDraft(1, START_HOUR * 60, START_HOUR * 60 + 60, rotationMode, activeWeekIndex, activeMonthWeek)
  );
  const [addMultiple, setAddMultiple] = useState(false);
  const [multipleDays, setMultipleDays] = useState([1]);
  const [saveError, setSaveError] = useState("");

  const visibleBlocks = useMemo(() => {
    return timetableBlocks.filter((block) => matchesRotation(block, rotationMode, activeWeekIndex, activeMonthWeek));
  }, [timetableBlocks, rotationMode, activeWeekIndex, activeMonthWeek]);

  const blocksByDay = useMemo(() => {
    const map = new Map(DAYS.map((_, index) => [index, []]));
    visibleBlocks.forEach((block) => {
      map.get(block.dayIndex).push(block);
    });
    map.forEach((items) => items.sort((a, b) => a.startMinutes - b.startMinutes));
    return map;
  }, [visibleBlocks]);

  const openCreateSheet = (dayIndex, startMinutes, endMinutes) => {
    setSheetMode("create");
    setDraft(createDraft(dayIndex, startMinutes, endMinutes, rotationMode, activeWeekIndex, activeMonthWeek));
    setAddMultiple(false);
    setMultipleDays([dayIndex]);
    setSaveError("");
    setSheetOpen(true);
  };

  const openEditSheet = (block) => {
    setSheetMode("edit");
    setDraft({...block});
    setAddMultiple(false);
    setMultipleDays([block.dayIndex]);
    setSaveError("");
    setSheetOpen(true);
  };

  const handleDayClick = (dayIndex, event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const y = event.clientY - rect.top;
    const minuteOffset = clampMinutes(( y / rect.height) * TOTAL_MINUTES);
    const rounded = roundToNearest(minuteOffset, 15);
    const startMinutes = START_HOUR * 60 + rounded;
    const endMinutes = Math.min(startMinutes + 60, END_HOUR * 60);
    openCreateSheet(dayIndex, startMinutes, endMinutes);
  };

  const handleSave = () => {
    setSaveError("");
    if (!draft.title.trim()) {
      setSaveError("Title cannot be empty");
      return;
    }
    if (draft.endMinutes <= draft.startMinutes) {
      setSaveError("End time must be after start time");
      return;
    }
    if (addMultiple && sheetMode === "create" && multipleDays.length === 0) {
      setSaveError("Select at least one day for multiple creation");
      return;
    }

    const targetDays = addMultiple && sheetMode === "create" ? multipleDays : [draft.dayIndex];
    const draftContext = {
      rotation: draft.rotation,
      weekIndex: draft.weekIndex,
      monthWeekIndex: draft.monthWeekIndex
    };

    for (const dayIndex of targetDays) {
      const overlap = timetableBlocks.some((block) => {
        if (sheetMode === "edit" && block.id === draft.id) {
          return false;
        }
        if (block.dayIndex !== dayIndex) {
          return false;
        }
        if (block.rotation !== draftContext.rotation) {
          return false;
        }
        if (block.rotation === "fortnightly" && block.weekIndex !== draftContext.weekIndex) {
          return false;
        }
        if (block.rotation === "monthly" && block.monthWeekIndex !== draftContext.monthWeekIndex) {
          return false;
        }
        return isOverLapping(draft, block);
      });

      if (overlap) {
        setSaveError("This block overlaps with an existing block");
        return;
      }
    }

    if (sheetMode === "edit") {
      setTimetableBlocks((prev) => prev.map((block) => (block.id === draft.id ? { ...draft } : block)));
      setSheetOpen(false);
      return;
    }

    const newBlocks = targetDays.map((dayIndex) => ({
      ...draft,
      id: creatId(),
      dayIndex
    }));
    
    setTimetableBlocks((prev) => [...prev, ...newBlocks]);
    setSheetOpen(false);
  };

  const handleDelete = () => {
    if (sheetMode !== "edit" || !draft.id) {
      return;
    }
    setTimetableBlocks((prev) => prev.filter((block) => block.id !== draft.id));
    setSheetOpen(false);
  };

  const rotationLabel = useMemo(() => {
    if (rotationMode === "fortnightly") {
      return activeWeekIndex === 0 ? "Week One" : "Week Two";
    }
    if (rotationMode === "monthly") {
      return `Week ${activeMonthWeek}`;
    }
    return "Weekly";
  }, [rotationMode, activeWeekIndex, activeMonthWeek]);

  const handleQuickAdd = () => {
    const now = time || new Date();
    const dayIndex = now.getDay();
    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    const rounded = roundToNearest(nowMinutes, 15);
    const minStart = START_HOUR * 60;
    const maxStart = END_HOUR * 60 - 15;
    const startMinutes = Math.max(minStart, Math.min(maxStart, rounded));
    const endMinutes = Math.min(startMinutes + 60, END_HOUR * 60);
    openCreateSheet(dayIndex, startMinutes, endMinutes);
  };

  useEffect(() => {
    if (!time || !scrollRef.current || !timeLabelRef.current) {
      return;
    }
    if (userScrolledRef.current) {
      return;
    }

    const minutesFromStart = time.getHours() * 60 + time.getMinutes() - START_HOUR * 60;
    const clampedMinutes = Math.max(0, Math.min(TOTAL_MINUTES, minutesFromStart));
    const hourHeight = timeLabelRef.current.offsetHeight;
    if (!Number.isFinite(hourHeight) || hourHeight <= 0) {
      return;
    }

    const minuteHeight = hourHeight / 60;
    const headerHeight = headerRef.current ? headerRef.current.offsetHeight : 0;
    const targetOffset = headerHeight + clampedMinutes * minuteHeight;
    const centeredScrollTop = targetOffset - scrollRef.current.clientHeight / 2;
    const maxScrollTop = scrollRef.current.scrollHeight - scrollRef.current.clientHeight;

    const rafId = requestAnimationFrame(() => {
      scrollRef.current.scrollTop = Math.max(0, Math.min(maxScrollTop, centeredScrollTop));
    });

    return () => cancelAnimationFrame(rafId);
  }, [time]);

  return (
    <div className="timetable-root" ref={rootRef}>
      <div className="timetable-controls">
        <button className="timetable-add-btn" type="button" onClick={handleQuickAdd} aria-label="Add block">
          +
        </button>
        <div className="timetable-rotation">
          <div className="timetable-segment" role="tablist" aria-label="Rotation mode">
            {["weekly", "fortnightly", "monthly"].map((mode) => (
              <button
                key={mode}
                className={`timetable-segment-button ${rotationMode === mode ? "is-active" : ""}`}
                onClick={() => setRotationMode(mode)}
                type="button"
              >
                {mode.charAt(0).toUpperCase() + mode.slice(1)}
              </button>
            ))}
          </div>
          <div className="timetable-cycle">
            {rotationMode === "fortnightly" && (
              <div className="timetable-cycle-toggle">
                <button
                className={`timetable-chip ${activeWeekIndex === 0 ? "is-active" : ""}`}
                onClick={() => setActiveWeekIndex(0)}
                type="button"
                >
                  Week One
                </button>
                <button
                className={`timetable-chip ${activeWeekIndex === 1 ? "is-active" : ""}`}
                onClick={() => setActiveWeekIndex(1)}
                type="button"
                >
                  Week Two
                </button>
              </div>
            )}
            {rotationMode === "monthly" && (
              <div className="timetable-cycle-toggle">
                {[1, 2, 3, 4].map((index) => (
                  <button
                    key={index}
                    className={`timetable-chip ${activeMonthWeek === index ? "is-active" : ""}`}
                    onClick={() => setActiveMonthWeek(index)}
                    type="button"
                  >
                    Week {index}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="timetable-shell">
        <div
          className="timetable-scroll"
          ref={scrollRef}
          onScroll={(event) => {
            if (event?.nativeEvent?.isTrusted) {
              userScrolledRef.current = true;
            }
          }}
        >
          <div className="timetable-header-row" ref={headerRef}>
            <div className="timetable-corner">Time</div>
            {DAYS.map((day) => (
              <div key={day} className="timetable-day-header">
                {day}
              </div>
            ))}
          </div>

          <div className="timetable-body-row">
            <div className="timetable-time-axis">
              {HOURS.map((hour, index) => (
                <div
                  key={hour}
                  className="timetable-time-label"
                  ref={index === 0 ? timeLabelRef : null}
                >
                  {formatTimeLabel(hour)}
                </div>
              ))}
            </div>
            <div className="timetable-days">
              {DAYS.map((day, dayIndex) => (
                <div
                  key={day}
                  className="timetable-day-column"
                  onClick={(event) => handleDayClick(dayIndex, event)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      handleDayClick(dayIndex, event);
                    }
                  }}
                >
                  <div className="timetable-hour-lines">
                    {HOURS.map((hour) => (
                      <div key={hour} className="timetable-hour-line" />
                    ))}
                  </div>
                    {(blocksByDay.get(dayIndex) || []).map((block) => {
                      const offsetMinutes = block.startMinutes - START_HOUR * 60;
                      const blockHeight = block.endMinutes - block.startMinutes;
                      return (
                        <button
                          key={block.id}
                          className="timetable-block"
                          style={{
                            top: `calc(${offsetMinutes} * var(--minute-height))`,
                            height: `calc(${blockHeight} * var(--minute-height))`,
                            backgroundColor: block.color,
                          }}
                          onClick={(event) => {
                            event.stopPropagation();
                            openEditSheet(block);
                          }}
                          type="button"
                        >
                          <div className="timetable-block-title">{block.title}</div>
                          <div className="timetable-block-time">
                            {minutesToTimeValue(block.startMinutes)} - {minutesToTimeValue(block.endMinutes)}
                          </div>
                        </button>
                      );
                    })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {sheetOpen && (
        <div className="timetable-sheet-overlay" role="dialog" aria-modal="true">
          <div className="timetable-sheet">
            <div className="timetable-sheet-header">
              <button
                className="timetable-sheet-action"
                onClick={() => setSheetOpen(false)}
                type="button"
              >
                Cancel
              </button>
              <div className="timetable-sheet-title">
                {sheetMode === "edit" ? "Edit Block" : "Add Block"}
              </div>
              <button className="timetable-sheet-action is-primary" onClick={handleSave} type="button">
                Save
              </button>
            </div>

            <div className="timetable-sheet-body">
              <label className="timetable-field">
                <span className="timetable-field-label">Title</span>
                <input
                  className="timetable-input"
                  value={draft.title}
                  onChange={(event) => setDraft((prev) => ({ ...prev, title: event.target.value}))}
                  placeholder="Block title"
                  type="text"
                />
              </label>

              <div className="timetable-card">
                <div className="timetable-card-row">
                  <span className="timetable-card-label">Day</span>
                  <div className="timetable-card-content">
                  <select
                    className="timetable-select"
                    value={draft.dayIndex}
                    onChange={(event) => 
                      setDraft((prev) => ({ ...prev, dayIndex: Number(event.target.value) }))
                    }
                  >
                    {DAYS.map((day, index) => (
                      <option key={day} value={index}>
                        {day}
                      </option>
                    ))}
                  </select>
                  <span className="timetable-pill">{rotationLabel}</span>
                </div>
              </div>
              <div className="timetable-card-row">
                <span className="timetable-card-label">Start time</span>
                <div className="timetable-card-content">
                  <input
                    className="timetable-input"
                    type="time"
                    step={900}
                    min={minutesToTimeValue(START_HOUR * 60)}
                    max={minutesToTimeValue(END_HOUR * 60)}
                    value={minutesToTimeValue(draft.startMinutes)}
                    onChange={(event) =>
                      setDraft((prev) => ({ ...prev, startMinutes: timeValueToMinutes(event.target.value) }))
                    }
                  />
                </div>
              </div>
              <div className="timetable-card-row">
                <span className="timetable-card-label">End time</span>
                <div className="timetable-card-content">
                  <input
                    className="timetable-input"
                    type="time"
                    step={900}
                    min={minutesToTimeValue(START_HOUR * 60)}
                    max={minutesToTimeValue(END_HOUR * 60)}
                    value={minutesToTimeValue(draft.endMinutes)}
                    onChange={(event) =>
                      setDraft((prev) => ({ ...prev, endMinutes: timeValueToMinutes(event.target.value) }))
                    }
                  />
                </div>
              </div>
              <div className="timetable-card-row">
                <span className="timetable-card-label">Add multiple</span>
                <label className="timetable-toggle">
                  <input
                    type="checkbox"
                    checked={addMultiple}
                    onChange={(event) => setAddMultiple(event.target.checked)}
                    disabled={sheetMode === "edit"}
                  />
                  <span className="timetable-toggle-track" />
                </label>
              </div>
              {addMultiple && sheetMode === "create" && (
                <div className="timetable-multi-days">
                  {DAYS.map((day, index) => {
                    const active = multipleDays.includes(index);
                    return (
                      <button
                        key={day}
                        type="button"
                        className={`timetable-day-chip ${active ? "is-active" : ""}`}
                        onClick={() => {
                          setMultipleDays(prev =>
                            prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
                          );
                        }}
                      >
                        {day.slice(0, 3)}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="timetable-card">
              <div className="timetable-card-row">
                <span className="timetable-card-label">Colour</span>
                <div className="timetable-color-grid">
                  {BLOCK_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      className={`timetable-color-swatch ${draft.color === color ? "is-selected" : ""}`}
                      style={{ background: color}}
                      onClick={() => setDraft((prev) => ({ ...prev, color }))}
                      aria-label="Select block color"
                    />
                  ))}
                </div>
              </div>
            </div>

            <label className="timetable-field">
              <span className="timetable-field-label">Info</span>
              <textarea
                className="timetable-textarea"
                value={draft.info}
                onChange={(event) => setDraft((prev) => ({ ...prev, info: event.target.value}))}
                placeholder="Optional notes..."
                rows={4}
              />
            </label>

            <div className="timetable-card">
              <div className="timetable-card-row">
                <span className="timetable-card-label">Attachments</span>
                <label className="timetable-attachemnt">
                  <input
                    type="file"
                    multiple
                    onChange={(event) =>
                      setDraft((prev) => ({
                        ...prev, 
                        attachments: Array.from(event.target.files || []).map((file) => file.name),
                      }))
                    }
                  />
                  Add
                </label>
              </div>
              {draft.attachments.length > 0 && (
                <div className="timetable-attachments">
                  {draft.attachments.map((name) => (
                    <span key={name} className="timetable-attachment-chip">
                      {name}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {saveError && <div className="timetable-error">{saveError}</div>}

            {sheetMode === "edit" && (
              <div className="timetable-sheet-footer">
                <button className="timetable-delete-btn" onClick={handleDelete} type="button">
                  Delete block
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    )}
  </div>
);
}