#!/usr/bin/env bash
# 東望洋 · Guia Circuit — 一键同步到 VPS
#
# 用法：
#   ./deploy/deploy.sh root@1.2.3.4
#   ./deploy/deploy.sh deploy@guia.example.com
#
# 可选环境变量：
#   REMOTE_DIR  远端站点目录（默认 /var/www/guia）
#   SSH_PORT    SSH 端口（默认 22）
#
# 前置：本机有 rsync、能免密（或交互输入密码）SSH 登录目标机。
#
# 首次部署前，在 VPS 上先建好目录：
#   sudo mkdir -p /var/www/guia && sudo chown -R "$USER" /var/www/guia

set -euo pipefail

TARGET="${1:-}"
if [ -z "$TARGET" ]; then
  echo "用法: $0 user@host"
  echo "示例: $0 root@1.2.3.4"
  exit 1
fi

REMOTE_DIR="${REMOTE_DIR:-/var/www/guia}"
SSH_PORT="${SSH_PORT:-22}"
SRC_DIR="$(cd "$(dirname "$0")/.." && pwd)"

echo "→ 源目录: $SRC_DIR"
echo "→ 目标:   $TARGET:$REMOTE_DIR (port $SSH_PORT)"

# 只同步站点本身，排除部署脚本、版本库和系统垃圾
rsync -avz --delete \
  -e "ssh -p $SSH_PORT" \
  --exclude='.git/' \
  --exclude='deploy/' \
  --exclude='.DS_Store' \
  --exclude='*.log' \
  "$SRC_DIR/" "$TARGET:$REMOTE_DIR/"

# 修正权限，确保 nginx(www-data) 能读
ssh -p "$SSH_PORT" "$TARGET" \
  "chmod -R a+rX '$REMOTE_DIR' && echo '✔ 权限已修正'"

echo "✔ 同步完成：$TARGET:$REMOTE_DIR"
echo "  如果 nginx 已配好，刷新页面即可看到更新。"
