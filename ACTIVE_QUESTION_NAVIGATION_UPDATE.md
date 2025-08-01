# Active Question Navigation Update

## Summary
Updated lab question navigation functions to only consider active questions (where `isEnabled = true` and `status = 'active'`).

## Changes Made

### Updated Functions

#### `getFirstLabQuestionFromDB(labId: string)`
- **Before**: Returns the first question by order regardless of status
- **After**: Returns the first question that is both enabled and active
- **Use Case**: Initial question loading when starting a lab

#### `getLabQuestionsFromDB(labId: string)`
- **Before**: Returns all questions for a lab
- **After**: Returns only enabled and active questions
- **Use Case**: Lab navigation menu, question listing

### New Functions Added

#### `getNextActiveLabQuestionFromDB(labId: string, currentOrder: number)`
- **Purpose**: Get the next active question after a given order number
- **Logic**: Finds the first question with `order > currentOrder` that is enabled and active
- **Use Case**: Next button navigation

#### `getPreviousActiveLabQuestionFromDB(labId: string, currentOrder: number)`
- **Purpose**: Get the previous active question before a given order number
- **Logic**: Finds the last question with `order < currentOrder` that is enabled and active
- **Use Case**: Previous button navigation

## Navigation Behavior Examples

### Scenario: Lab with 20 questions where questions 1, 3, 5 are disabled

#### Original Order: 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20
#### Active Questions: 2, 4, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20

**Navigation Flow:**
- **First Question**: Question 2 (was order 2, now effective first)
- **After Question 2**: Question 4 (skips disabled question 3)
- **After Question 4**: Question 6 (skips disabled question 5)
- **After Question 6**: Question 7
- **Continue**: 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20

### Benefits
1. **Seamless Experience**: Users only see and navigate through available questions
2. **Admin Control**: Administrators can disable questions without breaking navigation
3. **Maintenance Mode**: Questions under maintenance are automatically skipped
4. **Progressive Disclosure**: Only active content is presented to users

## Database Filtering
All functions now include these filters:
```sql
WHERE
  lab_tasks.labId = ? AND
  lab_tasks.isEnabled = true AND
  lab_tasks.status = 'active'
ORDER BY lab_tasks.order
```

## Impact on Components

### Automatically Updated (No Code Changes Needed)
- `lab-exercise-navigation.tsx` - Navigation menu now shows only active questions
- `task-section.tsx` - Question loading respects active status
- Any component using `getLabQuestionsFromDB` or `getFirstLabQuestionFromDB`

### Components That Could Benefit from New Functions
- Navigation buttons (Next/Previous) could use the new helper functions
- Progress tracking components
- Question validation workflows

## Testing Recommendations

### Test Cases
1. **All Active**: Verify normal navigation with all questions enabled
2. **First Disabled**: Ensure navigation starts from first active question
3. **Middle Disabled**: Verify navigation skips disabled questions properly
4. **Last Disabled**: Ensure navigation handles end-of-lab correctly
5. **All Disabled**: Verify graceful handling when no active questions exist

### Admin Testing
1. Disable various questions using the Lab Task Editor
2. Test user navigation experience
3. Re-enable questions and verify they appear in navigation
4. Test status changes (active → maintenance → active)

## Future Enhancements

### Potential Features
- **Status-Aware Navigation**: Different handling for different statuses
- **Conditional Navigation**: Skip questions based on previous answers
- **Dynamic Ordering**: Runtime question ordering based on performance
- **Preview Mode**: Admin preview of disabled questions

### Performance Considerations
- Consider caching active question lists for frequently accessed labs
- Optimize database queries for large labs with many questions
- Implement pagination for labs with 50+ questions

## Migration Notes

### Backward Compatibility
- Existing URLs with question IDs still work if the question is active
- Inactive questions redirect to first active question
- No breaking changes to existing navigation components

### Database Requirements
- Ensure all existing questions have `isEnabled = true` and `status = 'active'` by default
- Run migration to set defaults for existing records if needed
- Consider bulk operations for enabling/disabling related questions
