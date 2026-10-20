#!/bin/bash
set -euxo pipefail
dnf install -y git tar xz
curl -fsSL https://nodejs.org/dist/v22.22.0/node-v22.22.0-linux-x64.tar.xz -o /tmp/node.tar.xz
tar -xJf /tmp/node.tar.xz -C /usr/local --strip-components=1
git clone --depth 1 https://github.com/walter21rm/medio-curso.git /opt/mostrador
cat > /etc/systemd/system/mostrador.service <<'EOF'
[Unit]
Description=Mostrador
After=network-online.target
Wants=network-online.target

[Service]
Environment=PORT=80
Environment=MOSTRADOR_SEMILLA=1
WorkingDirectory=/opt/mostrador
ExecStart=/usr/local/bin/node src/servidor/main.ts
Restart=on-failure
RestartSec=3

[Install]
WantedBy=multi-user.target
EOF
systemctl daemon-reload
systemctl enable --now mostrador
