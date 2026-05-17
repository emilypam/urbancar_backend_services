#!/bin/bash
set -e

# ── Configuración ─────────────────────────────────────────────────────────────
RESOURCE_GROUP="urbancar-rg"
LOCATION="eastus2"
ACR_NAME="urbancarregistry"
ENVIRONMENT_NAME="urbancar-env"

# Carga las variables del .env
source .env

echo ""
echo "╔══════════════════════════════════════════╗"
echo "║   UrbanCar — Deploy en Azure Container   ║"
echo "╚══════════════════════════════════════════╝"
echo ""

# ── PASO 1: Azure Container Registry ─────────────────────────────────────────
echo "▶ [1/5] Creando Azure Container Registry..."
az acr create \
  --resource-group $RESOURCE_GROUP \
  --name $ACR_NAME \
  --sku Basic \
  --admin-enabled true \
  --output none

ACR_SERVER=$(az acr show --name $ACR_NAME --query loginServer --output tsv)
ACR_PASSWORD=$(az acr credential show --name $ACR_NAME --query "passwords[0].value" --output tsv)
echo "    ACR: $ACR_SERVER ✓"

# ── PASO 2: Build de imágenes localmente y push a ACR ────────────────────────
echo ""
echo "▶ [2/5] Construyendo imágenes Docker localmente y subiendo a ACR..."
echo "    (requiere Docker Desktop corriendo)"

az acr login --name $ACR_NAME

build_and_push() {
  local IMAGE=$1
  local CONTEXT=$2
  local DOCKERFILE=${3:-"$CONTEXT/Dockerfile"}
  docker build -t $ACR_SERVER/$IMAGE -f $DOCKERFILE $CONTEXT
  docker push $ACR_SERVER/$IMAGE
  echo "    $IMAGE ✓"
}

build_and_push auth-service:latest          ./services/auth-service
build_and_push inventario-service:latest    ./services/inventario-service
build_and_push org-service:latest           ./services/org-service
build_and_push operaciones-service:latest   ./services/operaciones-service
build_and_push financiero-service:latest    ./services/financiero-service
build_and_push mantenimiento-service:latest ./services/mantenimiento-service
build_and_push bus-service:latest           ./services/bus-service
build_and_push nginx-frontend:latest        . ./Dockerfile.nginx.containerapp
echo "    nginx-frontend ✓"

# ── PASO 3: Container Apps Environment ───────────────────────────────────────
echo ""
echo "▶ [3/5] Creando Container Apps Environment..."
az containerapp env create \
  --name $ENVIRONMENT_NAME \
  --resource-group $RESOURCE_GROUP \
  --location $LOCATION \
  --output none
echo "    Environment '$ENVIRONMENT_NAME' ✓"

# ── PASO 4: Deploy de microservicios (ingress interno) ───────────────────────
echo ""
echo "▶ [4/5] Desplegando microservicios..."

deploy_service() {
  local NAME=$1
  local IMAGE=$2
  local PORT=$3
  shift 3
  local ENVVARS=("$@")

  az containerapp create \
    --name $NAME \
    --resource-group $RESOURCE_GROUP \
    --environment $ENVIRONMENT_NAME \
    --image $ACR_SERVER/$IMAGE \
    --registry-server $ACR_SERVER \
    --registry-username $ACR_NAME \
    --registry-password $ACR_PASSWORD \
    --ingress internal \
    --target-port $PORT \
    --min-replicas 0 \
    --max-replicas 2 \
    --env-vars "${ENVVARS[@]}" \
    --output none
  echo "    $NAME ✓"
}

deploy_service auth-service auth-service:latest 3001 \
  "DATABASE_URL=$AUTH_DATABASE_URL" \
  "DIRECT_URL=$AUTH_DIRECT_URL" \
  "JWT_SECRET=$JWT_SECRET" \
  "JWT_EXPIRES_IN=${JWT_EXPIRES_IN:-7d}" \
  "PORT=3001" \
  "NODE_ENV=production" \
  "CORS_ORIGIN=*"

deploy_service inventario-service inventario-service:latest 3002 \
  "DATABASE_URL=$INVENTARIO_DATABASE_URL" \
  "DIRECT_URL=$INVENTARIO_DIRECT_URL" \
  "JWT_SECRET=$JWT_SECRET" \
  "PORT=3002" \
  "NODE_ENV=production" \
  "CORS_ORIGIN=*"

deploy_service org-service org-service:latest 3003 \
  "DATABASE_URL=$ORG_DATABASE_URL" \
  "DIRECT_URL=$ORG_DIRECT_URL" \
  "JWT_SECRET=$JWT_SECRET" \
  "PORT=3003" \
  "NODE_ENV=production" \
  "CORS_ORIGIN=*"

deploy_service operaciones-service operaciones-service:latest 3004 \
  "DATABASE_URL=$OPERACIONES_DATABASE_URL" \
  "DIRECT_URL=$OPERACIONES_DIRECT_URL" \
  "JWT_SECRET=$JWT_SECRET" \
  "PORT=3004" \
  "NODE_ENV=production" \
  "CORS_ORIGIN=*" \
  "INVENTARIO_SERVICE_URL=http://inventario-service"

deploy_service financiero-service financiero-service:latest 3005 \
  "DATABASE_URL=$FINANCIERO_DATABASE_URL" \
  "DIRECT_URL=$FINANCIERO_DIRECT_URL" \
  "JWT_SECRET=$JWT_SECRET" \
  "PORT=3005" \
  "NODE_ENV=production" \
  "CORS_ORIGIN=*"

deploy_service mantenimiento-service mantenimiento-service:latest 3006 \
  "DATABASE_URL=$MANTENIMIENTO_DATABASE_URL" \
  "DIRECT_URL=$MANTENIMIENTO_DIRECT_URL" \
  "JWT_SECRET=$JWT_SECRET" \
  "PORT=3006" \
  "NODE_ENV=production" \
  "CORS_ORIGIN=*"

deploy_service bus-service bus-service:latest 3007 \
  "JWT_SECRET=$JWT_SECRET" \
  "PORT=3007" \
  "NODE_ENV=production" \
  "CORS_ORIGIN=*" \
  "AZURE_SERVICEBUS_CONNECTION_STRING=$AZURE_SERVICEBUS_CONNECTION_STRING" \
  "AZURE_SERVICEBUS_TOPIC=${AZURE_SERVICEBUS_TOPIC:-urbancar-eventos}" \
  "OPERACIONES_SERVICE_URL=http://operaciones-service" \
  "INVENTARIO_SERVICE_URL=http://inventario-service" \
  "FINANCIERO_SERVICE_URL=http://financiero-service"

# ── PASO 5: Deploy nginx + frontend (ingress externo) ────────────────────────
echo ""
echo "▶ [5/5] Desplegando frontend + API Gateway (Nginx)..."

APP_URL=$(az containerapp create \
  --name nginx-frontend \
  --resource-group $RESOURCE_GROUP \
  --environment $ENVIRONMENT_NAME \
  --image $ACR_SERVER/nginx-frontend:latest \
  --registry-server $ACR_SERVER \
  --registry-username $ACR_NAME \
  --registry-password $ACR_PASSWORD \
  --ingress external \
  --target-port 80 \
  --min-replicas 1 \
  --max-replicas 3 \
  --query properties.configuration.ingress.fqdn \
  --output tsv)

echo ""
echo "╔══════════════════════════════════════════════════════════╗"
echo "║   ✓ DEPLOY COMPLETO                                      ║"
echo "╠══════════════════════════════════════════════════════════╣"
echo "║   URL: https://$APP_URL"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""
