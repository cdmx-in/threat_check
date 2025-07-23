#!/bin/sh
set -e

echo "Starting freshclam to update ClamAV signatures..."
freshclam

echo "Starting clamd (ClamAV daemon)..."
clamd

# Keep container running
while true; do sleep 60; done
