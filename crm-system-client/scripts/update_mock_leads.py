import json
import os
import sys

here = os.path.dirname(__file__)
file_path = os.path.abspath(os.path.join(here, '..', 'src', 'data', 'mockLeads.json'))

def main():
    if not os.path.exists(file_path):
        print('mockLeads.json not found at', file_path, file=sys.stderr)
        sys.exit(1)

    raw = open(file_path, 'rb').read()
    # Remove BOM if present
    if raw.startswith(b'\xef\xbb\xbf'):
        raw = raw[3:]
    try:
        data = json.loads(raw.decode('utf-8'))
    except Exception as e:
        print('Failed to parse mockLeads.json:', e, file=sys.stderr)
        sys.exit(1)

    leads = data.get('leads')
    if not isinstance(leads, list):
        print('mockLeads.json: missing leads array', file=sys.stderr)
        sys.exit(1)

    changed = 0
    new_leads = []
    for lead in leads:
        if not isinstance(lead, dict):
            new_leads.append(lead)
            continue
        updated = dict(lead)
        if 'phone' in updated:
            if 'telephone_no' not in updated:
                updated['telephone_no'] = updated.get('phone')
            updated.pop('phone', None)
            changed += 1
        if 'vat_number' not in updated:
            updated['vat_number'] = None
            changed += 1
        new_leads.append(updated)

    if changed == 0:
        print('No changes needed. File already up to date.')
        return

    data['leads'] = new_leads
    with open(file_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
        f.write('\n')
    print(f'Updated mockLeads.json with {changed} field changes.')

if __name__ == '__main__':
    main()

