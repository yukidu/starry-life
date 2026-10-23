"""Assert unified midnight UI across screens and report panes on four viewport sizes."""
from playwright.sync_api import sync_playwright
from pathlib import Path

root=Path(__file__).resolve().parent.parent
html=(root/'繁星生命靈數_離線預覽.html').read_text()
selectors=['body','.launch-module','.signal-module','.date-input-wrap','.result-console','.report-panels','.ring-stage','.line-chip.available','.color-swatch','.glass-tile','.self-care','.secondary-btn','.pair-panel','.pair-person input','.sources']

with sync_playwright() as p:
    browser=p.chromium.launch(**({'executable_path':'/usr/bin/chromium'} if Path('/usr/bin/chromium').is_file() else {}),headless=True,args=['--no-sandbox'])
    for width,height in [(375,812),(390,844),(768,1024),(1280,900)]:
        page=browser.new_page(viewport={'width':width,'height':height})
        page.set_content(html,wait_until='load')
        assert page.evaluate('getComputedStyle(document.body).colorScheme')=='dark'
        page.locator('#birthdate').fill('1985-07-03')
        page.locator('#calc-form button[type=submit]').click()
        page.locator('[data-panel="paths"]').click()
        assert page.locator('.line-chip.available').count()==8
        page.locator('[data-panel="colors"]').click()
        assert page.locator('.color-swatch').count()==9
        page.locator('[data-panel="insights"]').click()
        assert page.locator('[data-report-pane="insights"] .glass-tile').count()==6
        for selector in selectors[:12]:
            color=page.locator(selector).first.evaluate('(el)=>getComputedStyle(el).backgroundColor')
            assert color.startswith('rgb(') or color.startswith('rgba('),f'{selector}: {color}'
            if color.startswith('rgba('):
                assert float(color.split(',')[-1].strip(' )'))<.4, f'{selector}: unexpected overlay {color}'
            else:
                channels=[int(v.strip()) for v in color[4:-1].split(',')]
                assert max(channels)<115,f'{selector} has an inconsistent light background: {color}'
        nav='.dock-tab' if width<=720 else '.nav-tab'
        page.locator(f'{nav}[data-view="bond"]').click()
        for selector in ['.pair-panel','.pair-person input']:
            color=page.locator(selector).first.evaluate('(el)=>getComputedStyle(el).backgroundColor')
            channels=[int(v.strip()) for v in color[4:-1].split(',')]
            assert max(channels)<115,f'{selector} has an inconsistent light background: {color}'
        page.locator(f'{nav}[data-view="codex"]').click()
        assert page.locator('.sources').is_visible()
        page.locator('.sources summary').click()
        for selector in ['.sources','.glass-tile']:
            color=page.locator(selector).first.evaluate('(el)=>getComputedStyle(el).backgroundColor')
            channels=[int(v.strip()) for v in color[4:-1].split(',')]
            assert max(channels)<115,f'{selector} has an inconsistent light background: {color}'
        gold=page.evaluate('getComputedStyle(document.documentElement).getPropertyValue("--gold").trim()')
        assert gold=='#e9c486'
        assert not page.evaluate('document.documentElement.scrollWidth>innerWidth')
        print('PASS unified theme',width,height)
        page.close()
    browser.close()
