# CheapGuide Cloud Recovery Guide

This guide records the Google Cloud deployment that was torn down on 2026-10-12
and the steps needed to recreate the service later.

## Previous deployment

| Item                   | Value                                                       |
| ---------------------- | ----------------------------------------------------------- |
| Google Cloud project   | `cheapguide-firebase`                                       |
| Project name           | `cheapguide-gcp`                                            |
| Project number         | `728786892479`                                              |
| Primary region         | `us-central1`                                               |
| Cloud Run service      | `cheapguide-api-production`                                 |
| Cloud Run URL pattern  | `https://cheapguide-api-production-wnex6pcpga-uc.a.run.app` |
| Cloud SQL instance     | `cheapguide-db-production`                                  |
| Cloud SQL engine       | MySQL 8.0                                                   |
| Cloud SQL region       | `us-central1`                                               |
| Storage bucket         | `cheapguide-archive-production-2va0gv3l`                    |
| Storage bucket         | `cheapguide-media-production-2va0gv3l`                      |
| Terraform state bucket | `cheapguide-terraform-state`                                |

The project also had Firebase, Cloud Build, Artifact Registry, Secret Manager,
Cloud Scheduler, Pub/Sub, Firestore, Maps, and related APIs enabled. No App
Engine application or Compute Engine VM was present during the final inventory.

## What happened to the old project

The entire `cheapguide-firebase` project was requested for deletion. Project
deletion removes its Cloud Run service, Cloud SQL instance, buckets, secrets,
service accounts, API configuration, and remaining project resources. Database
contents were intentionally not backed up.

Google Cloud normally keeps a deleted project in a recoverable state for a
limited window (commonly 30 days). Recovery is not a substitute for a backup:
assume the database and object data are gone. If the project is still
recoverable, restore it immediately:

```powershell
$g = 'C:\Users\cynwell\AppData\Local\Google\Cloud SDK\google-cloud-sdk\bin\gcloud.cmd'
& $g projects undelete cheapguide-firebase
& $g projects describe cheapguide-firebase
```

If the project cannot be undeleted, create a new project and update all
deployment secrets, billing, OAuth/Firebase configuration, DNS, and CI
variables to use the new project ID.

## Rebuild checklist

Run these commands from the CheapGuide backend/infrastructure repository, not
from this static portfolio repository:

```powershell
$g = 'C:\Users\cynwell\AppData\Local\Google\Cloud SDK\google-cloud-sdk\bin\gcloud.cmd'

# Use the restored project when possible. Otherwise replace the ID below.
$project = 'cheapguide-firebase'
& $g config set project $project
& $g services enable run.googleapis.com sqladmin.googleapis.com storage.googleapis.com `
  artifactregistry.googleapis.com cloudbuild.googleapis.com secretmanager.googleapis.com `
  cloudscheduler.googleapis.com pubsub.googleapis.com firebase.googleapis.com

# Recreate the database in the original region.
& $g sql instances create cheapguide-db-production `
  --database-version=MYSQL_8_0 `
  --tier=REPLACE_WITH_APPROVED_TIER `
  --region=us-central1

# Recreate the application service from the backend source.
& $g run deploy cheapguide-api-production `
  --source=REPLACE_WITH_BACKEND_SOURCE `
  --region=us-central1 `
  --platform=managed `
  --allow-unauthenticated
```

Before deploying, recreate the required Secret Manager secrets and service
accounts from the backend infrastructure configuration. Do not put passwords,
tokens, or connection strings in this repository.

Recreate the three buckets only if the application still needs them. Bucket
names may not be available after deletion, so use new globally unique names:

```powershell
& $g storage buckets create gs://REPLACE_WITH_UNIQUE_ARCHIVE_BUCKET `
  --project=$project --location=us-central1 --uniform-bucket-level-access
& $g storage buckets create gs://REPLACE_WITH_UNIQUE_MEDIA_BUCKET `
  --project=$project --location=us-central1 --uniform-bucket-level-access
& $g storage buckets create gs://REPLACE_WITH_UNIQUE_TERRAFORM_STATE_BUCKET `
  --project=$project --location=us-central1 --uniform-bucket-level-access
```

Then:

1. Restore application secrets and database schema/migrations from the
   backend’s source-controlled configuration.
2. Run the backend deployment and health checks.
3. Recreate scheduled jobs, Pub/Sub topics/subscriptions, Firebase settings,
   IAM bindings, and any Maps API restrictions.
4. Update CI/CD project IDs, service-account credentials, and secret references.
5. Update DNS and frontend environment/configuration with the new API URL.
6. Verify authentication, database connectivity, uploads, scheduled jobs, and
   the production smoke test before treating the service as live.

This repository is a static GitHub Pages frontend. It does not contain the
backend source, Terraform modules, database backup, or deployment secrets
needed to restore CheapGuide by itself.
