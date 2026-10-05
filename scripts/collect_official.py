"""Collect official RSS metadata; never synthesize prices or impact scores."""
import argparse
import hashlib
import json
import time
import urllib.request
import xml.etree.ElementTree as ET
from datetime import datetime, timezone
from email.utils import parsedate_to_datetime
from pathlib import Path
from urllib.parse import urlparse
from zoneinfo import ZoneInfo

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / 'public/data/official-feed.json'
FEEDS = [
    ('fed-press', 'Federal Reserve', 'https://www.federalreserve.gov/feeds/press_all.xml'),
    ('fed-speeches', 'Federal Reserve', 'https://www.federalreserve.gov/feeds/speeches.xml'),
    ('bls-employment', 'BLS', 'https://www.bls.gov/feed/empsit.rss'),
    ('bls-cpi', 'BLS', 'https://www.bls.gov/feed/cpi.rss'),
    ('bls-ppi', 'BLS', 'https://www.bls.gov/feed/ppi.rss'),
]

def parse_feed(raw, feed_id, agency, fetched_at):
    root = ET.fromstring(raw)
    if root.tag != 'rss' or root.find('channel') is None:
        raise ValueError('Expected an RSS channel')
    records = []
    for item in root.findall('./channel/item'):
        title, url, published = (item.findtext(k, '').strip() for k in ('title', 'link', 'pubDate'))
        host = urlparse(url).hostname
        if not title or not published or urlparse(url).scheme != 'https' or host not in {'www.federalreserve.gov', 'www.bls.gov'}:
            continue
        stamp = parsedate_to_datetime(published)
        if stamp.tzinfo is None:
            raise ValueError('Publication timestamp lacks timezone')
        records.append({'id': hashlib.sha256(url.encode()).hexdigest()[:20], 'feed': feed_id,
                        'agency': agency, 'title': title, 'url': url,
                        'publishedAt': stamp.astimezone(timezone.utc).isoformat(),
                        'date': stamp.astimezone(ZoneInfo('America/New_York')).date().isoformat(),
                        'fetchedAt': fetched_at, 'analysisStatus': 'unreviewed'})
    if not records:
        raise ValueError('RSS contains no valid dated official records')
    return records

def fetch(url):
    for attempt in range(3):
        try:
            request = urllib.request.Request(url, headers={'User-Agent': '1D1P official-feed reader', 'Accept': 'application/rss+xml, text/xml'})
            with urllib.request.urlopen(request, timeout=25) as response:
                return response.read(2_000_001)
        except Exception:
            if attempt == 2:
                raise
            time.sleep(2 ** attempt)

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--scheduled', action='store_true')
    args = parser.parse_args()
    now = datetime.now(timezone.utc)
    eastern = now.astimezone(ZoneInfo('America/New_York'))
    old = json.loads(OUTPUT.read_text()) if OUTPUT.exists() else {'events': [], 'feeds': []}
    slot = None
    if args.scheduled:
        # Pre-market slot waits until 09:31 ET so SIP data (15-minute delay) covers the 09:15 cutoff.
        if eastern.weekday() > 4 or (eastern.hour, eastern.minute) < (9, 31):
            return
        slot = f'{eastern.date()}-{17 if eastern.hour >= 17 else 9}'
        if old.get('scheduledSlot') == slot:
            return
    events = {event['id']: event for event in old['events']}
    old_feeds = {feed['id']: feed for feed in old['feeds']}
    statuses = []
    successes = 0
    for feed_id, agency, url in FEEDS:
        status = {'id': feed_id, 'agency': agency, 'url': url, 'attemptedAt': now.isoformat()}
        try:
            raw = fetch(url)
            if len(raw) > 2_000_000:
                raise ValueError('Feed exceeds size limit')
            incoming = parse_feed(raw, feed_id, agency, now.isoformat())
            for event in incoming:
                previous = events.get(event['id'])
                if previous:
                    event['firstSeenAt'] = previous.get('firstSeenAt', previous['fetchedAt'])
                else:
                    event['firstSeenAt'] = now.isoformat()
                events[event['id']] = event
            status.update(status='ok', lastSuccessAt=now.isoformat(), count=len(incoming))
            successes += 1
        except Exception as error:
            status.update(status='error', error=str(error)[:200], lastSuccessAt=old_feeds.get(feed_id, {}).get('lastSuccessAt'))
        statuses.append(status)
        print(feed_id, status['status'])
    data = {'collectedAt': now.isoformat(), 'timezone': 'America/New_York', 'feeds': statuses,
            'scheduledSlot': slot or old.get('scheduledSlot'),
            'events': sorted(events.values(), key=lambda e: e['publishedAt'], reverse=True)}
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    temporary = OUTPUT.with_suffix('.tmp')
    temporary.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n')
    temporary.replace(OUTPUT)
    if successes < len(FEEDS):
        raise SystemExit('One or more official feeds failed; existing records preserved')

if __name__ == '__main__':
    main()
