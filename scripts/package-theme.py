#!/usr/bin/env python3
import json
import re
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
THEME = ROOT / 'theme'
OUT = ROOT / 'dist' / 'sophie-barlee-shopify-theme.zip'
REQUIRED = [
    'layout/theme.liquid', 'config/settings_schema.json', 'config/settings_data.json',
    'locales/pt-PT.json', 'locales/en.default.json', 'sections/header-group.json', 'sections/footer-group.json',
    'templates/index.json', 'templates/product.json', 'templates/collection.json',
    'templates/search.json', 'templates/cart.json', 'templates/page.json', 'templates/404.json',
]
missing = [path for path in REQUIRED if not (THEME / path).is_file()]
if missing:
    raise SystemExit('Missing required theme files: ' + ', '.join(missing))

json_files = list(THEME.rglob('*.json'))
for path in json_files:
    try:
        json.loads(path.read_text(encoding='utf-8'))
    except Exception as error:
        raise SystemExit(f'Invalid JSON: {path.relative_to(THEME)}: {error}')

section_files = {path.stem for path in (THEME / 'sections').glob('*.liquid')}
snippet_files = {path.stem for path in (THEME / 'snippets').glob('*.liquid')}
for template in (THEME / 'templates').glob('*.json'):
    data = json.loads(template.read_text(encoding='utf-8'))
    for section in data.get('sections', {}).values():
        section_type = section.get('type')
        if section_type and section_type not in section_files:
            raise SystemExit(f'{template.name} refers to missing section {section_type}.liquid')
for group in (THEME / 'sections').glob('*-group.json'):
    data = json.loads(group.read_text(encoding='utf-8'))
    for section in data.get('sections', {}).values():
        section_type = section.get('type')
        if section_type and section_type not in section_files:
            raise SystemExit(f'{group.name} refers to missing section {section_type}.liquid')

def flatten_keys(data, prefix=''):
    keys = set()
    for key, value in data.items():
        full = f'{prefix}.{key}' if prefix else key
        if isinstance(value, dict):
            keys |= flatten_keys(value, full)
        else:
            keys.add(full)
    return keys
locale_files = {
    'pt-PT': THEME / 'locales/pt-PT.json',
    'en.default': THEME / 'locales/en.default.json',
}
locale_keys = {name: flatten_keys(json.loads(path.read_text(encoding='utf-8'))) for name, path in locale_files.items()}
open_to_close = {'if': 'endif', 'unless': 'endunless', 'for': 'endfor', 'case': 'endcase', 'capture': 'endcapture', 'form': 'endform', 'paginate': 'endpaginate', 'schema': 'endschema', 'comment': 'endcomment'}
closing_to_open = {closing: opening for opening, closing in open_to_close.items()}
liquid_files = list(THEME.rglob('*.liquid'))
for path in liquid_files:
    text = path.read_text(encoding='utf-8')
    relative = path.relative_to(THEME).as_posix()
    stack = []
    for tag in re.findall(r'{%\s*(\w+)', text):
        if tag in open_to_close:
            stack.append((tag, open_to_close[tag]))
        elif tag in closing_to_open:
            if not stack or stack[-1][0] != closing_to_open[tag]:
                raise SystemExit(f'Unbalanced Liquid tag {tag} in {relative}')
            stack.pop()
    if stack:
        raise SystemExit(f'Unclosed Liquid tag {stack[-1][0]} in {relative}')

    for match in re.finditer(r'{%\s*schema\s*%}(.*?){%\s*endschema\s*%}', text, re.S):
        try:
            schema = json.loads(match.group(1))
            if not isinstance(schema, dict) or not schema.get('name'):
                raise ValueError('schema must be an object with a name')
        except Exception as error:
            raise SystemExit(f'Invalid Liquid schema in {relative}: {error}')
    if path.parent.name == 'sections' and '{% schema %}' not in text:
        raise SystemExit(f'Missing schema block in section {relative}')

    for snippet in re.findall(r"{%\s*render\s+['\"]([^'\"]+)", text):
        if snippet not in snippet_files:
            raise SystemExit(f'{relative} renders missing snippet {snippet}.liquid')
    for group in re.findall(r"{%\s*sections\s+['\"]([^'\"]+)", text):
        if not (THEME / 'sections' / f'{group}.json').is_file():
            raise SystemExit(f'{relative} references missing section group {group}.json')
    for asset in re.findall(r"['\"]([^'\"]+)['\"]\s*\|\s*asset_url", text):
        if not (THEME / 'assets' / asset).is_file():
            raise SystemExit(f'{relative} references missing asset {asset}')
    for key in re.findall(r"['\"]([\w.-]+(?:\.[\w.-]+)+)['\"]\s*\|\s*t\b", text):
        missing_locales = [name for name, keys in locale_keys.items() if key not in keys]
        if missing_locales:
            raise SystemExit(f'{relative} refers to missing translation key {key} in: {", ".join(missing_locales)}')

OUT.parent.mkdir(parents=True, exist_ok=True)
with zipfile.ZipFile(OUT, 'w', compression=zipfile.ZIP_DEFLATED, compresslevel=8) as archive:
    for path in sorted(THEME.rglob('*')):
        if path.is_file():
            archive.write(path, path.relative_to(THEME).as_posix())
print(f'Validated {len(json_files)} JSON files, {len(liquid_files)} Liquid files and packaged {sum(1 for p in THEME.rglob("*") if p.is_file())} theme files: {OUT}')
