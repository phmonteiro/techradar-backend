# Individual User Ratings System

This update implements individual user ratings for technologies and trends in the Tech Radar application.

## Features Implemented

### 1. Database Changes
- **New Column**: Added `UserID` to the `Ratings` table
- **Updated Constraints**: Modified unique constraint to include `UserID`, `ItemType`, `GeneratedID`, and `RatingKey`
- **New Views**: 
  - `v_AverageRatings`: Calculates average ratings across all users
  - `v_UserRatings`: Shows user-specific ratings with defaults

### 2. Backend API Updates

#### New Endpoints:
- `GET /api/ratings/average/:itemType/:generatedId` - Get average ratings for display (public)
- `GET /api/ratings/user/:itemType/:generatedId` - Get user-specific ratings for modal (requires auth)
- `PUT /api/ratings/:itemType/:generatedId` - Update user ratings (requires auth, now includes UserID)

#### Updated Controllers:
- `getAverageRatingsForItem()` - Returns average ratings with participant count
- `getUserRatingsForItem()` - Returns user's individual ratings, defaults to 0 for unrated items
- `updateItemRatings()` - Now includes UserID in database operations

### 3. Frontend Updates

#### New Service Layer:
- `ratingsService.js` - Centralized API calls for ratings
  - `getAverageRatingsForItem()` - Fetch average ratings
  - `getUserRatingsForItem()` - Fetch user-specific ratings
  - `updateUserRatings()` - Save user ratings
  - `transformApiRatings()` - Transform API data to component format

#### Updated Components:

**RatingsDisplay**:
- Now shows average ratings across all users
- Displays participant count (👤 X) for each rating
- Uses `getAverageRatingsForItem()` service

**RatingModal**:
- Shows only the current user's ratings
- Defaults to lowest value (0) for unrated items
- Uses `getUserRatingsForItem()` and `updateUserRatings()` services
- Enhanced authentication handling

**ItemDetails**:
- Updated to use new average ratings service
- Maintains callback functionality for rating updates

## Database Migration

Run the following SQL script to update your database:

```sql
-- Location: src/database/user-ratings-migration.sql
```

This script will:
1. Add the `UserID` column to the Ratings table
2. Update existing data with backward compatibility
3. Create new unique constraints
4. Create performance indexes
5. Create helper views for average and user-specific ratings

## Usage

### For Users:
1. **Viewing Ratings**: See average ratings from all users in the main display
2. **Rating Items**: Click "Rate now" to open your personal rating modal
3. **Individual Ratings**: Each user maintains their own set of ratings
4. **Default Values**: Unrated items start at the lowest value (0)

### For Developers:
1. Use `getAverageRatingsForItem()` for displaying ratings to all users
2. Use `getUserRatingsForItem()` for showing user-specific ratings in modals
3. All rating operations now require user authentication
4. Ratings are stored per user, enabling personalized experiences

## API Examples

```javascript
// Get average ratings (public)
GET /api/ratings/average/technology/some-tech-id

// Get user ratings (requires auth)
GET /api/ratings/user/technology/some-tech-id
Headers: { Authorization: "Bearer <token>" }

// Update user ratings (requires auth)
PUT /api/ratings/technology/some-tech-id
Headers: { 
  Authorization: "Bearer <token>",
  Content-Type: "application/json"
}
Body: {
  "ratings": [
    {
      "ratingKey": "adoption",
      "ratingValue": 3,
      "ratingLabel": "Assess",
      "maxValue": 4
    }
  ]
}
```

## Benefits

1. **Individual Personalization**: Each user can maintain their own ratings
2. **Collective Intelligence**: Average ratings provide community consensus
3. **User Engagement**: Personal ratings encourage more participation
4. **Data Insights**: Track individual vs. collective opinions
5. **Backward Compatibility**: Existing data is preserved and migrated

## Testing

1. **Database Migration**: Run the SQL migration script
2. **Backend**: Start with `npm run dev` (port 3000)
3. **Frontend**: Start with `npm run dev` (port 5173/5174)
4. **Authentication**: Log in to access personal ratings
5. **Rate Items**: Click "Rate now" to test individual ratings
6. **Verify Averages**: Check that displays show averaged values across users