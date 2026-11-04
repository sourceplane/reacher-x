terraform {
  required_version = ">= 1.15.0"

  # State lives on the platform (SB1): the runner exports TF_HTTP_* per job, so
  # this block stays empty, no S3 bucket, no AWS role, no workspaces.
  backend "http" {}

  required_providers {
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 4.30"
    }
    external = {
      source  = "hashicorp/external"
      version = "~> 2.3"
    }
  }
}

# --- Providers ---

# Authenticates via the CLOUDFLARE_API_TOKEN env var (provider-native): the
# token is an orun-managed secret resolved into the job env at run time, so it
# never transits Terraform variables.
provider "cloudflare" {}

# --- Variables (standard Orun parameters) ---

variable "cloudflare_account_id" {
  type        = string
  sensitive   = true
  default     = ""
  description = "Cloudflare account ID (from CLOUDFLARE_ACCOUNT_ID env var)"
}

variable "orgName" {
  type    = string
  default = "sourceplane"
}

variable "owner" {
  type    = string
  default = "sourceplane"
}

variable "repo" {
  type    = string
  default = "reacher-x"
}

variable "namespace" {
  type    = string
  default = "sourceplane"
}

variable "namespacePrefix" {
  type    = string
  default = ""
}

variable "lane" {
  type    = string
  default = "verify"
}

variable "environment" {
  type    = string
  default = "stage"
}

variable "component" {
  type    = string
  default = "cloudflare-kv"
}

variable "stackName" {
  type    = string
  default = "cloudflare-kv"
}

variable "terraformDir" {
  type    = string
  default = "terraform"
}

variable "terraformVersion" {
  type    = string
  default = "1.15.3"
}

# --- KV namespace for the Next.js incremental cache ---
#
# Holds the main app's "use cache" entries and prerendered pages
# (@opennextjs/cloudflare kv-incremental-cache, binding NEXT_INC_CACHE_KV).
# One namespace per environment. Titles must be unique per Cloudflare
# account, so the title carries the repo name; the Worker binds the namespace
# by id through the wiring document, so the title is free to change.

locals {
  next_inc_cache_namespace_title = "${var.namespacePrefix}${var.repo}-next-inc-cache-${var.environment}"
}

resource "cloudflare_workers_kv_namespace" "next_inc_cache" {
  account_id = var.cloudflare_account_id
  title      = local.next_inc_cache_namespace_title
}

# --- Wiring document (published as the WIRING_CLOUDFLARE_KV orun secret) ---
# The terraform composition publishes this output on the project/<env> rung;
# the web component's deploy reads it back as WIRING_CLOUDFLARE_KV_<ENV> and
# tooling/wire renders the namespace id into wrangler.jsonc.

output "wiring" {
  description = "Wiring document for deploy-time binding resolution (pushed to orun secrets)"
  value = jsonencode({
    next_inc_cache_kv_id    = cloudflare_workers_kv_namespace.next_inc_cache.id
    next_inc_cache_kv_title = cloudflare_workers_kv_namespace.next_inc_cache.title
  })
}

output "next_inc_cache_kv_id" {
  description = "Workers KV namespace id of the Next.js incremental cache"
  value       = cloudflare_workers_kv_namespace.next_inc_cache.id
}
