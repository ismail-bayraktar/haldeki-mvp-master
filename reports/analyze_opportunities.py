import json
import os

reports_dir = r'F:\donusum\haldeki-love\haldeki-market\reports'

with open(os.path.join(reports_dir, 'homepage.json'), 'r', encoding='utf-8') as f:
    data = json.load(f)

audits = data.get('audits', {})

print('=' * 80)
print(' PERFORMANCE OPTIMIZATION OPPORTUNITIES')
print('=' * 80)
print()

# Key opportunities that impact performance
opportunities = [
    'render-blocking-resources',
    'unminified-css',
    'unminified-javascript',
    'unused-javascript',
    'unused-css-rules',
    'modern-image-formats',
    'offscreen-images',
    'oversized-images',
    'uses-rel-preconnect',
    'uses-text-compression',
    'efficient-animated-content',
]

print('## Top Opportunities for Improvement')
print()
print('| Priority | Opportunity | Description | Savings |')
print('|----------|-------------|-------------|---------|')

for opp_key in opportunities:
    audit = audits.get(opp_key)
    if not audit or audit.get('score') is None or audit.get('score') == 1:
        continue

    title = audit.get('title', opp_key)
    desc = audit.get('description', '')
    score = audit.get('score', 0)

    # Extract wasted bytes if available
    details = audit.get('details', {})
    wasted_ms = details.get('overallSavingsMs', 0)
    wasted_bytes = details.get('overallSavingsBytes', 0)

    savings = ''
    if wasted_ms:
        savings = f'{wasted_ms:.0f}ms'
    if wasted_bytes:
        savings += f' ({wasted_bytes/1024:.0f}KB)'

    priority = 'HIGH' if score < 0.5 else ('MED' if score < 0.8 else 'LOW')

    print(f'| {priority} | {title} | {desc[:50]}... | {savings} |')

print()
print('=' * 80)
print(' DIAGNOSTICS')
print('=' * 80)
print()

diagnostics = [
    'bootup-time',
    'mainthread-work-breakdown',
    'network-requests',
    'network-rtt',
    'network-server-latency',
    'third-party-summary',
    'largest-contentful-paint-element',
    'cumulative-layout-shift',
    'layout-shift-elements',
    'no-document-write',
]

print('| Diagnostic | Value | Notes |')
print('|------------|-------|-------|')

for diag_key in diagnostics:
    audit = audits.get(diag_key)
    if not audit:
        continue

    title = audit.get('title', diag_key)
    value = audit.get('displayValue', 'N/A')

    print(f'| {title} | {value} | |')

print()
print('=' * 80)
print(' RESOURCE SUMMARY')
print('=' * 80)
print()

audit = audits.get('resource-summary')
if audit:
    details = audit.get('details', {})
    items = details.get('items', [])

    print('| Resource Type | Size | Count |')
    print('|---------------|------|-------|')

    for item in items:
        resource_type = item.get('label', 'Unknown')
        size = item.get('transferSize', 0)
        count = item.get('requestCount', 0)
        size_kb = size / 1024 if size > 0 else 0

        print(f'| {resource_type} | {size_kb:.1f} KB | {count} |')
