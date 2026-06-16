// 單位換算工具 - 根據天氣工具改寫
import { z } from "zod";
//import { OPENWEATHER_API_KEY } from "../config.js";
import { defineTool } from "../utils/func-tool.js";

/**
 * 單位換算函數
 * @param {Object} params - 參數物件
 * @param {number} params.value - 要轉換的數值
 * @param {string} params.from_unit - 原始單位
 * @param {string} params.to_unit - 目標單位
 * @returns {Object} 包含結果或錯誤訊息的物件
 */
async function convertUnit({ value, from_unit, to_unit }) {
  // 標準化單位（轉成小寫）
  const fromUnit = from_unit.toLowerCase();
  const toUnit = to_unit.toLowerCase();

  // 檢查相同單位
  if (fromUnit === toUnit) {
    return {
      value: value,
      from_unit: fromUnit,
      to_unit: toUnit,
      result: value,
      message: "轉換前後單位相同",
    };
  }

  // 溫度轉換：攝氏 ↔ 華氏
  if (
    (fromUnit === "c" && toUnit === "f") ||
    (fromUnit === "°c" && toUnit === "°f") ||
    (fromUnit === "celsius" && toUnit === "fahrenheit")
  ) {
    const result = (value * 9) / 5 + 32;
    return {
      value: value,
      from_unit: "C",
      to_unit: "F",
      result: parseFloat(result.toFixed(2)),
      formula: "°F = °C × 9/5 + 32",
    };
  }

  if (
    (fromUnit === "f" && toUnit === "c") ||
    (fromUnit === "°f" && toUnit === "°c") ||
    (fromUnit === "fahrenheit" && toUnit === "celsius")
  ) {
    const result = ((value - 32) * 5) / 9;
    return {
      value: value,
      from_unit: "F",
      to_unit: "C",
      result: parseFloat(result.toFixed(2)),
      formula: "°C = (°F - 32) × 5/9",
    };
  }

  // 距離轉換：公里 ↔ 英里
  if (
    (fromUnit === "km" && toUnit === "mile") ||
    (fromUnit === "kilometer" && toUnit === "mile")
  ) {
    const result = value * 0.621371;
    return {
      value: value,
      from_unit: "km",
      to_unit: "mile",
      result: parseFloat(result.toFixed(6)),
      formula: "1 km = 0.621371 mile",
    };
  }

  if (
    (fromUnit === "mile" && toUnit === "km") ||
    (fromUnit === "mile" && toUnit === "kilometer")
  ) {
    const result = value / 0.621371;
    return {
      value: value,
      from_unit: "mile",
      to_unit: "km",
      result: parseFloat(result.toFixed(6)),
      formula: "1 km = 0.621371 mile",
    };
  }

  // 重量轉換：公斤 ↔ 磅
  if (
    (fromUnit === "kg" && toUnit === "lb") ||
    (fromUnit === "kilogram" && toUnit === "lb") ||
    (fromUnit === "kilogram" && toUnit === "pound")
  ) {
    const result = value * 2.20462;
    return {
      value: value,
      from_unit: "kg",
      to_unit: "lb",
      result: parseFloat(result.toFixed(5)),
      formula: "1 kg = 2.20462 lb",
    };
  }

  if (
    (fromUnit === "lb" && toUnit === "kg") ||
    (fromUnit === "pound" && toUnit === "kg") ||
    (fromUnit === "pound" && toUnit === "kilogram")
  ) {
    const result = value / 2.20462;
    return {
      value: value,
      from_unit: "lb",
      to_unit: "kg",
      result: parseFloat(result.toFixed(5)),
      formula: "1 kg = 2.20462 lb",
    };
  }

  // 不支援的單位組合
  return {
    error: `不支援的單位組合：${from_unit} 轉換到 ${to_unit}。支援的轉換包括：C ↔ F、km ↔ mile、kg ↔ lb`,
    supported_conversions: [
      "C (攝氏) ↔ F (華氏)",
      "km (公里) ↔ mile (英里)",
      "kg (公斤) ↔ lb (磅)",
    ],
  };
}

/**
 * 單位換算工具定義
 * 使用 defineTool 定義工具，參數使用 Zod Schema
 */
export const convertUnitTool = defineTool({
  name: "convert_unit",
  description:
    "進行單位換算，支援溫度（攝氏 ↔ 華氏）、距離（公里 ↔ 英里）和重量（公斤 ↔ 磅）的轉換。",
  fn: convertUnit,
  parameters: z.object({
    value: z
      .number()
      .describe("要轉換的數值，例如 25、10、70"),
    from_unit: z
      .string()
      .describe("原始單位，可選：C（攝氏）、F（華氏）、km（公里）、mile（英里）、kg（公斤）、lb（磅）"),
    to_unit: z
      .string()
      .describe("目標單位，可選：C（攝氏）、F（華氏）、km（公里）、mile（英里）、kg（公斤）、lb（磅）"),
  }),
});
