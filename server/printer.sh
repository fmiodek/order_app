#!/bin/bash

# WebSocket-Server-URL
WS_URL="http://localhost:3000" # Ersetze dies durch die tatsächliche Adresse deines Socket.IO-Servers

# Bash-Skript, um Socket.IO-Daten zu empfangen
socket.io-client -h $WS_URL -c "nachricht-an-bash" -l | while read -r message; do
  echo "Nachricht von Socket.IO empfangen: $message"

  # Schreibe die Nachricht in eine Datei
  echo "$message" >> ausgabedatei.txt

  # Führe hier weitere Aktionen basierend auf der erhaltenen Nachricht aus
  # Beispiel: eval "$message"
done
