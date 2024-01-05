docker buildx create --use --name builder
docker buildx build --push --platform linux/amd64,linux/arm64 --tag ghcr.io/rubenvitt/life-automations .