# Unified Scan History - Quick Reference

## What Changed?

The scan history feature now automatically collects and displays scans from all three sources:
- Image uploads
- Video uploads  
- Live stream detection

## How to Use

### 1. View All Scans
- Navigate to the "Scan History" tab
- See all scans from all sources in one place
- Scans are sorted newest first

### 2. Filter by Source
- Click "All Sources" dropdown
- Select: "Image Upload", "Video Upload", or "Live Stream"
- Shows only scans from that source

### 3. Search Scans
- Type a license plate number or scan ID in the search box
- Results filter in real-time
- Example: Search "30K" to find plates containing those characters

### 4. Filter by Confidence
- Use "All Confidence" dropdown
- High (>=90%), Mid (75-90%), Low (<75%)

### 5. Paginate Results
- Shows 10 scans per page
- Use Prev/Next buttons to navigate
- Total records shown at bottom

## New API Endpoints

### Get All Scans
```
GET /api/scan-history?limit=50&offset=0&source=&search=
```

### Get Scans by Source
```
GET /api/scan-history/by-source/Image Upload?limit=50&offset=0
```

### Get Statistics
```
GET /api/scan-history/summary
```

## Scan ID Formats

- **Images**: `IMG-123456`
- **Videos**: `VID-234567`
- **Live Stream**: `LIVE-345678-0`

## Data Stored For Each Scan

- Scan ID (unique identifier)
- Timestamp (when scan occurred)
- Source (where scan came from)
- Plate (detected license plate text)
- Confidence (recognition confidence %)
- Status (success, no_plate_detected, pending)
- Detections (detailed detection data)

## Storage

- Stored in JSON file: `unified_scan_history.json`
- Keeps last 5000 scans
- Automatically updated on each scan
- Survives server restarts

## Tips

✓ Use filters to find specific scans quickly
✓ Check confidence to see accuracy of detections
✓ Source filter helps identify trends (which source works best)
✓ Export statistics for reporting
✓ Use search with partial plates for broader results
