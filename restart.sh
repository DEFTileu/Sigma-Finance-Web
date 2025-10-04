#!/bin/bash
# Скрипт для очистки кэша и перезапуска проекта

echo "Clearing Expo and Metro cache..."
npx expo start --clear

echo "If that doesn't work, try:"
echo "1. Close all terminals"
echo "2. Delete node_modules folder"
echo "3. Run: npm install"
echo "4. Run: npx expo start --clear"
