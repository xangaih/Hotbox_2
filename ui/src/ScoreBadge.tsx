interface ScoreBadgeProps {
  score: number;
  size?: 'sm' | 'md';
}

export default function ScoreBadge({ score, size = 'md' }: ScoreBadgeProps) {
  const colorClasses =
    score >= 70
      ? 'bg-green-100 text-green-800 border border-green-200'
      : score >= 40
      ? 'bg-amber-100 text-amber-800 border border-amber-200'
      : 'bg-red-100 text-red-800 border border-red-200';

  const sizeClasses = size === 'sm' ? 'text-xs px-1.5 py-0.5' : 'text-sm px-2 py-1';

  return (
    <span className={`inline-flex items-center font-semibold rounded-full ${colorClasses} ${sizeClasses}`}>
      {score}
    </span>
  );
}
