export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function isValidCPF(cpf: string): boolean {
  const cleaned = cpf.replace(/[^\d]/g, '');
  if (cleaned.length !== 11 || /^(\d)\1+$/.test(cleaned)) return false;

  let sum = 0;
  for (let i = 0; i < 9; i++) {
    const digit = Number(cleaned[i]);
    sum += digit * (10 - i);
  }
  let rest = (sum * 10) % 11;
  if (rest === 10 || rest === 11) rest = 0;
  if (rest !== Number(cleaned[9])) return false;

  sum = 0;
  for (let i = 0; i < 10; i++) {
    const digit = Number(cleaned[i]);
    sum += digit * (11 - i);
  }
  rest = (sum * 10) % 11;
  if (rest === 10 || rest === 11) rest = 0;
  return rest === Number(cleaned[10]);
}

export function isValidPhone(phone: string): boolean {
  return /^\(?\d{2}\)?\s?9?\d{4}-?\d{4}$/.test(phone.trim());
}

export function isStrongPassword(password: string): boolean {
  return password.length >= 8;
}
