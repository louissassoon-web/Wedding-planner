export function MarigoldMark({
  size = 28,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 80 80"
      fill="none"
      aria-hidden="true"
    >
      {Array.from({ length: 12 }, (_, i) => (
        <ellipse
          key={i}
          cx="40"
          cy="20"
          rx="8"
          ry="17"
          fill="currentColor"
          transform={`rotate(${i * 30} 40 40)`}
        />
      ))}
      <circle cx="40" cy="40" r="10" fill="var(--aperol, #f76520)" />
      <circle cx="40" cy="40" r="4" fill="var(--pink, #a62952)" />
    </svg>
  );
}
