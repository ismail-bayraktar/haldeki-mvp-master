import json
import os

reports_dir = r'F:\donusum\haldeki-love\haldeki-market\reports'
pages = ['homepage.json', 'products.json', 'admin-variation-types.json']

print('=' * 80)
print(' LIGHTHOUSE PERFORMANCE REPORT - haldeki.com')
print('=' * 80)
print()

for page_file in pages:
    filepath = os.path.join(reports_dir, page_file)
    if not os.path.exists(filepath):
        print(f'[X] {page_file}: Report not found')
        continue

    with open(filepath, 'r', encoding='utf-8') as f:
        data = json.load(f)

    url = data.get('requestedUrl', 'N/A')
    final_url = data.get('finalUrl', 'N/A')

    # Get category scores
    categories = data.get('categories', {})

    perf_score = int(categories.get('performance', {}).get('score', 0) * 100)
    a11y_score = int(categories.get('accessibility', {}).get('score', 0) * 100)
    best_score = int(categories.get('best-practices', {}).get('score', 0) * 100)
    seo_score = int(categories.get('seo', {}).get('score', 0) * 100)

    print(f'## {page_file.replace(".json", "").replace("-", " ").title()}')
    print(f'URL: {final_url}')
    print()
    print('| Category | Score | Status |')
    print('|----------|-------|--------|')

    def get_status(score):
        if score >= 90: return '[PASS] Good'
        elif score >= 50: return '[WARN] Needs Improvement'
        else: return '[FAIL] Poor'

    print(f'| Performance | {perf_score} | {get_status(perf_score)} |')
    print(f'| Accessibility | {a11y_score} | {get_status(a11y_score)} |')
    print(f'| Best Practices | {best_score} | {get_status(best_score)} |')
    print(f'| SEO | {seo_score} | {get_status(seo_score)} |')
    print()

    # Get key metrics
    audits = data.get('audits', {})

    metrics = [
        ('First Contentful Paint (FCP)', 'first-contentful-paint', 1800),
        ('Largest Contentful Paint (LCP)', 'largest-contentful-paint', 2500),
        ('Total Blocking Time (TBT)', 'total-blocking-time', 200),
        ('Cumulative Layout Shift (CLS)', 'cumulative-layout-shift', 0.1),
        ('Speed Index (SI)', 'speed-index', 3387),
        ('Time to Interactive (TTI)', 'interactive', 3800),
    ]

    print('| Metric | Value | Score | Target | Status |')
    print('|--------|-------|-------|--------|--------|')

    for name, key, target in metrics:
        audit = audits.get(key, {})
        value = audit.get('displayValue', 'N/A')
        score = audit.get('score', 0)
        numeric = audit.get('numericValue', 0)

        # Determine status based on target
        if key == 'cumulative-layout-shift':
            status = '[PASS]' if numeric <= target else ('[WARN]' if numeric <= 0.25 else '[FAIL]')
        elif key == 'total-blocking-time':
            status = '[PASS]' if numeric <= target else ('[WARN]' if numeric <= 600 else '[FAIL]')
        else:
            status = '[PASS]' if numeric <= target else '[FAIL]'

        print(f'| {name} | {value} | {int(score*100)} | {target}ms | {status} |')

    print()
    print('-' * 80)
    print()
