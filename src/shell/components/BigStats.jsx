const STATS = [
  { num: '1,000,000+', label: 'Happy Users', color: '#8B5CF6' },
  { num: '200M+', label: 'Files Processed', color: '#0EA5A0' },
  { num: '180+', label: 'Countries', color: '#4F6EF7' },
  { num: '99.99%', label: 'Uptime Guarantee', color: '#E2A63B' },
];

export default function BigStats() {
  return (
    <section className="big-stats">
      <div className="wrap">
        {STATS.map((s) => (
          <div className="big-stat" key={s.label}>
            <span className="b-icon" style={{ background: `${s.color}26` }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="8" stroke={s.color} strokeWidth="1.6" fill="none" />
                <path d="M9 12.5l2 2 4-4.5" stroke={s.color} strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            <div>
              <h3>{s.num}</h3>
              <p>{s.label}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
