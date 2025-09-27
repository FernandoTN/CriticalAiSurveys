# Deployment Guide

## Overview

The Critical AI Surveys platform uses a modern cloud-native deployment architecture with containerization, infrastructure as code, and automated CI/CD pipelines. This guide covers deployment strategies for development, staging, and production environments.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     Production Environment                   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐     │
│  │     CDN     │    │ Load        │    │ Web         │     │
│  │ (Cloudflare)│ -> │ Balancer    │ -> │ Frontend    │     │
│  └─────────────┘    └─────────────┘    │ (Next.js)   │     │
│                                        └─────────────┘     │
│                                               │             │
│                                               v             │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐     │
│  │ Redis       │    │ API         │    │ Background  │     │
│  │ (Cache)     │ <- │ Gateway     │ -> │ Jobs        │     │
│  └─────────────┘    └─────────────┘    └─────────────┘     │
│                                               │             │
│                                               v             │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐     │
│  │ PostgreSQL  │    │ File        │    │ Monitoring  │     │
│  │ (Primary)   │    │ Storage     │    │ & Logging   │     │
│  └─────────────┘    │ (S3)        │    └─────────────┘     │
│                     └─────────────┘                        │
└─────────────────────────────────────────────────────────────┘
```

## Infrastructure as Code (Terraform)

### Core Infrastructure

```hcl
# infrastructure/main.tf
terraform {
  required_version = "~> 1.5"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  backend "s3" {
    bucket         = "critical-ai-surveys-terraform-state"
    key            = "production/terraform.tfstate"
    region         = "us-west-2"
    encrypt        = true
    dynamodb_table = "terraform-locks"
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = "critical-ai-surveys"
      Environment = var.environment
      ManagedBy   = "terraform"
    }
  }
}

# VPC Configuration
module "vpc" {
  source = "terraform-aws-modules/vpc/aws"

  name = "${var.project_name}-${var.environment}"
  cidr = var.vpc_cidr

  azs             = var.availability_zones
  private_subnets = var.private_subnet_cidrs
  public_subnets  = var.public_subnet_cidrs

  enable_nat_gateway = true
  enable_vpn_gateway = false
  enable_dns_hostnames = true
  enable_dns_support = true

  tags = {
    Environment = var.environment
  }
}

# Security Groups
resource "aws_security_group" "web" {
  name_prefix = "${var.project_name}-web-"
  vpc_id      = module.vpc.vpc_id

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${var.project_name}-web-sg"
  }
}

resource "aws_security_group" "database" {
  name_prefix = "${var.project_name}-db-"
  vpc_id      = module.vpc.vpc_id

  ingress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.web.id]
  }

  tags = {
    Name = "${var.project_name}-db-sg"
  }
}
```

### ECS Fargate Cluster

```hcl
# infrastructure/ecs.tf
resource "aws_ecs_cluster" "main" {
  name = "${var.project_name}-${var.environment}"

  configuration {
    execute_command_configuration {
      logging = "OVERRIDE"

      log_configuration {
        cloud_watch_encryption_enabled = true
        cloud_watch_log_group_name     = aws_cloudwatch_log_group.ecs.name
      }
    }
  }

  setting {
    name  = "containerInsights"
    value = "enabled"
  }
}

resource "aws_ecs_cluster_capacity_providers" "main" {
  cluster_name = aws_ecs_cluster.main.name

  capacity_providers = ["FARGATE", "FARGATE_SPOT"]

  default_capacity_provider_strategy {
    base              = 1
    weight            = 100
    capacity_provider = "FARGATE"
  }
}

# Application Load Balancer
resource "aws_lb" "main" {
  name               = "${var.project_name}-${var.environment}-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.web.id]
  subnets           = module.vpc.public_subnets

  enable_deletion_protection = var.environment == "production"

  tags = {
    Environment = var.environment
  }
}

resource "aws_lb_target_group" "web" {
  name        = "${var.project_name}-web-${var.environment}"
  port        = 3000
  protocol    = "HTTP"
  vpc_id      = module.vpc.vpc_id
  target_type = "ip"

  health_check {
    enabled             = true
    healthy_threshold   = 2
    interval            = 30
    matcher             = "200"
    path                = "/health"
    port                = "traffic-port"
    protocol            = "HTTP"
    timeout             = 5
    unhealthy_threshold = 2
  }

  tags = {
    Environment = var.environment
  }
}

resource "aws_lb_target_group" "api" {
  name        = "${var.project_name}-api-${var.environment}"
  port        = 8000
  protocol    = "HTTP"
  vpc_id      = module.vpc.vpc_id
  target_type = "ip"

  health_check {
    enabled             = true
    healthy_threshold   = 2
    interval            = 30
    matcher             = "200"
    path                = "/health"
    port                = "traffic-port"
    protocol            = "HTTP"
    timeout             = 5
    unhealthy_threshold = 2
  }

  tags = {
    Environment = var.environment
  }
}

resource "aws_lb_listener" "web" {
  load_balancer_arn = aws_lb.main.arn
  port              = "443"
  protocol          = "HTTPS"
  ssl_policy        = "ELBSecurityPolicy-TLS-1-2-2017-01"
  certificate_arn   = aws_acm_certificate.main.arn

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.web.arn
  }
}

resource "aws_lb_listener_rule" "api" {
  listener_arn = aws_lb_listener.web.arn
  priority     = 100

  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.api.arn
  }

  condition {
    path_pattern {
      values = ["/api/*"]
    }
  }
}
```

### Database (RDS)

```hcl
# infrastructure/database.tf
resource "aws_db_subnet_group" "main" {
  name       = "${var.project_name}-${var.environment}"
  subnet_ids = module.vpc.private_subnets

  tags = {
    Name = "${var.project_name} DB subnet group"
  }
}

resource "aws_db_parameter_group" "main" {
  family = "postgres15"
  name   = "${var.project_name}-${var.environment}"

  parameter {
    name  = "log_statement"
    value = "all"
  }

  parameter {
    name  = "log_min_duration_statement"
    value = "1000" # Log queries longer than 1 second
  }

  parameter {
    name  = "shared_preload_libraries"
    value = "pg_stat_statements"
  }
}

resource "aws_db_instance" "main" {
  identifier = "${var.project_name}-${var.environment}"

  engine         = "postgres"
  engine_version = "15.4"
  instance_class = var.db_instance_class

  allocated_storage     = var.db_allocated_storage
  max_allocated_storage = var.db_max_allocated_storage
  storage_type          = "gp3"
  storage_encrypted     = true
  kms_key_id           = aws_kms_key.main.arn

  db_name  = var.db_name
  username = var.db_username
  password = var.db_password

  vpc_security_group_ids = [aws_security_group.database.id]
  db_subnet_group_name   = aws_db_subnet_group.main.name
  parameter_group_name   = aws_db_parameter_group.main.name

  backup_retention_period = var.environment == "production" ? 30 : 7
  backup_window          = "03:00-04:00"
  maintenance_window     = "sun:04:00-sun:05:00"

  skip_final_snapshot       = var.environment != "production"
  final_snapshot_identifier = var.environment == "production" ? "${var.project_name}-final-snapshot-${formatdate("YYYY-MM-DD-hhmm", timestamp())}" : null

  performance_insights_enabled = true
  monitoring_interval         = 60
  monitoring_role_arn        = aws_iam_role.rds_monitoring.arn

  enabled_cloudwatch_logs_exports = ["postgresql", "upgrade"]

  tags = {
    Environment = var.environment
  }
}

# Read replica for analytics workloads
resource "aws_db_instance" "replica" {
  count = var.environment == "production" ? 1 : 0

  identifier = "${var.project_name}-${var.environment}-replica"

  replicate_source_db = aws_db_instance.main.id
  instance_class      = var.db_replica_instance_class

  auto_minor_version_upgrade = false

  tags = {
    Environment = var.environment
    Purpose     = "analytics"
  }
}
```

### Redis Cache

```hcl
# infrastructure/redis.tf
resource "aws_elasticache_subnet_group" "main" {
  name       = "${var.project_name}-${var.environment}"
  subnet_ids = module.vpc.private_subnets
}

resource "aws_elasticache_parameter_group" "main" {
  family = "redis7"
  name   = "${var.project_name}-${var.environment}"

  parameter {
    name  = "maxmemory-policy"
    value = "allkeys-lru"
  }
}

resource "aws_elasticache_replication_group" "main" {
  replication_group_id       = "${var.project_name}-${var.environment}"
  description               = "Redis cluster for ${var.project_name}"

  node_type               = var.redis_node_type
  port                   = 6379
  parameter_group_name   = aws_elasticache_parameter_group.main.name

  num_cache_clusters         = var.redis_num_cache_nodes
  automatic_failover_enabled = var.redis_num_cache_nodes > 1
  multi_az_enabled          = var.redis_num_cache_nodes > 1

  subnet_group_name  = aws_elasticache_subnet_group.main.name
  security_group_ids = [aws_security_group.redis.id]

  at_rest_encryption_enabled = true
  transit_encryption_enabled = true
  auth_token                = var.redis_auth_token

  log_delivery_configuration {
    destination      = aws_cloudwatch_log_group.redis.name
    destination_type = "cloudwatch-logs"
    log_format      = "text"
    log_type        = "slow-log"
  }

  tags = {
    Environment = var.environment
  }
}

resource "aws_security_group" "redis" {
  name_prefix = "${var.project_name}-redis-"
  vpc_id      = module.vpc.vpc_id

  ingress {
    from_port       = 6379
    to_port         = 6379
    protocol        = "tcp"
    security_groups = [aws_security_group.web.id]
  }

  tags = {
    Name = "${var.project_name}-redis-sg"
  }
}
```

## Container Configuration

### Docker Setup

```dockerfile
# Dockerfile.web (Frontend)
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json package-lock.json* ./
RUN npm ci --only=production

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build the application
ENV NEXT_TELEMETRY_DISABLED 1
RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy built application
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

CMD ["node", "server.js"]
```

```dockerfile
# Dockerfile.api (Backend)
FROM node:18-alpine AS base

FROM base AS deps
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

COPY package.json package-lock.json* ./
COPY prisma ./prisma/
RUN npm ci --only=production

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build the application
RUN npm run build

FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nodejs
RUN apk add --no-cache curl

# Copy built application
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nodejs:nodejs /app/package.json ./package.json

USER nodejs

EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8000/health || exit 1

CMD ["node", "dist/main.js"]
```

### ECS Task Definitions

```hcl
# infrastructure/ecs-tasks.tf
resource "aws_ecs_task_definition" "web" {
  family                   = "${var.project_name}-web-${var.environment}"
  network_mode            = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                     = var.web_cpu
  memory                  = var.web_memory
  execution_role_arn      = aws_iam_role.ecs_execution.arn
  task_role_arn          = aws_iam_role.ecs_task.arn

  container_definitions = jsonencode([
    {
      name  = "web"
      image = "${aws_ecr_repository.web.repository_url}:${var.image_tag}"

      portMappings = [
        {
          containerPort = 3000
          protocol      = "tcp"
        }
      ]

      environment = [
        {
          name  = "NODE_ENV"
          value = var.environment
        },
        {
          name  = "API_URL"
          value = "https://${var.domain_name}/api"
        }
      ]

      secrets = [
        {
          name      = "NEXTAUTH_SECRET"
          valueFrom = aws_ssm_parameter.nextauth_secret.arn
        }
      ]

      logConfiguration = {
        logDriver = "awslogs"
        options = {
          awslogs-group         = aws_cloudwatch_log_group.web.name
          awslogs-region        = var.aws_region
          awslogs-stream-prefix = "ecs"
        }
      }

      healthCheck = {
        command     = ["CMD-SHELL", "curl -f http://localhost:3000/health || exit 1"]
        interval    = 30
        timeout     = 5
        retries     = 3
        startPeriod = 60
      }
    }
  ])

  tags = {
    Environment = var.environment
  }
}

resource "aws_ecs_task_definition" "api" {
  family                   = "${var.project_name}-api-${var.environment}"
  network_mode            = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                     = var.api_cpu
  memory                  = var.api_memory
  execution_role_arn      = aws_iam_role.ecs_execution.arn
  task_role_arn          = aws_iam_role.ecs_task.arn

  container_definitions = jsonencode([
    {
      name  = "api"
      image = "${aws_ecr_repository.api.repository_url}:${var.image_tag}"

      portMappings = [
        {
          containerPort = 8000
          protocol      = "tcp"
        }
      ]

      environment = [
        {
          name  = "NODE_ENV"
          value = var.environment
        },
        {
          name  = "PORT"
          value = "8000"
        },
        {
          name  = "REDIS_URL"
          value = "redis://${aws_elasticache_replication_group.main.configuration_endpoint_address}:6379"
        }
      ]

      secrets = [
        {
          name      = "DATABASE_URL"
          valueFrom = aws_ssm_parameter.database_url.arn
        },
        {
          name      = "JWT_SECRET"
          valueFrom = aws_ssm_parameter.jwt_secret.arn
        },
        {
          name      = "OPENAI_API_KEY"
          valueFrom = aws_ssm_parameter.openai_api_key.arn
        }
      ]

      logConfiguration = {
        logDriver = "awslogs"
        options = {
          awslogs-group         = aws_cloudwatch_log_group.api.name
          awslogs-region        = var.aws_region
          awslogs-stream-prefix = "ecs"
        }
      }

      healthCheck = {
        command     = ["CMD-SHELL", "curl -f http://localhost:8000/health || exit 1"]
        interval    = 30
        timeout     = 5
        retries     = 3
        startPeriod = 60
      }
    }
  ])

  tags = {
    Environment = var.environment
  }
}

# ECS Services
resource "aws_ecs_service" "web" {
  name            = "${var.project_name}-web-${var.environment}"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.web.arn
  desired_count   = var.web_desired_count

  capacity_provider_strategy {
    capacity_provider = "FARGATE"
    weight           = 100
  }

  network_configuration {
    security_groups  = [aws_security_group.web.id]
    subnets         = module.vpc.private_subnets
    assign_public_ip = false
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.web.arn
    container_name   = "web"
    container_port   = 3000
  }

  deployment_configuration {
    maximum_percent         = 200
    minimum_healthy_percent = 100
  }

  lifecycle {
    ignore_changes = [desired_count]
  }

  tags = {
    Environment = var.environment
  }
}

resource "aws_ecs_service" "api" {
  name            = "${var.project_name}-api-${var.environment}"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.api.arn
  desired_count   = var.api_desired_count

  capacity_provider_strategy {
    capacity_provider = "FARGATE"
    weight           = 100
  }

  network_configuration {
    security_groups  = [aws_security_group.web.id]
    subnets         = module.vpc.private_subnets
    assign_public_ip = false
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.api.arn
    container_name   = "api"
    container_port   = 8000
  }

  deployment_configuration {
    maximum_percent         = 200
    minimum_healthy_percent = 100
  }

  lifecycle {
    ignore_changes = [desired_count]
  }

  tags = {
    Environment = var.environment
  }
}
```

## CI/CD Pipeline

### GitHub Actions Deployment Workflow

```yaml
# .github/workflows/deploy.yml
name: Deploy to AWS

on:
  push:
    branches:
      - main
      - develop
  release:
    types: [published]

env:
  AWS_REGION: us-west-2
  ECR_REGISTRY: ${{ secrets.AWS_ACCOUNT_ID }}.dkr.ecr.us-west-2.amazonaws.com

jobs:
  determine-environment:
    runs-on: ubuntu-latest
    outputs:
      environment: ${{ steps.env.outputs.environment }}
      image-tag: ${{ steps.tag.outputs.tag }}
    steps:
      - name: Determine environment
        id: env
        run: |
          if [[ "${{ github.event_name }}" == "release" ]]; then
            echo "environment=production" >> $GITHUB_OUTPUT
          elif [[ "${{ github.ref }}" == "refs/heads/main" ]]; then
            echo "environment=staging" >> $GITHUB_OUTPUT
          else
            echo "environment=development" >> $GITHUB_OUTPUT
          fi

      - name: Generate image tag
        id: tag
        run: |
          if [[ "${{ github.event_name }}" == "release" ]]; then
            echo "tag=${{ github.event.release.tag_name }}" >> $GITHUB_OUTPUT
          else
            echo "tag=${{ github.sha }}" >> $GITHUB_OUTPUT
          fi

  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm run test:ci

      - name: Run security audit
        run: npm audit --audit-level=high

  build-and-push:
    runs-on: ubuntu-latest
    needs: [determine-environment, test]
    if: needs.determine-environment.outputs.environment != 'development'

    strategy:
      matrix:
        service: [web, api]

    steps:
      - uses: actions/checkout@v4

      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ${{ env.AWS_REGION }}

      - name: Login to Amazon ECR
        id: login-ecr
        uses: aws-actions/amazon-ecr-login@v2

      - name: Build, tag, and push image
        env:
          IMAGE_TAG: ${{ needs.determine-environment.outputs.image-tag }}
          SERVICE: ${{ matrix.service }}
        run: |
          docker build -f Dockerfile.$SERVICE -t $ECR_REGISTRY/critical-ai-surveys-$SERVICE:$IMAGE_TAG .
          docker tag $ECR_REGISTRY/critical-ai-surveys-$SERVICE:$IMAGE_TAG $ECR_REGISTRY/critical-ai-surveys-$SERVICE:latest
          docker push $ECR_REGISTRY/critical-ai-surveys-$SERVICE:$IMAGE_TAG
          docker push $ECR_REGISTRY/critical-ai-surveys-$SERVICE:latest

  deploy-infrastructure:
    runs-on: ubuntu-latest
    needs: [determine-environment, build-and-push]
    environment: ${{ needs.determine-environment.outputs.environment }}

    steps:
      - uses: actions/checkout@v4

      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ${{ env.AWS_REGION }}

      - name: Setup Terraform
        uses: hashicorp/setup-terraform@v3
        with:
          terraform_version: 1.5.0

      - name: Terraform Init
        working-directory: infrastructure
        run: terraform init

      - name: Terraform Plan
        working-directory: infrastructure
        env:
          TF_VAR_environment: ${{ needs.determine-environment.outputs.environment }}
          TF_VAR_image_tag: ${{ needs.determine-environment.outputs.image-tag }}
        run: terraform plan -var-file="${{ needs.determine-environment.outputs.environment }}.tfvars"

      - name: Terraform Apply
        working-directory: infrastructure
        if: github.ref == 'refs/heads/main' || github.event_name == 'release'
        env:
          TF_VAR_environment: ${{ needs.determine-environment.outputs.environment }}
          TF_VAR_image_tag: ${{ needs.determine-environment.outputs.image-tag }}
        run: terraform apply -auto-approve -var-file="${{ needs.determine-environment.outputs.environment }}.tfvars"

  deploy-application:
    runs-on: ubuntu-latest
    needs: [determine-environment, build-and-push, deploy-infrastructure]
    environment: ${{ needs.determine-environment.outputs.environment }}

    steps:
      - uses: actions/checkout@v4

      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ${{ env.AWS_REGION }}

      - name: Run database migrations
        env:
          ENVIRONMENT: ${{ needs.determine-environment.outputs.environment }}
        run: |
          # Get database connection string from AWS Systems Manager
          DATABASE_URL=$(aws ssm get-parameter --name "/critical-ai-surveys/$ENVIRONMENT/database-url" --with-decryption --query 'Parameter.Value' --output text)

          # Run migrations using a temporary ECS task
          aws ecs run-task \
            --cluster critical-ai-surveys-$ENVIRONMENT \
            --task-definition critical-ai-surveys-migration-$ENVIRONMENT \
            --network-configuration "awsvpcConfiguration={subnets=[$(aws ec2 describe-subnets --filters "Name=tag:Name,Values=*private*" --query 'Subnets[0].SubnetId' --output text)],securityGroups=[$(aws ec2 describe-security-groups --filters "Name=tag:Name,Values=*web*" --query 'SecurityGroups[0].GroupId' --output text)]}" \
            --overrides "{\"containerOverrides\":[{\"name\":\"migration\",\"command\":[\"npx\",\"prisma\",\"migrate\",\"deploy\"]}]}"

      - name: Update ECS services
        env:
          ENVIRONMENT: ${{ needs.determine-environment.outputs.environment }}
          IMAGE_TAG: ${{ needs.determine-environment.outputs.image-tag }}
        run: |
          # Update web service
          aws ecs update-service \
            --cluster critical-ai-surveys-$ENVIRONMENT \
            --service critical-ai-surveys-web-$ENVIRONMENT \
            --force-new-deployment

          # Update API service
          aws ecs update-service \
            --cluster critical-ai-surveys-$ENVIRONMENT \
            --service critical-ai-surveys-api-$ENVIRONMENT \
            --force-new-deployment

      - name: Wait for deployment
        env:
          ENVIRONMENT: ${{ needs.determine-environment.outputs.environment }}
        run: |
          # Wait for services to stabilize
          aws ecs wait services-stable \
            --cluster critical-ai-surveys-$ENVIRONMENT \
            --services critical-ai-surveys-web-$ENVIRONMENT critical-ai-surveys-api-$ENVIRONMENT

  smoke-tests:
    runs-on: ubuntu-latest
    needs: [determine-environment, deploy-application]

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run smoke tests
        env:
          BASE_URL: ${{ needs.determine-environment.outputs.environment == 'production' && 'https://criticalaisurveys.com' || 'https://staging.criticalaisurveys.com' }}
        run: npm run test:smoke

  notify:
    runs-on: ubuntu-latest
    needs: [determine-environment, smoke-tests]
    if: always()

    steps:
      - name: Notify Slack
        uses: 8398a7/action-slack@v3
        with:
          status: ${{ job.status }}
          channel: '#deployments'
          webhook_url: ${{ secrets.SLACK_WEBHOOK }}
        env:
          SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK }}
```

## Environment Configuration

### Environment Variables Management

```hcl
# infrastructure/secrets.tf
resource "aws_ssm_parameter" "database_url" {
  name  = "/${var.project_name}/${var.environment}/database-url"
  type  = "SecureString"
  value = "postgresql://${var.db_username}:${var.db_password}@${aws_db_instance.main.endpoint}:5432/${var.db_name}?sslmode=require"

  tags = {
    Environment = var.environment
  }
}

resource "aws_ssm_parameter" "jwt_secret" {
  name  = "/${var.project_name}/${var.environment}/jwt-secret"
  type  = "SecureString"
  value = var.jwt_secret

  tags = {
    Environment = var.environment
  }
}

resource "aws_ssm_parameter" "nextauth_secret" {
  name  = "/${var.project_name}/${var.environment}/nextauth-secret"
  type  = "SecureString"
  value = var.nextauth_secret

  tags = {
    Environment = var.environment
  }
}

resource "aws_ssm_parameter" "openai_api_key" {
  name  = "/${var.project_name}/${var.environment}/openai-api-key"
  type  = "SecureString"
  value = var.openai_api_key

  tags = {
    Environment = var.environment
  }
}

resource "aws_ssm_parameter" "redis_auth_token" {
  name  = "/${var.project_name}/${var.environment}/redis-auth-token"
  type  = "SecureString"
  value = var.redis_auth_token

  tags = {
    Environment = var.environment
  }
}
```

### Environment-Specific Variables

```hcl
# infrastructure/production.tfvars
environment = "production"
aws_region  = "us-west-2"

# VPC Configuration
vpc_cidr = "10.0.0.0/16"
availability_zones = ["us-west-2a", "us-west-2b", "us-west-2c"]
private_subnet_cidrs = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
public_subnet_cidrs  = ["10.0.101.0/24", "10.0.102.0/24", "10.0.103.0/24"]

# Database Configuration
db_instance_class         = "db.r6g.large"
db_allocated_storage      = 100
db_max_allocated_storage  = 1000
db_replica_instance_class = "db.r6g.large"

# Redis Configuration
redis_node_type        = "cache.r6g.large"
redis_num_cache_nodes  = 3

# ECS Configuration
web_cpu            = 1024
web_memory         = 2048
web_desired_count  = 3

api_cpu            = 2048
api_memory         = 4096
api_desired_count  = 5

# Domain Configuration
domain_name = "criticalaisurveys.com"
```

```hcl
# infrastructure/staging.tfvars
environment = "staging"
aws_region  = "us-west-2"

# VPC Configuration
vpc_cidr = "10.1.0.0/16"
availability_zones = ["us-west-2a", "us-west-2b"]
private_subnet_cidrs = ["10.1.1.0/24", "10.1.2.0/24"]
public_subnet_cidrs  = ["10.1.101.0/24", "10.1.102.0/24"]

# Database Configuration
db_instance_class         = "db.t3.medium"
db_allocated_storage      = 20
db_max_allocated_storage  = 100

# Redis Configuration
redis_node_type        = "cache.t3.micro"
redis_num_cache_nodes  = 1

# ECS Configuration
web_cpu            = 512
web_memory         = 1024
web_desired_count  = 1

api_cpu            = 1024
api_memory         = 2048
api_desired_count  = 2

# Domain Configuration
domain_name = "staging.criticalaisurveys.com"
```

## Monitoring & Observability

### CloudWatch Configuration

```hcl
# infrastructure/monitoring.tf
resource "aws_cloudwatch_log_group" "web" {
  name              = "/ecs/${var.project_name}-web-${var.environment}"
  retention_in_days = var.environment == "production" ? 30 : 7

  tags = {
    Environment = var.environment
  }
}

resource "aws_cloudwatch_log_group" "api" {
  name              = "/ecs/${var.project_name}-api-${var.environment}"
  retention_in_days = var.environment == "production" ? 30 : 7

  tags = {
    Environment = var.environment
  }
}

resource "aws_cloudwatch_log_group" "redis" {
  name              = "/elasticache/${var.project_name}-${var.environment}"
  retention_in_days = 7

  tags = {
    Environment = var.environment
  }
}

# Custom Metrics and Alarms
resource "aws_cloudwatch_metric_alarm" "high_cpu" {
  alarm_name          = "${var.project_name}-${var.environment}-high-cpu"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/ECS"
  period              = "300"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "This metric monitors ecs cpu utilization"

  dimensions = {
    ServiceName = aws_ecs_service.api.name
    ClusterName = aws_ecs_cluster.main.name
  }

  alarm_actions = [aws_sns_topic.alerts.arn]

  tags = {
    Environment = var.environment
  }
}

resource "aws_cloudwatch_metric_alarm" "database_cpu" {
  alarm_name          = "${var.project_name}-${var.environment}-db-high-cpu"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/RDS"
  period              = "300"
  statistic           = "Average"
  threshold           = "75"
  alarm_description   = "This metric monitors RDS CPU utilization"

  dimensions = {
    DBInstanceIdentifier = aws_db_instance.main.id
  }

  alarm_actions = [aws_sns_topic.alerts.arn]

  tags = {
    Environment = var.environment
  }
}

resource "aws_cloudwatch_metric_alarm" "api_errors" {
  alarm_name          = "${var.project_name}-${var.environment}-api-errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "HTTPCode_Target_5XX_Count"
  namespace           = "AWS/ApplicationELB"
  period              = "300"
  statistic           = "Sum"
  threshold           = "10"
  alarm_description   = "This metric monitors API 5xx errors"
  treat_missing_data  = "notBreaching"

  dimensions = {
    TargetGroup = aws_lb_target_group.api.arn_suffix
  }

  alarm_actions = [aws_sns_topic.alerts.arn]

  tags = {
    Environment = var.environment
  }
}

# SNS Topic for Alerts
resource "aws_sns_topic" "alerts" {
  name = "${var.project_name}-${var.environment}-alerts"

  tags = {
    Environment = var.environment
  }
}

resource "aws_sns_topic_subscription" "email_alerts" {
  count     = length(var.alert_email_addresses)
  topic_arn = aws_sns_topic.alerts.arn
  protocol  = "email"
  endpoint  = var.alert_email_addresses[count.index]
}
```

### Application Performance Monitoring

```hcl
# infrastructure/x-ray.tf
resource "aws_iam_role_policy_attachment" "ecs_task_xray" {
  role       = aws_iam_role.ecs_task.name
  policy_arn = "arn:aws:iam::aws:policy/AWSXRayDaemonWriteAccess"
}

# Add X-Ray sidecar to ECS task definitions
locals {
  xray_container = {
    name  = "xray-daemon"
    image = "amazon/aws-xray-daemon:latest"

    portMappings = [
      {
        containerPort = 2000
        protocol      = "udp"
      }
    ]

    logConfiguration = {
      logDriver = "awslogs"
      options = {
        awslogs-group         = aws_cloudwatch_log_group.xray.name
        awslogs-region        = var.aws_region
        awslogs-stream-prefix = "xray"
      }
    }
  }
}

resource "aws_cloudwatch_log_group" "xray" {
  name              = "/xray/${var.project_name}-${var.environment}"
  retention_in_days = 7

  tags = {
    Environment = var.environment
  }
}
```

## Security Hardening

### IAM Roles and Policies

```hcl
# infrastructure/iam.tf
resource "aws_iam_role" "ecs_execution" {
  name = "${var.project_name}-ecs-execution-${var.environment}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ecs-tasks.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Environment = var.environment
  }
}

resource "aws_iam_role_policy_attachment" "ecs_execution" {
  role       = aws_iam_role.ecs_execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

resource "aws_iam_role_policy" "ecs_execution_ssm" {
  name = "${var.project_name}-ecs-execution-ssm-${var.environment}"
  role = aws_iam_role.ecs_execution.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "ssm:GetParameters",
          "ssm:GetParameter",
          "ssm:GetParametersByPath"
        ]
        Resource = [
          "arn:aws:ssm:${var.aws_region}:${data.aws_caller_identity.current.account_id}:parameter/${var.project_name}/${var.environment}/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "kms:Decrypt"
        ]
        Resource = [
          aws_kms_key.main.arn
        ]
      }
    ]
  })
}

resource "aws_iam_role" "ecs_task" {
  name = "${var.project_name}-ecs-task-${var.environment}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ecs-tasks.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Environment = var.environment
  }
}

resource "aws_iam_role_policy" "ecs_task_s3" {
  name = "${var.project_name}-ecs-task-s3-${var.environment}"
  role = aws_iam_role.ecs_task.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject"
        ]
        Resource = [
          "${aws_s3_bucket.uploads.arn}/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "s3:ListBucket"
        ]
        Resource = [
          aws_s3_bucket.uploads.arn
        ]
      }
    ]
  })
}
```

### KMS Key Management

```hcl
# infrastructure/kms.tf
resource "aws_kms_key" "main" {
  description             = "KMS key for ${var.project_name} ${var.environment}"
  deletion_window_in_days = var.environment == "production" ? 30 : 7

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "Enable IAM User Permissions"
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
        }
        Action   = "kms:*"
        Resource = "*"
      },
      {
        Sid    = "Allow ECS tasks to use the key"
        Effect = "Allow"
        Principal = {
          AWS = [
            aws_iam_role.ecs_execution.arn,
            aws_iam_role.ecs_task.arn
          ]
        }
        Action = [
          "kms:Encrypt",
          "kms:Decrypt",
          "kms:ReEncrypt*",
          "kms:GenerateDataKey*",
          "kms:DescribeKey"
        ]
        Resource = "*"
      }
    ]
  })

  tags = {
    Environment = var.environment
  }
}

resource "aws_kms_alias" "main" {
  name          = "alias/${var.project_name}-${var.environment}"
  target_key_id = aws_kms_key.main.key_id
}
```

## Backup & Disaster Recovery

### Database Backup Strategy

```hcl
# infrastructure/backup.tf
resource "aws_db_instance" "main" {
  # ... other configuration ...

  backup_retention_period = var.environment == "production" ? 30 : 7
  backup_window          = "03:00-04:00"
  copy_tags_to_snapshot  = true
  delete_automated_backups = false

  # Point-in-time recovery
  enabled_cloudwatch_logs_exports = ["postgresql", "upgrade"]

  tags = {
    Environment = var.environment
    BackupPolicy = var.environment == "production" ? "daily" : "weekly"
  }
}

# Cross-region backup for production
resource "aws_db_instance" "backup_replica" {
  count = var.environment == "production" ? 1 : 0

  identifier = "${var.project_name}-backup-replica"

  # Cross-region read replica
  replicate_source_db = aws_db_instance.main.arn
  instance_class      = "db.t3.medium"

  # Different region for disaster recovery
  provider = aws.backup_region

  tags = {
    Environment = var.environment
    Purpose     = "disaster-recovery"
  }
}

# Automated S3 backup for application data
resource "aws_s3_bucket" "backups" {
  bucket = "${var.project_name}-backups-${var.environment}-${random_id.bucket_suffix.hex}"

  tags = {
    Environment = var.environment
    Purpose     = "backups"
  }
}

resource "aws_s3_bucket_versioning" "backups" {
  bucket = aws_s3_bucket.backups.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "backups" {
  bucket = aws_s3_bucket.backups.id

  rule {
    id     = "backup_lifecycle"
    status = "Enabled"

    transition {
      days          = 30
      storage_class = "STANDARD_IA"
    }

    transition {
      days          = 90
      storage_class = "GLACIER"
    }

    transition {
      days          = 365
      storage_class = "DEEP_ARCHIVE"
    }

    expiration {
      days = var.environment == "production" ? 2555 : 90 # 7 years for production
    }
  }
}

# AWS Backup for automated backups
resource "aws_backup_vault" "main" {
  name        = "${var.project_name}-${var.environment}"
  kms_key_arn = aws_kms_key.main.arn

  tags = {
    Environment = var.environment
  }
}

resource "aws_backup_plan" "main" {
  name = "${var.project_name}-${var.environment}"

  rule {
    rule_name         = "daily_backup"
    target_vault_name = aws_backup_vault.main.name
    schedule          = "cron(0 5 ? * * *)" # 5 AM UTC daily

    start_window = 60  # 1 hour
    completion_window = 120  # 2 hours

    lifecycle {
      cold_storage_after = 30
      delete_after       = var.environment == "production" ? 2555 : 90
    }

    recovery_point_tags = {
      Environment = var.environment
    }
  }

  tags = {
    Environment = var.environment
  }
}

resource "aws_backup_selection" "main" {
  iam_role_arn = aws_iam_role.backup.arn
  name         = "${var.project_name}-${var.environment}"
  plan_id      = aws_backup_plan.main.id

  resources = [
    aws_db_instance.main.arn,
    aws_s3_bucket.uploads.arn
  ]

  selection_tag {
    type  = "STRINGEQUALS"
    key   = "Environment"
    value = var.environment
  }
}

resource "aws_iam_role" "backup" {
  name = "${var.project_name}-backup-${var.environment}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "backup.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Environment = var.environment
  }
}

resource "aws_iam_role_policy_attachment" "backup_service" {
  role       = aws_iam_role.backup.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSBackupServiceRolePolicyForBackup"
}
```

## Scaling & Auto-scaling

### Application Auto-scaling

```hcl
# infrastructure/autoscaling.tf
resource "aws_appautoscaling_target" "api" {
  max_capacity       = var.environment == "production" ? 20 : 5
  min_capacity       = var.environment == "production" ? 2 : 1
  resource_id        = "service/${aws_ecs_cluster.main.name}/${aws_ecs_service.api.name}"
  scalable_dimension = "ecs:service:DesiredCount"
  service_namespace  = "ecs"

  tags = {
    Environment = var.environment
  }
}

resource "aws_appautoscaling_policy" "api_cpu" {
  name               = "${var.project_name}-api-cpu-${var.environment}"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.api.resource_id
  scalable_dimension = aws_appautoscaling_target.api.scalable_dimension
  service_namespace  = aws_appautoscaling_target.api.service_namespace

  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageCPUUtilization"
    }

    target_value       = 60.0
    scale_in_cooldown  = 300
    scale_out_cooldown = 300
  }
}

resource "aws_appautoscaling_policy" "api_memory" {
  name               = "${var.project_name}-api-memory-${var.environment}"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.api.resource_id
  scalable_dimension = aws_appautoscaling_target.api.scalable_dimension
  service_namespace  = aws_appautoscaling_target.api.service_namespace

  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageMemoryUtilization"
    }

    target_value       = 70.0
    scale_in_cooldown  = 300
    scale_out_cooldown = 300
  }
}

# Custom scaling based on ALB request count
resource "aws_appautoscaling_policy" "api_requests" {
  name               = "${var.project_name}-api-requests-${var.environment}"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.api.resource_id
  scalable_dimension = aws_appautoscaling_target.api.scalable_dimension
  service_namespace  = aws_appautoscaling_target.api.service_namespace

  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ALBRequestCountPerTarget"
      resource_label         = "${aws_lb.main.arn_suffix}/${aws_lb_target_group.api.arn_suffix}"
    }

    target_value = 1000.0 # 1000 requests per target per minute
  }
}
```

## Deployment Commands

### Local Development Setup

```bash
#!/bin/bash
# scripts/setup-local.sh

set -e

echo "Setting up local development environment..."

# Check prerequisites
command -v docker >/dev/null 2>&1 || { echo "Docker is required but not installed." >&2; exit 1; }
command -v docker-compose >/dev/null 2>&1 || { echo "Docker Compose is required but not installed." >&2; exit 1; }
command -v node >/dev/null 2>&1 || { echo "Node.js is required but not installed." >&2; exit 1; }

# Install dependencies
echo "Installing dependencies..."
npm install

# Set up environment variables
if [ ! -f .env.local ]; then
    echo "Creating .env.local from template..."
    cp .env.example .env.local
    echo "Please update .env.local with your configuration"
fi

# Start database and Redis
echo "Starting local services..."
docker-compose up -d postgres redis

# Wait for database to be ready
echo "Waiting for database to be ready..."
sleep 10

# Run database migrations
echo "Running database migrations..."
npm run db:migrate

# Seed development data
echo "Seeding development data..."
npm run db:seed

echo "Setup complete! You can now run:"
echo "  npm run dev:web    # Start frontend development server"
echo "  npm run dev:api    # Start backend development server"
```

### Deployment Scripts

```bash
#!/bin/bash
# scripts/deploy.sh

set -e

ENVIRONMENT=${1:-staging}
IMAGE_TAG=${2:-latest}

echo "Deploying to $ENVIRONMENT with image tag $IMAGE_TAG"

# Validate environment
if [[ "$ENVIRONMENT" != "staging" && "$ENVIRONMENT" != "production" ]]; then
    echo "Error: Environment must be 'staging' or 'production'"
    exit 1
fi

# Build and push images
echo "Building and pushing Docker images..."
./scripts/build-and-push.sh $IMAGE_TAG

# Deploy infrastructure
echo "Deploying infrastructure..."
cd infrastructure
terraform init
terraform plan -var-file="${ENVIRONMENT}.tfvars" -var="image_tag=${IMAGE_TAG}"
terraform apply -auto-approve -var-file="${ENVIRONMENT}.tfvars" -var="image_tag=${IMAGE_TAG}"
cd ..

# Run database migrations
echo "Running database migrations..."
./scripts/run-migrations.sh $ENVIRONMENT

# Update ECS services
echo "Updating ECS services..."
aws ecs update-service \
    --cluster "critical-ai-surveys-${ENVIRONMENT}" \
    --service "critical-ai-surveys-web-${ENVIRONMENT}" \
    --force-new-deployment

aws ecs update-service \
    --cluster "critical-ai-surveys-${ENVIRONMENT}" \
    --service "critical-ai-surveys-api-${ENVIRONMENT}" \
    --force-new-deployment

# Wait for deployment to complete
echo "Waiting for deployment to complete..."
aws ecs wait services-stable \
    --cluster "critical-ai-surveys-${ENVIRONMENT}" \
    --services "critical-ai-surveys-web-${ENVIRONMENT}" "critical-ai-surveys-api-${ENVIRONMENT}"

# Run smoke tests
echo "Running smoke tests..."
./scripts/smoke-tests.sh $ENVIRONMENT

echo "Deployment completed successfully!"
```

This comprehensive deployment guide provides a production-ready infrastructure setup with proper security, monitoring, backup, and scaling capabilities. The infrastructure is designed to be cost-effective for staging environments while providing enterprise-grade reliability for production deployments.