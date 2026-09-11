FROM rust:1-bookworm AS builder
WORKDIR /src
COPY . .
RUN cargo build --release -p sdkwork-api-dezhou-standalone-gateway

FROM debian:bookworm-slim
RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY --from=builder /src/target/release/sdkwork-api-dezhou-standalone-gateway /usr/local/bin/sdkwork-api-dezhou-standalone-gateway
ENV SDKWORK_DEZHOU_APPLICATION_PUBLIC_INGRESS_BIND=0.0.0.0:8096
ENV DEZHOU_API_BIND=0.0.0.0:8096
EXPOSE 8096
CMD ["sdkwork-api-dezhou-standalone-gateway"]
