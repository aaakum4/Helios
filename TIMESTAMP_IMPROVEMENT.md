# Timestamp Storage Recommendation

## Current Implementation
Currently, several components parse and format dates using string-based date keys (e.g., `"2026-03-03"`). This approach works but has some limitations:

1. **Timezone Issues**: Date parsing can be affected by the user's timezone
2. **DST Transitions**: Daylight saving time changes can cause edge cases
3. **String Parsing Overhead**: Repeatedly parsing date strings is less efficient than working with timestamps

## Affected Components
- **Reflection.jsx**: Uses string keys like `"2026-02-16"` for archive storage
- **FocusTracker.jsx**: Uses `getTodayKey()` to generate date strings
- **Pomodoro.jsx**: Stores session start times as timestamps (✓ good)

## Recommended Improvements

### Short Term (Already Implemented)
- Store all timestamps as milliseconds (already done in Pomodoro, FocusTracker sessions)
- Use consistent date key generation functions

### Future Enhancements
1. **Normalize to UTC**: Store all dates/times in UTC to avoid timezone issues
   ```javascript
   const getDateKeyUTC = (timestamp = Date.now()) => {
     const date = new Date(timestamp);
     return date.toISOString().slice(0, 10); // "2026-03-03"
   };
   ```

2. **Use Unix Timestamps for All Time-Based Operations**:
   - Replace string-based date comparisons with numeric timestamp comparisons
   - Store `startOfDay` and `endOfDay` as timestamps instead of date strings

3. **Migration Strategy**:
   - Add a version number to localStorage entries
   - Implement a migration function that runs on app startup
   - Convert existing string-based dates to timestamps in a backwards-compatible way

## Implementation Priority
- **Priority**: Low (current implementation works correctly)
- **Effort**: Medium (requires careful migration of existing user data)
- **Benefit**: Better timezone handling, especially for users who travel or change timezones

## Notes
The current implementation is functional and handles most use cases correctly. This is an optimization for edge cases and future scalability rather than a critical bug fix.
