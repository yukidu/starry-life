"""Release smoke suite: new 3-screen control room, 4-panel report, mobile and desktop."""
from playwright.sync_api import sync_playwright
from pathlib import Path
root=Path(__file__).resolve().parent.parent
html=(root/'繁星生命靈數_離線預覽.html').read_text()
errors=[]
with sync_playwright() as pw:
    browser=pw.chromium.launch(**({'executable_path':'/usr/bin/chromium'} if Path('/usr/bin/chromium').is_file() else {}),headless=True,args=['--no-sandbox'])
    for viewport in [{'width':375,'height':812},{'width':390,'height':844},{'width':768,'height':1024},{'width':1280,'height':900}]:
        page=browser.new_page(viewport=viewport,accept_downloads=True)
        page.on('pageerror',lambda e:errors.append(str(e)))
        page.set_content(html,wait_until='load')
        assert '繁星生命靈數' in page.title()
        assert page.locator('[data-screen="atlas"]').is_visible()
        assert not page.locator('[data-screen="bond"]').is_visible()
        assert not page.locator('[data-screen="codex"]').is_visible()
        assert page.locator('.signal-graphic').is_visible()
        page.locator('#birthdate').fill('1985-07-03')
        page.locator('#calc-form button[type="submit"]').click()
        assert page.locator('.life-number').inner_text().startswith('6')
        assert '33' in page.locator('.master-note').inner_text()
        assert '巨蟹座' in page.locator('.report-totals').inner_text()
        assert page.locator('#result').is_visible()
        # DOM row-major ordering and exact concentric ring arithmetic.
        assert page.locator('.number-cell').evaluate_all('(nodes)=>nodes.map(n=>n.dataset.number)')==['1','4','7','2','5','8','3','6','9']
        assert page.locator('[data-number="3"] circle.orbit-ring').count()==6
        assert page.locator('[data-number="1"] circle.orbit-ring').count()==1
        assert page.locator('[data-number="2"] circle.orbit-ring').count()==0
        assert page.locator('[data-number="3"] .orbit-digit').inner_text()=='3'
        radii=page.locator('[data-number="3"] circle.orbit-ring').evaluate_all('(rings)=>rings.map(r=>Number(r.getAttribute("r")))')
        assert radii==sorted(set(radii))
        page.locator('[data-number="3"]').click()
        assert '天賦數 4 次' in page.locator('#number-note').inner_text()
        page.locator('[data-number="4"]').click()
        assert '星座數 1 次' in page.locator('#number-note').inner_text()
        # Real report tabs, only one section visible per choice.
        page.locator('[data-panel="colors"]').click()
        assert page.locator('[data-report-pane="colors"]').is_visible()
        assert not page.locator('[data-report-pane="rings"]').is_visible()
        assert page.locator('.color-swatch').count()==9
        assert len(set(page.locator('.color-swatch').evaluate_all('(nodes)=>nodes.map(n=>getComputedStyle(n).getPropertyValue("--orbit-color"))')))==9
        assert page.locator('.color-swatch .orbit-ring').count()==27
        page.locator('[data-panel="paths"]').click()
        assert page.locator('[data-line].available').count()==8
        page.locator('[data-line="4-8"]').click()
        assert '已形成' in page.locator('#line-note').inner_text()
        page.locator('[data-panel="insights"]').click()
        assert page.locator('.insight-grid .glass-tile').count()==6
        page.locator('[data-panel="rings"]').click()
        assert page.locator('.number-cell').first.is_visible()
        with page.expect_download() as d:
            page.locator('#export-report').click()
        download=d.value
        assert download.suggested_filename=='繁星生命靈數-1985-07-03.txt'
        report=Path(download.path()).read_text()
        assert '特殊數：33' in report and '九宮出現次數：1:1、2:0、3:6' in report
        # Audio defaults muted, is optionally enabled, and works on mobile and desktop.
        toggle=page.locator('#sound-toggle-mobile' if viewport['width']<=720 else '#sound-toggle')
        assert toggle.get_attribute('aria-pressed')=='false'
        toggle.click()
        assert toggle.get_attribute('aria-pressed')=='true'
        toggle.click()
        assert toggle.get_attribute('aria-pressed')=='false'
        # Actually swap entire workspace screens.
        use_dock=viewport['width']<=720
        loc='.dock-tab' if use_dock else '.nav-tab'
        page.locator(f'{loc}[data-view="bond"]').click()
        assert page.locator('[data-screen="bond"]').is_visible()
        assert not page.locator('[data-screen="atlas"]').is_visible()
        page.locator('#pair-a').fill('1985-07-03')
        page.locator('#pair-b').fill('1973-04-05')
        page.locator('#pair-form button[type="submit"]').click()
        assert page.locator('.pair-results').is_visible()
        assert '特殊數 11' in page.locator('.pair-results').inner_text()
        page.locator(f'{loc}[data-view="codex"]').click()
        assert page.locator('[data-screen="codex"]').is_visible()
        assert page.locator('.guide-grid .glass-tile').count()==4
        page.locator('.sources summary').click()
        assert page.locator('.sources-body').is_visible()
        page.locator(f'{loc}[data-view="atlas"]').click()
        assert page.locator('#result').is_visible()
        assert page.locator('.life-number').inner_text().startswith('6')
        assert not page.evaluate('document.documentElement.scrollWidth > window.innerWidth'), f'overflow {viewport}'
        page.screenshot(path=str(root/f'starry-life-v14-{viewport["width"]}.png'),full_page=True,animations='disabled')
        print('PASS control room interactive viewport',viewport)
        page.close()
    browser.close()
assert not errors,errors
print('PASS no JS runtime errors')
