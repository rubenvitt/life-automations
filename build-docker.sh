docker buildx create --use --platform=linux/arm64,linux/amd64 --name multi-platform-builder
docker buildx inspect --bootstrap
docker buildx build --push --platform linux/amd64,linux/arm64 --tag ghcr.io/rubenvitt/life-automations .