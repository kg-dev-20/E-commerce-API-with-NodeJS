// Computes age in whole years as of today from a date of birth.
export function calculateAge(dateOfBirth) {
  const dob = new Date(dateOfBirth);
  const today = new Date();

  let age = today.getFullYear() - dob.getFullYear();
  const hasHadBirthdayThisYear =
    today.getMonth() > dob.getMonth() ||
    (today.getMonth() === dob.getMonth() && today.getDate() >= dob.getDate());

  if (!hasHadBirthdayThisYear) age -= 1;
  return age;
}

export function meetsMinimumAge(dateOfBirth) {
  const minimumAge = Number(process.env.MINIMUM_AGE || 21);
  return calculateAge(dateOfBirth) >= minimumAge;
}
