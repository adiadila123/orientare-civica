const CONTROL_WEIGHTS = [2, 7, 9, 1, 4, 6, 3, 5, 8, 2, 7, 9];

export function isValidCnp(cnp: string): boolean {
  if (!/^\d{13}$/.test(cnp)) {
    return false;
  }

  const digits = cnp.split('').map(Number);
  const weightedSum = digits
    .slice(0, 12)
    .reduce((total, digit, index) => total + digit * CONTROL_WEIGHTS[index], 0);
  const remainder = weightedSum % 11;
  const controlDigit = remainder === 10 ? 1 : remainder;

  return controlDigit === digits[12];
}
