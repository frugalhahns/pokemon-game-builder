// Shared port-type -> wire color mapping, used by node definitions and the editor
// so that a "direction" plug is always blue, a "trigger" plug is always orange, etc.
// This is the same visual language Game Builder Garage uses for its Nodon connectors.
export const PortColors = {
  vector2: '#3b82f6', // movement / direction
  object: '#22c55e', // a reference to a Pokémon on the stage
  trigger: '#f97316', // a one-shot pulse (touched, scored, etc.)
  number: '#a855f7', // a plain number (like a score)
  boolean: '#14b8a6', // a held true/false state (e.g. "currently touching"), as opposed to a one-shot trigger pulse
};
