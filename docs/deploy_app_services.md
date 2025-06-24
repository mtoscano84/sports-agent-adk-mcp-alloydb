# Deploy the Application Services to CloudRun

## Before you begin
1. Open a terminal and set the following environment variables
```
export REGION=us-central1
export PROJECT_ID=sports-store-agent-ai
```

2. Enable the necesarry APIs:
```
gcloud services enable artifactregistry.googleapis.com \
                       cloudbuild.googleapis.com \
                       run.googleapis.com \
                       storage.googleapis.com \
                       aiplatform.googleapis.com 
```

3. Grant the necessary permissions:

- Get your project number to build the default service account name in the format PROJECT_NUM-compute@developer.gserviceaccount.com
```
gcloud projects describe $PROJECT_ID --format="value(projectNumber)"
```

- Grant the permissions:
```
# Grant Cloud Run service account access to GCS
gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:754204885755-compute@developer.gserviceaccount.com" \
    --role="roles/storage.admin"

gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:754204885755-compute@developer.gserviceaccount.com" \
    --role="roles/run.admin"

gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:754204885755-compute@developer.gserviceaccount.com" \
    --role="roles/artifactregistry.writer"

gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:754204885755@cloudbuild.gserviceaccount.com" \
    --role="roles/artifactregistry.repoAdmin"

# Grant Vertex AI User role to the service account
gcloud projects add-iam-policy-binding $(gcloud config get-value project) \
    --member="serviceAccount:754204885755-compute@developer.gserviceaccount.com" \
    --role="roles/aiplatform.user"

# Grant Vertex AI Model User role to the service account
gcloud projects add-iam-policy-binding $(gcloud config get-value project) \
    --member="serviceAccount:754204885755-compute@developer.gserviceaccount.com" \
    --role="roles/aiplatform.modelUser"
```

**Note**: Use the default compute service account

4. If you are under a domain restriction organization policy [restricting](https://cloud.google.com/run/docs/authenticating/public#domain-restricted-sharing) unauthenticated invocations for your project (e.g. Argolis), you will need to disable de Org Policy **iam.allowedPolicyMemberDomains**

## Deploy the backend service to CloudRun
1. Go to sports-store-agent-ai/src/backend and edit the file finn_agent.py to point the MCP ToolBox Cloud Run Service
```
def main(user_input):
    thread_id = "user-thread-1"
    model = ChatVertexAI(model_name="gemini-2.0-flash")
    
    print("Starting Toolbox client initialization...")
    try:
        client = ToolboxClient("https://toolbox-754204885755.us-central1.run.app")
        print("Toolbox client initialized successfully")
        
        print("Attempting to load toolset...")
        tools = client.load_toolset()
        print(f"Tools loaded successfully: {tools}")
        
    except Exception as e:
        print(f"Error with Toolbox: {str(e)}")
        import traceback
        print(f"Traceback: {traceback.format_exc()}")
        raise
```

**Note**: You can get the MCP ToolBox URL executing:
```
gcloud run services describe toolbox --format 'value(status.url)'
```

2. Go to sports-store-agent-ai/src/backend and edit the file app.py to point the right URL for your bucket
```
# Initialize GCS client
storage_client = storage.Client()
BUCKET_NAME = "sports-store-agent-ai-bck01"  # Replace with your bucket name
bucket = storage_client.bucket(BUCKET_NAME)
```

3. Go to sports-store-agent-ai directoy and deploy the backend service
```
## Create a repository in Artifact Registry
gcloud artifacts repositories create sports-backend-images \
    --repository-format=docker \
    --location=us-central1 \
    --project=$PROJECT_ID \
    --description="Test repository for sports-backend images"

## Build the IMAGE
gcloud builds submit src/backend/ --tag us-central1-docker.pkg.dev/$PROJECT_ID/sports-backend-images/sports-backend

## Deploy the service
gcloud run deploy sports-backend \
    --image us-central1-docker.pkg.dev/$PROJECT_ID/sports-backend-images/sports-backend \
    --platform managed \
    --allow-unauthenticated \
    --region us-central1 \
    --project $PROJECT_ID
```

Outuput:
```
Deploying container to Cloud Run service [sports-backend] in project [sports-store-agent-ai] region [us-central1]
✓ Deploying... Done.                                                                                                                                                                                                                                                  
  ✓ Creating Revision...                                                                                                                                                                                                                                              
  ✓ Routing traffic...                                                                                                                                                                                                                                                
  ✓ Setting IAM Policy...                                                                                                                                                                                                                                             
Done.                                                                                                                                                                                                                                                                 
Service [sports-backend] revision [sports-backend-00003-pq7] has been deployed and is serving 100 percent of traffic.
Service URL: https://sports-backend-535807247199.us-central1.run.app
```

4. Validate the backend service:
```
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{"message":"Hello"}' \
  https://sports-backend-535807247199.us-central1.run.app/chat
```

**Note**: Replace the URL with you Backend Cloud Run Service

## Deploy the frontend service to CloudRun
1. Go to sports-store-agent-ai/src/frontend/src/pages and edit the file Home.tsx to point the Backend Cloud Run Service URL
```
const BACKEND_URL = 'https://sports-backend-535807247199.us-central1.run.app';
```

2. Go to sports-store-agent-ai directoy and deploy the frontend service
```
## Create a repository in Artifact Registry
gcloud artifacts repositories create sports-frontend-images \
    --repository-format=docker \
    --location=us-central1 \
    --project=$PROJECT_ID \
    --description="Test repository for sports-frontend images"

## Build the IMAGE
gcloud builds submit src/frontend/ --tag us-central1-docker.pkg.dev/$PROJECT_ID/sports-frontend-images/sports-frontend

## Deploy the service
gcloud run deploy sports-frontend \
    --image us-central1-docker.pkg.dev/$PROJECT_ID/sports-frontend-images/sports-frontend \
    --platform managed \
    --allow-unauthenticated \
    --region us-central1 \
    --project $PROJECT_ID
```
Outuput:
```
Deploying container to Cloud Run service [sports-frontend] in project [sports-store-agent-ai] region [us-central1]
✓ Deploying new service... Done.                                                                                                                                                                                                                                      
  ✓ Creating Revision...                                                                                                                                                                                                                                              
  ✓ Routing traffic...                                                                                                                                                                                                                                                
  ✓ Setting IAM Policy...                                                                                                                                                                                                                                             
Done.                                                                                                                                                                                                                                                                 
Service [sports-frontend] revision [sports-frontend-00001-mdg] has been deployed and is serving 100 percent of traffic.
Service URL: https://sports-frontend-535807247199.us-central1.run.app
```

4. Open a Web Browser and use the Service URL from the previus step to connect to the App

