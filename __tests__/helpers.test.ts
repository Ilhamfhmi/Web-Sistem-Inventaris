// __tests__/helpers.test.ts
// Test untuk fungsi-fungsi helper di SIDOKU

// ── Helper functions (copy dari unit_page.tsx) ────────────────────────────────
function computeStatus(count: number, kebutuhan: number): string {
  if (count <= 0) return 'missing';
  if (count >= kebutuhan) return 'done';
  return 'partial';
}

function getStatusInfo(status: string) {
  if (status === 'done')    return { label: 'Lengkap' };
  if (status === 'partial') return { label: 'Belum Lengkap' };
  return                           { label: 'Kosong' };
}

function getDeadlineInfo(deadline?: string) {
  if (!deadline) return null;
  const diff = Math.ceil((new Date(deadline).getTime() - Date.now()) / 86400000);
  if (diff < 0)  return { label: `Lewat ${Math.abs(diff)} hari`, urgent: true  };
  if (diff <= 3) return { label: `${diff} hari lagi`,            urgent: true  };
  if (diff <= 7) return { label: `${diff} hari lagi`,            urgent: false };
  return               { label: `${diff} hari lagi`,             urgent: false };
}

function catPercent(items: { status: string }[]) {
  if (!items.length) return 0;
  return Math.round((items.filter(i => i.status === 'done').length / items.length) * 100);
}

// ── Test computeStatus ────────────────────────────────────────────────────────
describe('computeStatus', () => {
  it('returns missing jika belum ada file', () => {
    expect(computeStatus(0, 3)).toBe('missing');
  });
  it('returns partial jika baru sebagian', () => {
    expect(computeStatus(1, 3)).toBe('partial');
  });
  it('returns partial jika 2 dari 3', () => {
    expect(computeStatus(2, 3)).toBe('partial');
  });
  it('returns done jika sudah cukup', () => {
    expect(computeStatus(3, 3)).toBe('done');
  });
  it('returns done jika melebihi kebutuhan', () => {
    expect(computeStatus(5, 3)).toBe('done');
  });
});

// ── Test getStatusInfo ────────────────────────────────────────────────────────
describe('getStatusInfo', () => {
  it('status done → label Lengkap', () => {
    expect(getStatusInfo('done').label).toBe('Lengkap');
  });
  it('status partial → label Belum Lengkap', () => {
    expect(getStatusInfo('partial').label).toBe('Belum Lengkap');
  });
  it('status missing → label Kosong', () => {
    expect(getStatusInfo('missing').label).toBe('Kosong');
  });
});

// ── Test getDeadlineInfo ──────────────────────────────────────────────────────
describe('getDeadlineInfo', () => {
  it('returns null jika tidak ada deadline', () => {
    expect(getDeadlineInfo(undefined)).toBeNull();
  });
  it('returns urgent jika deadline sudah lewat', () => {
    const kemarin = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    expect(getDeadlineInfo(kemarin)?.urgent).toBe(true);
  });
  it('returns urgent jika deadline 2 hari lagi', () => {
    const duaHari = new Date(Date.now() + 2 * 86400000).toISOString().slice(0, 10);
    expect(getDeadlineInfo(duaHari)?.urgent).toBe(true);
  });
  it('returns tidak urgent jika masih 10 hari lagi', () => {
    const sepuluhHari = new Date(Date.now() + 10 * 86400000).toISOString().slice(0, 10);
    expect(getDeadlineInfo(sepuluhHari)?.urgent).toBe(false);
  });
});

// ── Test catPercent ───────────────────────────────────────────────────────────
describe('catPercent', () => {
  it('returns 0 jika tidak ada item', () => {
    expect(catPercent([])).toBe(0);
  });
  it('returns 100 jika semua done', () => {
    const items = [{ status: 'done' }, { status: 'done' }];
    expect(catPercent(items)).toBe(100);
  });
  it('returns 50 jika setengah done', () => {
    const items = [{ status: 'done' }, { status: 'missing' }];
    expect(catPercent(items)).toBe(50);
  });
  it('returns 0 jika semua missing', () => {
    const items = [{ status: 'missing' }, { status: 'missing' }];
    expect(catPercent(items)).toBe(0);
  });
});