//! Gateway bootstrap for sdkwork-dezhou.

use axum::Router;
use sdkwork_database_sqlx::DatabasePool;
use sdkwork_dezhou_service_host::DezhouServiceHost;
use sdkwork_web_bootstrap::{ApiAssemblyContribution, HttpRouteManifest, PgPoolReadinessCheck, ReadinessCheck, WebModule};
use std::sync::Arc;

pub type ApiAssembly = ApiAssemblyContribution;

pub async fn assemble_api_router() -> Result<ApiAssembly, String> {
    assemble_api_router_with_host(DezhouServiceHost::from_env().await?).await
}

pub async fn assemble_api_router_with_pool(pool: DatabasePool) -> Result<ApiAssembly, String> {
    assemble_api_router_with_host(DezhouServiceHost::from_pool(pool).await?).await
}

async fn assemble_api_router_with_host(host: DezhouServiceHost) -> Result<ApiAssembly, String> {
    let readiness_pool = host
        .database_pool()
        .as_postgres()
        .ok_or_else(|| "dezhou authoritative server requires a PostgreSQL pool".to_owned())?
        .clone();
    assemble_api_router_with_service(
        host.service(),
        Arc::new(PgPoolReadinessCheck::new(readiness_pool)),
    )
    .await
}

pub async fn assemble_api_router_with_service(
    service: sdkwork_dezhou_service_host::SharedTableService,
    readiness_check: Arc<dyn ReadinessCheck>,
) -> Result<ApiAssembly, String> {
    let router = Router::new()
        .merge(sdkwork_routes_table_app_api::gateway_mount(service.clone()).await)
        .merge(sdkwork_routes_table_backend_api::gateway_mount(service).await);
    let mut routes = Vec::new();
    routes.extend_from_slice(sdkwork_routes_table_app_api::gateway_route_manifest().routes());
    routes.extend_from_slice(sdkwork_routes_table_backend_api::gateway_route_manifest().routes());
    ApiAssemblyContribution::from_manifest(
        "sdkwork-dezhou",
        "SDKWork Dezhou API",
        router,
        HttpRouteManifest::from_owned_routes(routes),
        Vec::new(),
        readiness_check,
    )
}

pub async fn assemble_business_routes() -> Result<ApiAssembly, String> {
    assemble_api_router().await
}

/// Canonical Web Module definition for this application
/// (API_ASSEMBLY_SPEC §4.1.1): the complete HTTP surface — every route,
/// manifest, and OpenAPI document of this owner — as one installable module.
pub async fn web_module() -> Result<WebModule, String> {
    Ok(WebModule::from_contribution(assemble_api_router().await?))
}

/// Same as [`web_module`] but composed on a process-shared database pool
/// (platform gateways, API_ASSEMBLY_SPEC §4.1.1).
pub async fn web_module_with_pool(pool: DatabasePool) -> Result<WebModule, String> {
    Ok(WebModule::from_contribution(assemble_api_router_with_pool(pool).await?))
}
