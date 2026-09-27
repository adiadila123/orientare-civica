interface StepNumberProps {
  index: number;
  size?: 'sm' | 'lg';
}

export function StepNumber({ index, size = 'sm' }: StepNumberProps) {
  if (size === 'lg') {
    return (
      <span className="w-8 h-8 rounded-full bg-primary text-on-primary font-label-md text-label-md flex items-center justify-center shrink-0">
        {index}
      </span>
    );
  }

  return (
    <span className="w-6 h-6 rounded-full bg-secondary text-on-secondary text-label-sm font-label-sm flex items-center justify-center shrink-0">
      {index}
    </span>
  );
}
