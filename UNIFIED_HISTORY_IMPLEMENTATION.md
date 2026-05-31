# Unified Scan History Implementation

## Overview
This document describes the integration of media scan (image/video upload) and live stream history into a unified scan history feature.

## Backend Changes (app.py)

### New Constants Added
- `MEDIA_SCAN_LOG_PATH`: Path to store media scan logs
- `UNIFIED_HISTORY_PATH`: Path to store unified scan history (JSON)

### New Functions

#### `save_to_unified_history()`
Saves scan events from any source (image, video, or live stream) to a unified history log.

**Parameters:**
- `scan_id`: Unique identifier (format: SOURCE-TIMESTAMP)
- `source`: "Image Upload", "Video Upload", or "Live Stream"
- `plate`: Detected license plate text
- `confidence`: Recognition confidence (0-100)
- `timestamp`: ISO format timestamp
- `detections`: List of detection objects (optional)
- `video_path`: Path to video file (optional)

#### `get_unified_history()`
Retrieves scan history with optional filtering and pagination.

**Parameters:**
- `limit`: Number of records to return
- `offset`: Pagination offset
- `source`: Filter by specific source (optional)
- `search_plate`: Search by plate number or scan ID

### Updated Endpoints

#### `/api/scan-image` (POST)
- Now automatically saves image scan results to unified history
- Generates scan IDs with format: `IMG-{timestamp}`

#### `/api/scan-video-file` (POST)
- Now automatically saves video scan results to unified history
- Generates scan IDs with format: `VID-{timestamp}`
- Saves all discovered plates and events

#### `/api/scan-live-frame` (POST)
- Now automatically saves each live stream detection to unified history
- Generates scan IDs with format: `LIVE-{timestamp}-{index}`
- Each detection is recorded separately with its source metadata

### New API Endpoints

#### `GET /api/scan-history`
Get unified scan history from all sources.

**Query Parameters:**
- `limit`: Number of records (default: 50)
- `offset`: Pagination offset (default: 0)
- `source`: Filter by source ('Image Upload', 'Video Upload', 'Live Stream')
- `search`: Search by plate number or scan ID

**Response:**
```json
{
  "status": "success",
  "total": 100,
  "limit": 50,
  "offset": 0,
  "records": [...],
  "timestamp": "2025-06-15T10:30:00.000Z"
}
```

#### `GET /api/scan-history/summary`
Get summary statistics of all scans.

**Response:**
```json
{
  "total_scans": 500,
  "by_source": {
    "Image Upload": 200,
    "Video Upload": 150,
    "Live Stream": 150
  },
  "total_plates_detected": 450,
  "average_confidence": 92.5,
  "timestamp": "2025-06-15T10:30:00.000Z"
}
```

#### `GET /api/scan-history/by-source/{source}`
Get scan history filtered by specific source.

**Parameters:**
- `source`: One of "Image Upload", "Video Upload", "Live Stream"
- `limit`: Number of records (default: 50)
- `offset`: Pagination offset (default: 0)

**Response:** Same format as `/api/scan-history`

## Frontend Changes (lpr-dashboard-updated.jsx)

### ScanHistoryPage Component Updates

#### State Management
Added new state variables:
- `historyData`: Array of scan records fetched from API
- `loading`: Loading state during API calls
- `totalRecords`: Total number of available records
- Removed `typeFilter` (no longer needed - inferred from detections)
- Adjusted `perPage` from 5 to 10

#### Data Fetching
- Added `useEffect` hook to fetch history from new unified endpoint
- Fetches data when page, sourceFilter, or search changes
- Resets to page 1 when filters or search terms change
- Properly formats timestamp for display

#### UI Updates
- Added loading indicator (spinner)
- Removed "Type" column (implied by source and detections)
- Updated confidence display to use `.toFixed(1)` for consistent formatting
- Added "No Plate" status option for scans without detected plates
- Added conditional Report button (only for successful scans)
- Updated records display counter to show total from server
- Added empty state message when no results available

#### Filter Behavior
- Filters now reset pagination to page 1
- Search field also resets to page 1
- Page transitions work with server-side pagination

## Data Flow

### Image Upload Flow
1. User uploads image → `/api/scan-image`
2. Backend detects plates and recognizes text
3. Results saved to unified history with `IMG-*` scan ID
4. Response returned to frontend
5. Frontend fetches `/api/scan-history` to update display

### Video Upload Flow
1. User uploads video → `/api/scan-video-file`
2. Backend processes frames and detects all plates
3. Results saved to unified history with `VID-*` scan ID
4. Video and detection metadata returned
5. Frontend fetches `/api/scan-history` to update display

### Live Stream Flow
1. Frontend captures frame → `/api/scan-live-frame`
2. Backend detects plates in real-time
3. Each detection saved to unified history with `LIVE-*` scan ID
4. Detections returned for live display
5. Frontend can periodically fetch `/api/scan-history` for statistics

## JSON Structure (unified_scan_history.json)

```json
[
  {
    "id": "IMG-123456",
    "timestamp": "2025-06-15T10:30:00.000Z",
    "source": "Image Upload",
    "plate": "30K-123.45",
    "confidence": 97.2,
    "detections": [...],
    "video_path": null,
    "status": "success"
  },
  {
    "id": "VID-234567",
    "timestamp": "2025-06-15T10:31:00.000Z",
    "source": "Video Upload",
    "plate": "51F-456.78",
    "confidence": 94.5,
    "detections": [...],
    "video_path": "/path/to/video.mp4",
    "status": "success"
  },
  {
    "id": "LIVE-345678-0",
    "timestamp": "2025-06-15T10:32:00.000Z",
    "source": "Live Stream",
    "plate": "99Z-789.01",
    "confidence": 89.3,
    "detections": [...],
    "video_path": null,
    "status": "success"
  }
]
```

## Features

✅ Unified history from all three sources
✅ Server-side pagination and filtering
✅ Search by plate number or scan ID
✅ Source-based filtering
✅ Statistics and summary API
✅ Persistent storage (JSON)
✅ Automatic cleanup (keeps last 5000 records)
✅ Proper timestamp handling
✅ Status indicators for each scan

## Testing Recommendations

1. **Image Upload**: Upload an image with license plates
   - Verify data appears in `/api/scan-history`
   - Check scan ID format is `IMG-*`

2. **Video Upload**: Upload a video file
   - Verify all detected plates are in history
   - Check scan ID format is `VID-*`

3. **Live Stream**: Start live stream
   - Verify detections are saved to history
   - Check scan ID format is `LIVE-*`

4. **Filtering**: Test filters
   - Filter by source
   - Search by plate
   - Pagination

5. **Summary**: Check statistics endpoint
   - `/api/scan-history/summary` should show accurate counts

## Performance Considerations

- History is limited to 5000 most recent records
- Pagination recommended for large datasets
- Search is performed server-side (filter in-memory)
- Timestamps stored in ISO format for compatibility
- No database - using JSON file storage
