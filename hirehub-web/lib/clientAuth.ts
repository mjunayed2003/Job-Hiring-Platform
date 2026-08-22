export function getClientCookie(name: string): string | null {
  if (typeof document === "undefined") return null;

  const cookie = document.cookie
    .split("; ")
    .find((part) => part.startsWith(`${name}=`));

  if (!cookie) return null;

  return decodeURIComponent(cookie.slice(name.length + 1));
}

export function isJobSeekerUser(): boolean {
  return getClientCookie("auth-token") !== null && getClientCookie("user-role") === "JOB_SEEKER";
}