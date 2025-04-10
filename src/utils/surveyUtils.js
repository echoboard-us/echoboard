// Shared utility functions for survey components
export const getRatingScale = (questionText) => {
  // Match patterns like "1-10", "0-5", etc.
  const match = questionText.match(/(\d+)\s*-\s*(\d+)/);
  if (match) {
    const min = parseInt(match[1]);
    const max = parseInt(match[2]);
    return Math.max(1, max - min + 1); // Ensure at least 1 star
  }
  return 5; // Default to 5 stars if no scale found
};
