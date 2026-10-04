import importlib.util
import unittest
from pathlib import Path

spec = importlib.util.spec_from_file_location('collector', Path(__file__).parents[1] / 'scripts/collect_official.py')
collector = importlib.util.module_from_spec(spec)
spec.loader.exec_module(collector)

def feed(url='https://www.federalreserve.gov/newsevents/test.htm', date='Fri, 02 Oct 2026 01:00:00 GMT'):
    return f'<rss><channel><item><title>Official release</title><link>{url}</link><pubDate>{date}</pubDate></item></channel></rss>'.encode()

class OfficialFeedTests(unittest.TestCase):
    def test_preserves_et_date_instead_of_utc_date(self):
        record = collector.parse_feed(feed(), 'fed', 'Federal Reserve', '2026-10-04')[0]
        self.assertEqual(record['date'], '2026-10-01')
        self.assertEqual(record['analysisStatus'], 'unreviewed')
        self.assertNotIn('score', record)

    def test_invalid_feed_is_not_accepted_as_no_events(self):
        with self.assertRaises(ValueError):
            collector.parse_feed(b'<html>blocked</html>', 'fed', 'Federal Reserve', 'now')

    def test_untrusted_links_are_rejected(self):
        with self.assertRaises(ValueError):
            collector.parse_feed(feed('https://attacker.example/fake'), 'fed', 'Federal Reserve', 'now')

    def test_missing_timezone_is_rejected(self):
        with self.assertRaises(ValueError):
            collector.parse_feed(feed(date='Fri, 02 Oct 2026 01:00:00'), 'fed', 'Federal Reserve', 'now')

if __name__ == '__main__':
    unittest.main()
