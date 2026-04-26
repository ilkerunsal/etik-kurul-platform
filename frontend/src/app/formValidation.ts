import type { ProfileForm, RegisterForm } from "../types";

const tcknPattern = /^\d{11}$/;
const birthDatePattern = /^\d{4}-\d{2}-\d{2}$/;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const guidPattern = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

function hasValue(value: string) {
  return value.trim().length > 0;
}

function isValidPastIsoDate(value: string) {
  if (!birthDatePattern.test(value)) {
    return false;
  }

  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  const isRealDate =
    date.getUTCFullYear() === year
    && date.getUTCMonth() === month - 1
    && date.getUTCDate() === day;

  if (!isRealDate) {
    return false;
  }

  const today = new Date();
  const todayUtc = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
  return date < todayUtc;
}

export function validateRegisterForm(form: RegisterForm) {
  const issues: string[] = [];

  if (!hasValue(form.firstName)) {
    issues.push("Ad zorunlu.");
  }

  if (!hasValue(form.lastName)) {
    issues.push("Soyad zorunlu.");
  }

  if (!tcknPattern.test(form.tckn)) {
    issues.push("TCKN 11 haneli sayi olmalidir.");
  }

  if (!isValidPastIsoDate(form.birthDate)) {
    issues.push("Dogum tarihi gecerli ve gecmiste bir YYYY-AA-GG tarihi olmalidir.");
  }

  if (!emailPattern.test(form.email)) {
    issues.push("Gecerli bir email adresi girilmelidir.");
  }

  if (!hasValue(form.phone)) {
    issues.push("Telefon zorunlu.");
  }

  if (!hasValue(form.password)) {
    issues.push("Sifre zorunlu.");
  } else {
    if (form.password.length < 8) {
      issues.push("Sifre en az 8 karakter olmalidir.");
    }

    if (!/[A-Z]/.test(form.password)) {
      issues.push("Sifre en az bir buyuk harf icermelidir.");
    }

    if (!/[a-z]/.test(form.password)) {
      issues.push("Sifre en az bir kucuk harf icermelidir.");
    }

    if (!/\d/.test(form.password)) {
      issues.push("Sifre en az bir rakam icermelidir.");
    }
  }

  return issues;
}

export function validateLoginFields(identifier: string, password: string) {
  const issues: string[] = [];

  if (!hasValue(identifier)) {
    issues.push("Email veya telefon zorunlu.");
  }

  if (!hasValue(password)) {
    issues.push("Sifre zorunlu.");
  }

  return issues;
}

export function validateContactCode(code: string) {
  return hasValue(code) ? [] : ["Dogrulama kodu bos olamaz."];
}

export function validateProfileForm(form: ProfileForm) {
  const issues: string[] = [];

  if (form.cvDocumentId && !guidPattern.test(form.cvDocumentId)) {
    issues.push("CV dokuman Id GUID formatinda olmalidir.");
  }

  return issues;
}

export function getProfileCompletionPreview(form: ProfileForm) {
  const fields = [
    ["Akademik unvan", form.academicTitle],
    ["Derece duzeyi", form.degreeLevel],
    ["Kurum", form.institutionName],
    ["Fakulte", form.facultyName],
    ["Bolum", form.departmentName],
    ["Pozisyon", form.positionTitle],
    ["Biyografi", form.biography],
    ["Uzmanlik ozeti", form.specializationSummary],
    ["E-imza tercihi", "present"],
    ["KEP adresi", form.kepAddress],
    ["CV dokuman Id", form.cvDocumentId],
  ] as const;

  const missing = fields
    .filter(([, value]) => !hasValue(value))
    .map(([label]) => label);
  const total = fields.length;
  const completed = total - missing.length;

  return {
    completed,
    missing,
    percent: Math.round((completed * 100) / total),
    total,
  };
}
