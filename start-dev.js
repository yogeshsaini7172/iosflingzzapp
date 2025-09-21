#!/usr/bin/env node

// Simple script to start both socket server and vite dev server
import { spawn } from 'child_process';
import process from 'process';

console.log('🚀 Starting development servers...\n');

// Start socket server
const socketServer = spawn('node', ['socket-server.js'], {
  cwd: process.cwd(),
  stdio: 'pipe',
  shell: true
});

// Start vite dev server
const viteServer = spawn('npx', ['vite'], {
  cwd: process.cwd(),
  stdio: 'pipe',
  shell: true
});

// Handle socket server output
socketServer.stdout.on('data', (data) => {
  console.log(`\x1b[34m[SOCKET]\x1b[0m ${data.toString().trim()}`);
});

socketServer.stderr.on('data', (data) => {
  console.error(`\x1b[34m[SOCKET ERROR]\x1b[0m ${data.toString().trim()}`);
});

// Handle vite server output
viteServer.stdout.on('data', (data) => {
  console.log(`\x1b[32m[VITE]\x1b[0m ${data.toString().trim()}`);
});

viteServer.stderr.on('data', (data) => {
  console.error(`\x1b[32m[VITE ERROR]\x1b[0m ${data.toString().trim()}`);
});

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n\n🛑 Shutting down servers...');
  socketServer.kill('SIGINT');
  viteServer.kill('SIGINT');
  process.exit(0);
});

process.on('SIGTERM', () => {
  socketServer.kill('SIGTERM');
  viteServer.kill('SIGTERM');
  process.exit(0);
});

socketServer.on('close', (code) => {
  console.log(`\x1b[34m[SOCKET]\x1b[0m Server exited with code ${code}`);
});

viteServer.on('close', (code) => {
  console.log(`\x1b[32m[VITE]\x1b[0m Server exited with code ${code}`);
});
