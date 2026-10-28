import os
import subprocess
from PIL import Image

# 1. Definisi SVG Icon murni dan presisi
SVG_CONTENT = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none">
  <defs>
    <!-- Gradien Heksagon Luar Vibrant -->
    <linearGradient id="hexGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#38bdf8" />
      <stop offset="45%" stop-color="#6366f1" />
      <stop offset="100%" stop-color="#8b5cf6" />
    </linearGradient>

    <!-- Gradien Shading Dimensi 3D Dalam -->
    <linearGradient id="innerShade" x1="0%" y1="100%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#1e1b4b" />
      <stop offset="50%" stop-color="#1e184a" />
      <stop offset="100%" stop-color="#2e2b69" />
    </linearGradient>

    <!-- Filter Glow Lembut untuk Garis Analytics -->
    <filter id="whiteGlow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="1" stdDeviation="1" flood-color="#ffffff" flood-opacity="0.8" />
    </filter>
  </defs>

  <!-- Frame Heksagon Luar -->
  <path
    d="M50 4 L92 27 L92 73 L50 96 L8 73 L8 27 Z"
    fill="url(#hexGrad)"
    stroke="#818cf8"
    stroke-width="2.5"
    stroke-linejoin="round"
  />

  <!-- Dinding Dalam / Efek Dimensi 3D -->
  <path
    d="M50 14 L82 32 L82 68 L50 86 L18 68 L18 32 Z"
    fill="url(#innerShade)"
    stroke="#4338ca"
    stroke-width="1.2"
    opacity="0.95"
  />

  <!-- Garis Git Branch & Node -->
  <path
    d="M32 68 V45 C32 38 42 34 52 34 H68"
    stroke="#60a5fa"
    stroke-width="4.5"
    stroke-linecap="round"
  />
  <path
    d="M52 34 V52"
    stroke="#60a5fa"
    stroke-width="4"
    stroke-linecap="round"
  />

  <!-- Panah Branch -->
  <path
    d="M64 28 L72 34 L64 40"
    stroke="#60a5fa"
    stroke-width="4"
    stroke-linecap="round"
    stroke-linejoin="round"
  />

  <!-- Node Lingkaran Git -->
  <circle cx="32" cy="58" r="4.5" fill="#ffffff" stroke="#2563eb" stroke-width="2.5" />
  <circle cx="52" cy="52" r="4" fill="#ffffff" stroke="#2563eb" stroke-width="2.5" />

  <!-- Grafik Analytics Naik -->
  <path
    d="M28 66 L42 56 L52 62 L66 44"
    stroke="#ffffff"
    stroke-width="4.5"
    stroke-linecap="round"
    stroke-linejoin="round"
    filter="url(#whiteGlow)"
  />
  <path
    d="M60 44 H66 V50"
    stroke="#ffffff"
    stroke-width="4.5"
    stroke-linecap="round"
    stroke-linejoin="round"
    filter="url(#whiteGlow)"
  />

  <!-- Indikator Real-time Pulse -->
  <circle
    cx="68"
    cy="68"
    r="10"
    stroke="#38bdf8"
    stroke-width="2.5"
    stroke-dasharray="4 3"
    opacity="0.85"
  />
  <circle cx="68" cy="68" r="5" fill="#38bdf8" />
</svg>
"""

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
APP_DIR = os.path.join(PROJECT_ROOT, "src", "app")
PUBLIC_DIR = os.path.join(PROJECT_ROOT, "public")

print(f"Project root: {PROJECT_ROOT}")

# Simpan SVG files
icon_svg_app = os.path.join(APP_DIR, "icon.svg")
logo_svg_public = os.path.join(PUBLIC_DIR, "logo.svg")
icon_svg_public = os.path.join(PUBLIC_DIR, "icon.svg")

for path in [icon_svg_app, logo_svg_public, icon_svg_public]:
    with open(path, "w", encoding="utf-8") as f:
        f.write(SVG_CONTENT.strip())
    print(f"Written: {path}")

# Siapkan HTML untuk rendering resolusi tinggi 1024x1024 dengan latar belakang transparan
html_render = f"""<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  html, body {{
    margin: 0;
    padding: 0;
    width: 1024px;
    height: 1024px;
    background: transparent;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
  }}
  svg {{
    width: 960px;
    height: 960px;
  }}
</style>
</head>
<body>
{SVG_CONTENT.strip()}
</body>
</html>
"""

temp_html = os.path.join(PROJECT_ROOT, "temp_icon_render.html")
temp_png_1024 = os.path.join(PROJECT_ROOT, "temp_icon_1024.png")

with open(temp_html, "w", encoding="utf-8") as f:
    f.write(html_render)

chrome_paths = [
    r"C:\Program Files\Google\Chrome\Application\chrome.exe",
    r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
    r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
    r"C:\Program Files\Microsoft\Edge\Application\msedge.exe",
]

browser_bin = None
for p in chrome_paths:
    if os.path.exists(p):
        browser_bin = p
        break

if not browser_bin:
    raise RuntimeError("No Chromium/Chrome/Edge browser found for high-res rendering.")

print(f"Using browser: {browser_bin}")

cmd = [
    browser_bin,
    "--headless=new",
    "--default-background-color=00000000",
    "--window-size=1024,1024",
    f"--screenshot={temp_png_1024}",
    f"file:///{temp_html.replace(os.sep, '/')}"
]

res = subprocess.run(cmd, capture_output=True, text=True)
if not os.path.exists(temp_png_1024):
    raise RuntimeError(f"Failed to render 1024px image: {res.stderr}")

print("Master 1024x1024 PNG rendered successfully.")

# Load dengan PIL
master_img = Image.open(temp_png_1024).convert("RGBA")

# 1. Generate icon.png (512x512)
icon_512 = master_img.resize((512, 512), Image.Resampling.LANCZOS)
icon_512_public = os.path.join(PUBLIC_DIR, "icon.png")
icon_512_app = os.path.join(APP_DIR, "icon.png")
icon_512.save(icon_512_public, format="PNG")
icon_512.save(icon_512_app, format="PNG")
print(f"Saved: {icon_512_public} and {icon_512_app}")

# 2. Generate apple-icon.png (180x180)
# Untuk Apple touch icon, Apple merekomendasikan rounded corner atau latar belakang kontras/dark
# Mari kita buat versi dengan sedikit padding di background transparan/dark yang rapi
apple_img = master_img.resize((180, 180), Image.Resampling.LANCZOS)
apple_app = os.path.join(APP_DIR, "apple-icon.png")
apple_public = os.path.join(PUBLIC_DIR, "apple-icon.png")
apple_img.save(apple_app, format="PNG")
apple_img.save(apple_public, format="PNG")
print(f"Saved: {apple_app} and {apple_public}")

# 3. Generate multi-resolution favicon.ico
favicon_ico_app = os.path.join(APP_DIR, "favicon.ico")
favicon_ico_public = os.path.join(PUBLIC_DIR, "favicon.ico")

ico_sizes = [(16, 16), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)]
master_img.save(favicon_ico_app, format="ICO", sizes=ico_sizes)
master_img.save(favicon_ico_public, format="ICO", sizes=ico_sizes)
print(f"Saved: {favicon_ico_app} and {favicon_ico_public}")

# Bersihkan temporary files
if os.path.exists(temp_html):
    os.remove(temp_html)
if os.path.exists(temp_png_1024):
    os.remove(temp_png_1024)

print("Icons generated successfully!")

