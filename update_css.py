import re

css_file = "c:/Users/Administrator/Documents/classroom/android-app-studio/src/index.css"
html_file = "c:/Users/Administrator/Documents/classroom/dashboard-prototype.html"

with open(css_file, "r", encoding="utf-8") as f:
    css = f.read()

with open(html_file, "r", encoding="utf-8") as f:
    html = f.read()

# Extract the CSS part from HTML
html_css_match = re.search(r'<style>(.*?)</style>', html, re.DOTALL)
html_css = html_css_match.group(1).strip()

# update google fonts import in css
css = re.sub(r'@import url\([^)]+\);', '@import url("https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,500;0,600;1,500;1,600&family=Inter:wght@300;400;500;600;700&display=swap");', css)

# add the ambient-bg, glass-panel, orb, etc to the bottom of index.css
cleaned_html_css = re.sub(r'\* {[^}]+}', '', html_css, flags=re.DOTALL)

with open(css_file, "w", encoding="utf-8") as f:
    f.write(css)
    f.write("\n\n/* === GLASSMORPHISM DASHBOARD OVERRIDES === */\n")
    f.write(cleaned_html_css)

print("CSS appended.")
