


export const getCellColor = (value) => {
  const [num1, num2] = value.split("/").map((v) => parseFloat(v.trim()));
  if (isNaN(num1) || isNaN(num2)) return {};
  return {
    backgroundColor: num1 < num2 ? "#f28b82" : "#b9f6ca",
  };
};
