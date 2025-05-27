# Manual Vector Search Data Import Instructions

## Overview
The automatic API import is not working due to API endpoint limitations. Follow these steps to manually import your vector data.

## Your Vector Data Location
- **GCS URI**: `gs://infinivista-vector-data/infinivista-vector-data.jsonl`
- **Contains**: 14 vector embeddings with 768 dimensions each
- **Format**: JSON Lines (JSONL)

## Manual Import Steps

### Step 1: Access Google Cloud Console
1. Go to: https://console.cloud.google.com/vertex-ai/matching-engine/indexes
2. Ensure you're in project: `infinivista`
3. Ensure you're in region: `asia-southeast1`

### Step 2: Find Your Index
1. Look for index named: `infinivista-knowledge-index`
2. Click on the index name to open details
3. Note the index ID: `1724289319050412032`

### Step 3: Import Data
1. Look for an "Import data", "Update index", or "Add data" button
2. If available, click it and provide:
   - **Data URI**: `gs://infinivista-vector-data/infinivista-vector-data.jsonl`
   - **Format**: JSONL
   - **Mode**: Replace all data (recommended for first import)

### Step 4: Alternative Method (if UI import not available)
If the UI doesn't have an import button, use the gcloud CLI:

```bash
# Install gcloud CLI if not already installed
# Then authenticate and set project
gcloud auth login
gcloud config set project infinivista

# Import data to the index
gcloud ai indexes update 1724289319050412032 \
  --region=asia-southeast1 \
  --metadata-file=update-config.json
```

Create `update-config.json`:
```json
{
  "metadata": {
    "contentsDeltaUri": "gs://infinivista-vector-data/infinivista-vector-data.jsonl",
    "isCompleteOverwrite": true
  }
}
```

### Step 5: Monitor Import Progress
1. In Google Cloud Console, go to Operations tab
2. Look for the import operation
3. Wait for completion (10-30 minutes)

## Verification

### Check Import Status
1. Go back to your index details
2. Look for data statistics (should show 14 embeddings)
3. Check that the status is "Ready"

### Test Your RAG Service
Once import completes, test with:

```bash
curl -X POST http://localhost:3002/rag/ask \
  -H "Content-Type: application/json" \
  -d '{"question": "How do I create posts in Infinivista?"}'
```

Expected response should include information about creating posts.

## Troubleshooting

### If Import Fails
1. Check that the GCS bucket `infinivista-vector-data` exists
2. Verify the file `infinivista-vector-data.jsonl` is in the bucket
3. Ensure your account has Vertex AI permissions
4. Try using a smaller subset of data first

### If RAG Service Still Returns "No Data"
1. Wait additional time (up to 1 hour) for full indexing
2. Check Vector Search endpoint status
3. Verify environment variables are correct
4. Check service logs for specific error messages

## Data Format Verification
Your JSONL file should contain entries like:
```json
{"id": "user-guide-posts", "embedding": [0.1, -0.2, 0.3, ...], "restricts": [...]}
{"id": "user-guide-stories", "embedding": [0.2, 0.1, -0.1, ...], "restricts": [...]}
```

Each entry should have:
- `id`: Unique identifier
- `embedding`: Array of 768 numbers
- `restricts`: Optional filtering metadata
