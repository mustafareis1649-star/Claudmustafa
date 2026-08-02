// Static, English-only marketing strip (matches the "landing page is English"
// scope) — five quick reassurance points shown right under the hero.
const ITEMS = [
  {
    title: '100% Secure',
    desc: 'Your files are encrypted and protected.',
    color: '#4F6EF7',
    icon: (
      <path d="M12 2 4 5v6c0 5 3.4 8.7 8 9 4.6-.3 8-4 8-9V5l-8-3Z" stroke="#4F6EF7" strokeWidth="1.6" fill="none" strokeLinejoin="round" />
    ),
  },
  {
    title: 'Lightning Fast',
    desc: 'Process your files in seconds.',
    color: '#8B5CF6',
    icon: <path d="M13 2 4 14h6l-1 8 9-12h-6l1-8Z" stroke="#8B5CF6" strokeWidth="1.6" fill="none" strokeLinejoin="round" />,
  },
  {
    title: 'Cloud Based',
    desc: 'Access your files from anywhere, anytime.',
    color: '#0EA5A0',
    icon: <path d="M7 18a4.5 4.5 0 0 1-.5-8.98A5.5 5.5 0 0 1 17 9a4 4 0 0 1-1 7.9H7Z" stroke="#0EA5A0" strokeWidth="1.6" fill="none" strokeLinejoin="round" />,
  },
  {
    title: 'No Installation',
    desc: 'Use all tools directly in your browser.',
    color: '#4F6EF7',
    icon: (
      <>
        <path d="M12 3v12" stroke="#4F6EF7" strokeWidth="1.6" strokeLinecap="round" />
        <path d="M7 11l5 5 5-5" stroke="#4F6EF7" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M4 19h16" stroke="#4F6EF7" strokeWidth="1.6" strokeLinecap="round" />
      </>
    ),
  },
  {
    title: 'Free Forever',
    desc: 'All tools are free with no hidden costs.',
    color: '#E2A63B',
    icon: (
      <>
        <rect x="4" y="9" width="16" height="11" rx="1.5" stroke="#E2A63B" strokeWidth="1.6" fill="none" />
        <path d="M4 13h16" stroke="#E2A63B" strokeWidth="1.6" />
        <path d="M12 9v11M12 9c-1.8 0-3.4-1-3.4-2.5S9.8 4 11 4c1.5 0 1 3 1 5Zm0 0c1.8 0 3.4-1 3.4-2.5S13.2 4 12 4c-1.5 0 0 3 0 5Z" stroke="#E2A63B" strokeWidth="1.4" fill="none" />
      </>
    ),
  },
];

export default function TrustBar() {
  return (
    <div className="trust-bar">
      <div className="wrap">
        {ITEMS.map((item) => (
          <div className="trust-item" key={item.title}>
            <span className="t-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                {item.icon}
              </svg>
            </span>
            <div>
              <h4>{item.title}</h4>
              <p>{item.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
