export const getRatingScale = (questionText) => {
  const match = questionText.match(/(\d+)\s*-\s*(\d+)/);
  if (match) {
    const min = parseInt(match[1]);
    const max = parseInt(match[2]);
    return Math.max(1, max - min + 1);
  }
  return 5;
};
