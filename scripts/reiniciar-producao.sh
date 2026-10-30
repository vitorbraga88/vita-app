#!/usr/bin/env bash
# Restarts the VITA production server on :3900 with the production Node, detached from the
# calling terminal (setsid + nohup). See DEPLOY.md. Usage: scripts/reiniciar-producao.sh
set -euo pipefail

cd "$(dirname "$0")/.."
export PATH=/usr/local/bin:$PATH
hash -r
PORTA_HEX=$(printf '%04X' 3900)

# The container has no ss/lsof: map the LISTEN socket inode to its process via /proc.
inodes=$(awk -v p=":$PORTA_HEX" '$2 ~ p"$" && $4 == "0A" {print $10}' /proc/net/tcp /proc/net/tcp6)
for inode in $inodes; do
  for fd in /proc/[0-9]*/fd/*; do
    if [ "$(readlink "$fd" 2>/dev/null)" = "socket:[$inode]" ]; then
      pid=${fd#/proc/}; pid=${pid%%/*}
      pgid=$(ps -o pgid= -p "$pid" | tr -d ' ')
      echo "parando grupo $pgid (pid $pid na porta 3900)"
      kill -TERM -- "-$pgid" 2>/dev/null || kill -TERM "$pid"
    fi
  done
done

for _ in $(seq 1 50); do
  awk -v p=":$PORTA_HEX" '$2 ~ p"$" && $4 == "0A" {f=1} END {exit !f}' /proc/net/tcp /proc/net/tcp6 || break
  sleep 0.2
done

node scripts/verificar-runtime.mjs
setsid nohup npm run start > /tmp/prod-server.log 2>&1 < /dev/null &

for _ in $(seq 1 50); do
  codigo=$(curl -s -o /dev/null -w '%{http_code}' http://localhost:3900/exercicios || true)
  [ "$codigo" = "200" ] && { echo "produção no ar: /exercicios → $codigo"; exit 0; }
  sleep 0.2
done
echo "produção NÃO respondeu 200 em /exercicios (último código: $codigo); ver /tmp/prod-server.log" >&2
exit 1
