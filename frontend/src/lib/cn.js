/**
 * Minimal className joiner. Falsy values are skipped so conditional classes
 * can be written inline without ternaries that leave "undefined" in the DOM.
 */
export default function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}
