const KEY = "rms.vacancies.v1";

export function loadVacancies(defaultData = []) {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return defaultData;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : defaultData;
  } catch {
    return defaultData;
  }
}

export function saveVacancies(vacancies) {
  localStorage.setItem(KEY, JSON.stringify(vacancies));
}
