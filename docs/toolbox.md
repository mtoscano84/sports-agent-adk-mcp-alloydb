# Deploy MCP Toolbox to CloudRun

## Before you begin
1. Open a terminal and set the following environment variables
```
export REGION=us-central1
export PROJECT_ID=sports-store-agent-ai
```

2. Enable the necessary APIs:
```
gcloud services enable run.googleapis.com \
                       cloudbuild.googleapis.com \
                       artifactregistry.googleapis.com \
                       iam.googleapis.com \
                       secretmanager.googleapis.com

```

3. Create a new Service Account for ToolBox and grant the necessary permissions
```
gcloud iam service-accounts create toolbox-identity

gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member serviceAccount:toolbox-identity@$PROJECT_ID.iam.gserviceaccount.com \
    --role roles/secretmanager.secretAccessor

```

4. Grant the specific permission to the new SA access to AlloyDB
```
gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member='serviceAccount:toolbox-identity@'$PROJECT_ID'.iam.gserviceaccount.com' \
    --role='roles/alloydb.client'

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member='serviceAccount:toolbox-identity@'$PROJECT_ID'.iam.gserviceaccount.com' \
    --role='roles/serviceusage.serviceUsageConsumer'
```

5. Go to sports-store-agent-ai/src/toolbox and update the section "sources" of tools.yaml with the connection string from your AlloyDB Instance (use the private IP):
```
sources:
  my-pg-source:
    kind: postgres
    host: 10.41.0.5
    port: 5432
    database: store
    user: postgres
    password: Welcome1
```
**Note**: You can use the following command to get the information from the instance

```
export CLUSTER=my-alloydb-cluster
export INSTANCE=my-alloydb-instance
export REGION=us-central1

gcloud alloydb instances describe $INSTANCE \
    --cluster=$CLUSTER \
    --region=$REGION \
    --project=$PROJECT_ID
```

6. Create a new secret and upload the file "tools.yaml":
```
gcloud secrets create tools --data-file=tools.yaml
```

**Note**: Execute from the location where the tools.yaml exists (src/backend/toolbox)

7. Deploy MCP Toolbox to Cloud Run:
```
export IMAGE=us-central1-docker.pkg.dev/database-toolbox/toolbox/toolbox:latest
gcloud run deploy toolbox \
    --image $IMAGE \
    --service-account toolbox-identity \
    --region us-central1 \
    --set-secrets "/app/tools.yaml=tools:latest" \
    --args="--tools_file=/app/tools.yaml","--address=0.0.0.0","--port=8080" \
    --network my-vpc \
    --subnet my-subnet \
    --allow-unauthenticated 
```
```
gcloud run services add-iam-policy-binding toolbox \
    --member="allUsers" \
    --role="roles/run.invoker"
```

Output:
```
Deploying container to Cloud Run service [toolbox] in project [mtoscano-dev-sandbox] region [us-central1]
✓ Deploying... Done.                                                                                                                                                                                                                                                                                                                                                                                                                       
  ✓ Creating Revision...                                                                                                                                                                                                                                                                                                                                                                                                                   
  ✓ Routing traffic...                                                                                                                                                                                                                                                                                                                                                                                                                     
  ✓ Setting IAM Policy...                                                                                                                                                                                                                                                                                                                                                                                                                  
Done.                                                                                                                                                                                                                                                                                                                                                                                                                                      
Service [toolbox] revision [toolbox-00004-c7g] has been deployed and is serving 100 percent of traffic.
Service URL: https://toolbox-316231368980.us-central1.run.app
```

8. Get the URL from the ToolBox Cloud Run Service
```
gcloud run services describe toolbox --format 'value(status.url)'
```

Save the URL. You will need this URL for the backend service deployement.

