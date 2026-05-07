# BADAWIA'S IMPORTS — Asset Setup Guide

## Logo

Your logo has been provided. Save it to these paths (all can use the same PNG file):

| Path | Purpose |
|------|---------|
| `/public/logo.png` | **Required** — header, footer, admin panel, PWA |
| `/public/apple-touch-icon.png` | iOS home screen (180×180px crop of logo on white bg) |
| `/public/favicon.ico` | Browser tab icon (32×32px) |
| `/public/icon-192.png` | PWA Android icon (192×192px) |
| `/public/icon-512.png` | PWA splash screen (512×512px) |
| `/public/og-image.png` | Social share preview — **auto-generated** by `app/opengraph-image.tsx` |

> **Tip:** The OG image is generated dynamically in code (navy/red/cyan branded) so you don't need to create `/public/og-image.png` manually unless you want to override it.

## Quick favicon setup

1. Go to https://realfavicongenerator.net
2. Upload your logo PNG
3. Download the package and copy the files into `/public/`
4. Rename `favicon-32x32.png` → `favicon.ico` (or use the provided `.ico`)

## Brand Colors (already applied in code)

| Token | Hex | Usage |
|-------|-----|-------|
| Primary navy | `#0D1B45` | Text, buttons, header |
| Primary dark | `#060E28` | Footer, hover states |
| Accent red | `#CC1414` | Highlights, swoosh, CTAs |
| Cyan | `#1ABCDF` | Icons, links, badges |
